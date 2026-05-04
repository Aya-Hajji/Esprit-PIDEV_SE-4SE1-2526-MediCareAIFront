import { ChangeDetectorRef, Component, DestroyRef, NgZone, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/models/user.model';
import { AppointmentDTO, AppointmentMatchCandidate, AvailabilityConflict } from '../../../../shared/models/appointment.model';
import { getUserDisplayName } from '../../../../shared/utils/user-display';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './appointment-create.component.html',
  styleUrls: ['./appointment-create.component.css']
})
export class AppointmentCreateComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  appointmentForm: FormGroup;
  loading = false;
  error: string | null = null;
  userLookupUnavailable = false;
  /** True when query params contained a slot whose start time is already in the past. */
  slotPrefillStale = false;
  private usersLoaded = false;
  
  doctors: User[] = [];
  patients: User[] = [];
  doctorSearchTerm = '';
  patientSearchTerm = '';
  consultationTypes = ['IN_PERSON', 'VIDEO', 'PHONE'];
  loadingUsers = false;
  conflictWarnings: AvailabilityConflict[] = [];
  matchCandidates: AppointmentMatchCandidate[] = [];
  matchingLoading = false;

  activeBookingStep: 'people' | 'mode' | 'time' = 'people';

  readonly bookingWorkflowSteps: ReadonlyArray<{
    id: 'people' | 'mode' | 'time';
    short: string;
    label: string;
    hint: string;
  }> = [
    { id: 'people', short: '1', label: 'People', hint: 'Doctor & patient' },
    { id: 'mode', short: '2', label: 'Mode', hint: 'Video, phone, or in person' },
    { id: 'time', short: '3', label: 'Time', hint: 'Slot, zone, reason, checks' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {
    this.appointmentForm = this.formBuilder.group(
      {
        doctorId: ['', [Validators.required, Validators.min(1)]],
        patientId: ['', [Validators.required, Validators.min(1)]],
        startTime: ['', [Validators.required, this.futureDateValidator.bind(this)]],
        endTime: ['', Validators.required],
        consultationType: ['IN_PERSON', Validators.required],
        reasonForVisit: ['', [Validators.maxLength(500), this.trimmedMinLengthValidator(5)]],
        timeZone: ['UTC', [Validators.required, Validators.pattern(/^[A-Za-z_\/]+$/)]],
        urgent: [false]
      },
      { validators: this.endTimeAfterStartTimeValidator.bind(this) }
    );
  }

  futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value).getTime();
    const now = new Date().getTime();
    return selectedDate > now ? null : { 'pastDate': true };
  }

  endTimeAfterStartTimeValidator(group: AbstractControl): ValidationErrors | null {
    const startTime = (group as FormGroup)?.get('startTime')?.value;
    const endTime = (group as FormGroup)?.get('endTime')?.value;
    
    if (!startTime || !endTime) return null;
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    return end > start ? null : { 'endTimeBeforeStart': true };
  };

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.usersLoaded) {
        this.patchFromAvailabilityQuery();
        this.refreshViewAfterModelUpdate();
      }
    });
    this.loadUsers();
  }

  /**
   * Applies doctor / times / mode from the availability picker (or shared links).
   * Waits until doctors & patients are loaded so the doctor select shows the right option.
   */
  private patchFromAvailabilityQuery(): void {
    const q = this.route.snapshot.queryParamMap;
    const doctorId = q.get('doctorId');
    const startTime = q.get('startTime');
    const endTime = q.get('endTime');
    const consultationType = q.get('consultationType');

    if (!doctorId && !startTime && !endTime && !consultationType) {
      return;
    }

    this.slotPrefillStale = false;
    const patch: Record<string, string> = {};

    if (doctorId) {
      const n = Number(doctorId);
      if (Number.isInteger(n) && n > 0) {
        patch['doctorId'] = String(n);
      }
    }

    const allowedTypes = ['IN_PERSON', 'VIDEO', 'PHONE'] as const;
    if (consultationType && (allowedTypes as readonly string[]).includes(consultationType)) {
      patch['consultationType'] = consultationType;
    }

    let startInPast = false;
    if (startTime) {
      const st = new Date(startTime);
      if (!Number.isNaN(st.getTime())) {
        startInPast = st.getTime() <= Date.now();
      }
    }

    // Always bind query times into datetime-local (even if past) so fields are not blank; validator flags past dates.
    if (startTime && endTime) {
      patch['startTime'] = this.toDatetimeLocalInput(startTime);
      patch['endTime'] = this.toDatetimeLocalInput(endTime);
    } else if (startTime) {
      patch['startTime'] = this.toDatetimeLocalInput(startTime);
    }

    this.slotPrefillStale = startInPast;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && /^[A-Za-z_/]+$/.test(tz)) {
      patch['timeZone'] = tz;
    }

    this.appointmentForm.patchValue(patch);
    if (patch['startTime'] && !patch['endTime']) {
      this.onStartTimeChange();
    }
    this.appointmentForm.updateValueAndValidity({ emitEvent: false });
  }

  /** Ensures selects / datetime inputs repaint after async loads (avoid stale UI until a click). */
  private refreshViewAfterModelUpdate(): void {
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  /** Formats a date string for `<input type="datetime-local">` (local wall time, 16 chars). */
  private toDatetimeLocalInput(isoOrLocal: string): string {
    const date = new Date(isoOrLocal);
    if (Number.isNaN(date.getTime())) {
      return isoOrLocal.length >= 16 ? isoOrLocal.slice(0, 16) : isoOrLocal;
    }
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  getDoctorErrorMessage(): string {
    const control = this.appointmentForm.get('doctorId');
    if (control?.hasError('required')) return 'Doctor is required';
    if (control?.hasError('min')) return 'Please select a valid doctor';
    return 'Invalid doctor';
  }

  getPatientErrorMessage(): string {
    const control = this.appointmentForm.get('patientId');
    if (control?.hasError('required')) return 'Patient is required';
    if (control?.hasError('min')) return 'Please select a valid patient';
    return 'Invalid patient';
  }

  getReasonErrorMessage(): string {
    const control = this.appointmentForm.get('reasonForVisit');
    if (control?.hasError('maxlength')) return 'Reason for visit must not exceed 500 characters';
    if (control?.hasError('trimmedMinLength')) return 'Reason for visit must contain at least 5 characters';
    return 'Invalid reason for visit';
  }

  getStartTimeErrorMessage(): string {
    const control = this.appointmentForm.get('startTime');
    if (control?.hasError('required')) return 'Start time is required';
    if (control?.hasError('pastDate')) return 'Appointment must be scheduled for a future date and time';
    return 'Invalid start time';
  }

  getEndTimeErrorMessage(): string {
    const control = this.appointmentForm.get('endTime');
    if (control?.hasError('required')) return 'End time is required';
    return 'Invalid end time';
  }

  getTimeZoneErrorMessage(): string {
    const control = this.appointmentForm.get('timeZone');
    if (control?.hasError('required')) return 'Time zone is required';
    if (control?.hasError('pattern')) return 'Time zone format is invalid (e.g., UTC, America/New_York)';
    return 'Invalid time zone';
  }

  loadUsers(): void {
    this.loadingUsers = true;
    forkJoin({
      doctors: this.userService.getDoctors(),
      patients: this.userService.getPatients()
    }).subscribe({
      next: ({ doctors, patients }) => {
        this.doctors = doctors;
        this.patients = patients;
        this.loadingUsers = false;
        this.usersLoaded = true;
        this.userLookupUnavailable = this.doctors.length === 0 || this.patients.length === 0;

        if (this.doctors.length === 0 || this.patients.length === 0) {
          this.error = 'User lists are unavailable. You can still create an appointment by entering doctor and patient IDs manually.';
        }
        this.patchFromAvailabilityQuery();
        this.refreshViewAfterModelUpdate();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load doctors and patients. Use manual doctor/patient IDs to continue.';
        this.userLookupUnavailable = true;
        this.loadingUsers = false;
        this.usersLoaded = true;
        this.patchFromAvailabilityQuery();
        this.refreshViewAfterModelUpdate();
      }
    });
  }

  get f() {
    return this.appointmentForm.controls;
  }

  selectConsultationType(type: AppointmentDTO['consultationType']): void {
    this.appointmentForm.patchValue({ consultationType: type });
  }

  onStartTimeChange(): void {
    const startTime = this.appointmentForm.get('startTime')?.value;
    if (startTime) {
      // Automatically set end time to 1 hour after start time
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      
      // Format to datetime-local format
      const endTimeString = endDate.toISOString().slice(0, 16);
      this.appointmentForm.patchValue({ endTime: endTimeString });
    }
  }

  getUserLabel(user: User): string {
    return getUserDisplayName(user);
  }

  doctorNameForMatch(doctorId: number): string {
    const d = this.doctors.find((doc) => doc.id === doctorId);
    return d ? getUserDisplayName(d) : 'Doctor';
  }

  get filteredDoctors(): User[] {
    return this.filterUsers(this.doctors, this.doctorSearchTerm);
  }

  get filteredPatients(): User[] {
    return this.filterUsers(this.patients, this.patientSearchTerm);
  }

  private filterUsers(users: User[], searchTerm: string): User[] {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) => {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim().toLowerCase();
      const haystack = [
        user.username?.toLowerCase(),
        user.email?.toLowerCase(),
        user.fullName?.toLowerCase(),
        fullName,
        user.phoneNumber?.toLowerCase(),
        user.id ? String(user.id) : ''
      ];

      return haystack.some((value) => !!value && value.includes(term));
    });
  }

  onSubmit(): void {
    if (this.hasSameUserSelection()) {
      this.error = 'Doctor and patient must be different users.';
      return;
    }

    if (this.appointmentForm.invalid) {
      Object.keys(this.appointmentForm.controls).forEach(key => {
        this.appointmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    const validationError = this.validateAppointmentInput();
    if (validationError) {
      this.error = validationError;
      return;
    }

    this.loading = true;
    this.error = null;

    const appointmentData = {
      doctorId: parseInt(this.appointmentForm.value.doctorId),
      patientId: parseInt(this.appointmentForm.value.patientId),
      startTime: new Date(this.appointmentForm.value.startTime).toISOString(),
      endTime: new Date(this.appointmentForm.value.endTime).toISOString(),
      consultationType: this.appointmentForm.value.consultationType,
      reasonForVisit: this.readTrimmed(this.appointmentForm.value.reasonForVisit) || undefined,
      timeZone: this.readTrimmed(this.appointmentForm.value.timeZone) || 'UTC',
      urgent: this.appointmentForm.value.urgent === true,
      status: 'SCHEDULED' as const
    };

    this.appointmentService.detectAvailabilityConflicts(appointmentData).subscribe({
      next: (conflicts) => {
        this.conflictWarnings = conflicts;
        const blockingConflict = conflicts.find((conflict) => conflict.severity === 'BLOCKER');
        if (blockingConflict) {
          this.loading = false;
          this.error = blockingConflict.message;
          this.findBestMatches();
          return;
        }

        this.persistAppointment(appointmentData);
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to validate availability conflicts.';
      }
    });
  }

  findBestMatches(): void {
    const formValue = this.appointmentForm.value;
    const startTime = formValue.startTime ? new Date(formValue.startTime).toISOString() : undefined;
    const endTime = formValue.endTime ? new Date(formValue.endTime).toISOString() : undefined;

    this.matchingLoading = true;
    this.appointmentService.findBestAppointmentMatches({
      patientId: Number(formValue.patientId) || undefined,
      preferredDoctorId: Number(formValue.doctorId) || undefined,
      desiredStartTime: startTime,
      desiredEndTime: endTime,
      consultationType: formValue.consultationType,
      urgent: formValue.urgent === true,
      reasonForVisit: this.readTrimmed(formValue.reasonForVisit) || undefined
    }).subscribe({
      next: (candidates) => {
        this.matchCandidates = candidates;
        this.matchingLoading = false;
      },
      error: () => {
        this.matchingLoading = false;
        this.matchCandidates = [];
      }
    });
  }

  applyMatchCandidate(candidate: AppointmentMatchCandidate): void {
    this.appointmentForm.patchValue({
      doctorId: candidate.doctorId,
      startTime: this.toDateTimeLocal(candidate.startTime),
      endTime: this.toDateTimeLocal(candidate.endTime),
      consultationType: candidate.consultationType
    });
    this.conflictWarnings = candidate.conflicts;
  }

  private persistAppointment(appointmentData: AppointmentDTO): void {
    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (created) => {
        this.loading = false;
        this.conflictWarnings = [];
        this.matchCandidates = [];
        this.navigateToListAfterCreate(created);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to create appointment';
        console.error('Error creating appointment:', error);
      }
    });
  }

  onCancel(): void {
    this.navigateToAppointmentsList();
  }

  navigateToAvailability(): void {
    this.router.navigate(['/appointments/availability']);
  }

  scrollToBookingSection(stepId: 'people' | 'mode' | 'time'): void {
    this.activeBookingStep = stepId;
    const el = document.getElementById(`booking-${stepId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private navigateToAppointmentsList(): void {
    this.router.navigate(this.appointmentsListCommands());
  }

  private appointmentsListCommands(): string[] {
    return this.router.url.startsWith('/admin') ? ['/admin', 'appointments'] : ['/appointments'];
  }

  private navigateToListAfterCreate(created: AppointmentDTO): void {
    const base = this.appointmentsListCommands();
    const qp =
      created?.id != null ? { created: String(created.id) } : { scheduled: '1' };
    void this.router.navigate(base, { queryParams: qp, replaceUrl: true });
  }

  hasSameUserSelection(): boolean {
    const doctorId = Number(this.appointmentForm.value.doctorId);
    const patientId = Number(this.appointmentForm.value.patientId);
    return Number.isInteger(doctorId) && Number.isInteger(patientId) && doctorId > 0 && patientId > 0 && doctorId === patientId;
  }

  isSubmitDisabled(): boolean {
    return this.loading || this.appointmentForm.invalid || this.hasSameUserSelection();
  }

  private validateAppointmentInput(): string | null {
    const doctorId = Number(this.appointmentForm.value.doctorId);
    const patientId = Number(this.appointmentForm.value.patientId);
    const startTime = new Date(this.appointmentForm.value.startTime);
    const endTime = new Date(this.appointmentForm.value.endTime);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return 'Doctor ID must be a positive number.';
    }

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return 'Patient ID must be a positive number.';
    }

    if (doctorId === patientId) {
      return 'Doctor and patient must be different users.';
    }

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return 'Start and end times are required.';
    }

    if (endTime <= startTime) {
      return 'End time must be after start time.';
    }

    const durationMin = (endTime.getTime() - startTime.getTime()) / 60000;
    if (durationMin < 15) {
      return 'Minimum consultation length is 15 minutes.';
    }

    if (durationMin > 240) {
      return 'Maximum consultation length is 240 minutes; split into multiple slots if needed.';
    }

    return null;
  }

  private readTrimmed(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private toDateTimeLocal(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  private trimmedMinLengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = this.readTrimmed(control.value);
      if (!value) {
        return null;
      }

      return value.length >= minLength ? null : { trimmedMinLength: true };
    };
  }
}
