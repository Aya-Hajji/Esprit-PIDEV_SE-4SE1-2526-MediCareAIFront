import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subscription } from 'rxjs';
import { catchError, finalize, take, timeout } from 'rxjs/operators';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { AvailabilityDTO } from '../../../../shared/models/appointment.model';
import { User } from '../../../../shared/models/user.model';
import { UserService } from '../../../../shared/services/user.service';

@Component({
  selector: 'app-availability-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability-picker.component.html',
  styleUrls: ['./availability-picker.component.css']
})
export class AvailabilityPickerComponent implements OnInit {
  private readonly savedDoctorIdsKey = 'savedDoctorIds';
  doctors: User[] = [];
  doctorSearchTerm = '';
  selectedDoctorId: number | null = null;
  doctorLookupUnavailable = false;
  selectedDate = '';
  selectedConsultationType: 'IN_PERSON' | 'VIDEO' | 'PHONE' = 'VIDEO';

  availableSlots: AvailabilityDTO[] = [];
  loadingDoctors = false;
  loadingSlots = false;
  savingAvailability = false;
  deletingAvailabilityId: number | null = null;
  error: string | null = null;
  success: string | null = null;

  editingAvailabilityId: number | null = null;
  availabilityStartTime = '';
  availabilityEndTime = '';
  availabilityMaxAppointments = 1;
  availabilityBlocked = false;
  private saveWatchdogId: ReturnType<typeof setTimeout> | null = null;
  private saveSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.selectedDate = new Date().toISOString().slice(0, 10);
    this.loadSavedDoctors();
    this.loadDoctors();
  }

  ngOnDestroy(): void {
    this.clearSaveWatchdog();
    if (this.saveSubscription) {
      this.saveSubscription.unsubscribe();
      this.saveSubscription = null;
    }
  }

  loadDoctors(): void {
    this.loadingDoctors = true;
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = this.mergeDoctors(this.doctors, doctors);
        this.loadingDoctors = false;

        if (this.doctors.length === 0) {
          this.doctorLookupUnavailable = true;
          this.error = 'Doctor list is unavailable for your account. Enter Doctor ID manually to continue.';
          return;
        }

        this.doctorLookupUnavailable = false;
        this.error = null;
      },
      error: () => {
        this.loadingDoctors = false;
        this.doctorLookupUnavailable = true;
        this.error = 'Failed to load doctor list. Refresh the page or try again later.';
      }
    });
  }

  getDoctorLabel(doctor: User): string {
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return (fullName || doctor.fullName || doctor.username || doctor.email || 'Doctor').trim();
  }

  get filteredDoctors(): User[] {
    const term = this.doctorSearchTerm.trim().toLowerCase();
    if (!term) {
      return this.doctors;
    }

    return this.doctors.filter((doctor) => {
      const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim().toLowerCase();
      const haystack = [
        doctor.username?.toLowerCase(),
        doctor.email?.toLowerCase(),
        doctor.fullName?.toLowerCase(),
        fullName,
        doctor.phoneNumber?.toLowerCase(),
        doctor.id ? String(doctor.id) : ''
      ];

      return haystack.some((value) => !!value && value.includes(term));
    });
  }

  loadAvailableSlots(resetMessages = true): void {
    if (!this.selectedDoctorId || this.selectedDoctorId <= 0) {
      this.error = 'Please select a valid doctor.';
      return;
    }

    const selectedDoctorId = this.selectedDoctorId;
    this.loadingSlots = true;
    if (resetMessages) {
      this.error = null;
      this.success = null;
    }
    this.availableSlots = [];

    this.appointmentService
      .getDoctorAvailability(selectedDoctorId)
      .pipe(
        timeout(15000),
        catchError(() => {
          this.error = 'Failed to load available slots. Please check backend availability and doctor ID.';
          return of([] as AvailabilityDTO[]);
        }),
        finalize(() => {
          this.loadingSlots = false;
        })
      )
      .subscribe((slots) => {
        this.persistDoctorId(selectedDoctorId);
        const normalizedSlots = Array.isArray(slots) ? slots : [];

        const filteredSlots = normalizedSlots.filter((slot) => this.isOnSelectedDate(slot.startTime));
        // If backend returns a non-standard datetime string, avoid hiding valid rows.
        this.availableSlots = filteredSlots.length > 0 ? filteredSlots : normalizedSlots;
      });
  }

  startEditAvailability(slot: AvailabilityDTO): void {
    if (!slot.id) {
      this.error = 'Cannot edit availability: missing slot ID.';
      return;
    }

    this.editingAvailabilityId = slot.id;
    this.availabilityStartTime = this.toDateTimeLocal(slot.startTime);
    this.availabilityEndTime = this.toDateTimeLocal(slot.endTime);
    this.availabilityMaxAppointments = slot.maxAppointments || 1;
    this.availabilityBlocked = slot.blocked === true;
    this.error = null;
    this.success = null;
  }

  clearAvailabilityForm(): void {
    this.editingAvailabilityId = null;
    this.availabilityStartTime = '';
    this.availabilityEndTime = '';
    this.availabilityMaxAppointments = 1;
    this.availabilityBlocked = false;
  }

  saveAvailability(): void {
    if (!this.selectedDoctorId || this.selectedDoctorId <= 0) {
      this.error = 'Please select a valid doctor before saving availability.';
      return;
    }

    const start = new Date(this.availabilityStartTime);
    const end = new Date(this.availabilityEndTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      this.error = 'Availability end time must be after start time.';
      return;
    }

    const maxAppointments = Number(this.availabilityMaxAppointments);
    if (!Number.isInteger(maxAppointments) || maxAppointments <= 0) {
      this.error = 'Max appointments must be a positive integer.';
      return;
    }

    const payload: AvailabilityDTO = {
      doctorId: this.selectedDoctorId,
      // Backend typically expects LocalDateTime format without timezone suffix.
      startTime: this.toBackendDateTime(start),
      endTime: this.toBackendDateTime(end),
      maxAppointments,
      blocked: this.availabilityBlocked === true
    };

    this.savingAvailability = true;
    this.error = null;
    this.success = null;
    this.cdr.detectChanges();
    this.startSaveWatchdog();

    if (this.saveSubscription) {
      this.saveSubscription.unsubscribe();
      this.saveSubscription = null;
    }

    try {
      const request$ = this.editingAvailabilityId
        ? this.appointmentService.updateAvailability(this.editingAvailabilityId, payload)
        : this.appointmentService.createAvailability(payload);

      this.saveSubscription = request$
        .pipe(
          take(1),
          timeout(15000),
          finalize(() => {
            this.savingAvailability = false;
            this.clearSaveWatchdog();
            this.saveSubscription = null;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.selectedDate = this.availabilityStartTime ? this.availabilityStartTime.slice(0, 10) : this.selectedDate;
            this.success = this.editingAvailabilityId
              ? 'Availability updated successfully.'
              : 'Availability created successfully.';
            this.clearAvailabilityForm();
            this.loadAvailableSlots(false);
          },
          error: (error: HttpErrorResponse) => {
            this.error = this.extractApiErrorMessage(error, 'Failed to save availability slot.');
            this.cdr.detectChanges();
          }
        });
    } catch (error) {
      this.savingAvailability = false;
      this.clearSaveWatchdog();
      this.saveSubscription = null;
      this.error = 'Failed to start save request.';
      console.error('Availability save initialization error:', error);
      this.cdr.detectChanges();
    }
  }

  cancelAvailabilitySave(): void {
    if (this.saveSubscription) {
      this.saveSubscription.unsubscribe();
      this.saveSubscription = null;
    }

    this.savingAvailability = false;
    this.clearSaveWatchdog();
    this.error = 'Save request cancelled.';
    this.cdr.detectChanges();
  }

  private startSaveWatchdog(): void {
    this.clearSaveWatchdog();
    this.saveWatchdogId = setTimeout(() => {
      if (!this.savingAvailability) {
        return;
      }

      if (this.saveSubscription) {
        this.saveSubscription.unsubscribe();
        this.saveSubscription = null;
      }

      this.savingAvailability = false;
      this.error = 'Save request timed out. Please retry.';
      this.cdr.detectChanges();
    }, 8000);
  }

  private clearSaveWatchdog(): void {
    if (!this.saveWatchdogId) {
      return;
    }

    clearTimeout(this.saveWatchdogId);
    this.saveWatchdogId = null;
  }

  deleteAvailability(slot: AvailabilityDTO): void {
    if (!slot.id) {
      this.error = 'Cannot delete availability: missing slot ID.';
      return;
    }

    if (!confirm('Delete this availability slot?')) {
      return;
    }

    this.deletingAvailabilityId = slot.id;
    this.error = null;
    this.success = null;

    this.appointmentService
      .deleteAvailability(slot.id)
      .pipe(finalize(() => (this.deletingAvailabilityId = null)))
      .subscribe({
        next: () => {
          this.success = 'Availability slot deleted successfully.';
          this.loadAvailableSlots();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.extractApiErrorMessage(error, 'Failed to delete availability slot.');
        }
      });
  }

  private toBackendDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  private extractApiErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const apiError = error?.error;

    if (typeof apiError === 'string' && apiError.trim()) {
      return apiError;
    }

    if (apiError && typeof apiError === 'object') {
      const source = apiError as Record<string, unknown>;
      const message = source['message'] || source['error'] || source['detail'];
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return fallback;
  }

  bookSlot(slot: AvailabilityDTO): void {
    if (!slot.doctorId || !slot.startTime || !slot.endTime) {
      this.error = 'Selected slot is missing required data.';
      return;
    }

    const start = new Date(slot.startTime);
    const windowEnd = new Date(slot.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(windowEnd.getTime()) || windowEnd <= start) {
      this.error = 'This availability row has invalid start/end times.';
      return;
    }

    // Appointments are a short visit inside the availability window — not the whole block.
    const startMs = start.getTime();
    const windowEndMs = windowEnd.getTime();
    const oneHourLater = startMs + 60 * 60 * 1000;
    let appointmentEndMs = Math.min(oneHourLater, windowEndMs);
    const minEnd = startMs + 15 * 60 * 1000;
    if (appointmentEndMs < minEnd) {
      appointmentEndMs = Math.min(minEnd, windowEndMs);
    }
    if (appointmentEndMs <= startMs) {
      this.error = 'This block is too short to book (need at least 15 minutes).';
      return;
    }

    const appointmentEndIso = new Date(appointmentEndMs).toISOString();

    this.router.navigate(['/appointments/create'], {
      replaceUrl: true,
      queryParams: {
        doctorId: slot.doctorId,
        startTime: this.toDateTimeLocal(slot.startTime),
        endTime: this.toDateTimeLocal(appointmentEndIso),
        consultationType: this.selectedConsultationType
      }
    });
  }

  private isOnSelectedDate(isoDate: string): boolean {
    if (!this.selectedDate || !isoDate) {
      return false;
    }

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return true;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    return formatted === this.selectedDate;
  }

  private toDateTimeLocal(isoDate: string): string {
    const date = new Date(isoDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  private loadSavedDoctors(): void {
    try {
      const raw = localStorage.getItem(this.savedDoctorIdsKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return;
      }

      const saved = parsed
        .filter((id) => typeof id === 'number' && id > 0)
        .map((id) => ({
          id,
          role: 'DOCTOR' as const,
          email: `doctor-${id}@local`,
          fullName: `Doctor #${id}`
        }));

      this.doctors = this.mergeDoctors(this.doctors, saved);
    } catch {
      // Ignore storage parsing errors.
    }
  }

  private persistDoctorId(id: number): void {
    if (!id || id <= 0) {
      return;
    }

    try {
      const raw = localStorage.getItem(this.savedDoctorIdsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'number' && v > 0) : [];
      if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem(this.savedDoctorIdsKey, JSON.stringify(ids));
      }

      this.loadSavedDoctors();
    } catch {
      // Ignore storage errors.
    }
  }

  private mergeDoctors(primary: User[], secondary: User[]): User[] {
    const result: User[] = [];
    const seen = new Set<number>();

    const push = (doctor: User) => {
      if (!doctor.id || seen.has(doctor.id)) {
        return;
      }
      seen.add(doctor.id);
      result.push(doctor);
    };

    primary.forEach(push);
    secondary.forEach(push);
    return result;
  }
}
