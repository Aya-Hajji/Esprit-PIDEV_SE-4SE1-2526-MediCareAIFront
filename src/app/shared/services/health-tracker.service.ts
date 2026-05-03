import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HealthAlert, PregnancyCheckup, PregnancyTracking, WellBeingMetric } from '../models/health-tracking.model';

type HealthTrackerPayload = {
  id?: number;
  userId?: number;
  [key: string]: unknown;
};

@Injectable({
  providedIn: 'root'
})
export class HealthTrackerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  private readonly moodsUrl = `${this.baseUrl}/moods`;
  private readonly stressUrl = `${this.baseUrl}/stresss`;
  private readonly sleepsUrl = `${this.baseUrl}/sleeps`;
  private readonly activitiesUrl = `${this.baseUrl}/activities`;
  private readonly wellBeingMetricsUrl = `${this.baseUrl}/well-being-metrics`;
  private readonly medicationRemindersUrl = `${this.baseUrl}/medication-reminders`;
  private readonly medicationSchedulesUrl = `${this.baseUrl}/medication-schedules`;
  private readonly pregnancyTrackingsUrl = `${this.baseUrl}/pregnancy-trackings`;
  private readonly pregnancyCheckupsUrl = `${this.baseUrl}/pregnancy-checkups`;
  private readonly alertsUrl = `${this.baseUrl}/alerts`;

  // ==================== MOOD ====================

  logMood(payload: any): Observable<HealthTrackerPayload> {
    return this.http.post<HealthTrackerPayload>(this.moodsUrl, payload);
  }

  getMoodHistory(userId: number, _dateRange: string = '7d'): Observable<HealthTrackerPayload[]> {
    // Swagger: GET /moods/user/{userId}
    return this.http.get<HealthTrackerPayload[]>(`${this.moodsUrl}/user/${userId}`);
  }

  getAllMoods(): Observable<HealthTrackerPayload[]> {
    return this.http.get<HealthTrackerPayload[]>(this.moodsUrl);
  }

  getMoodById(id: number): Observable<HealthTrackerPayload> {
    return this.http.get<HealthTrackerPayload>(`${this.moodsUrl}/${id}`);
  }

  updateMood(payload: any): Observable<HealthTrackerPayload> {
    if (!payload.id) {
      throw new Error('Mood id is required for update');
    }

    const { id, ...body } = payload;
    return this.http.put<HealthTrackerPayload>(`${this.moodsUrl}/${id}`, body);
  }

  deleteMood(id: number): Observable<void> {
    return this.http.delete<void>(`${this.moodsUrl}/${id}`);
  }

  // ==================== STRESS ====================

  logStress(payload: any): Observable<HealthTrackerPayload> {
    console.log('HealthTrackerService.logStress - Sending to:', this.stressUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    return this.http.post<HealthTrackerPayload>(this.stressUrl, payload).pipe(
      // Log response for debugging
      map((response) => {
        console.log('Stress response:', response);
        return response;
      })
    );
  }

  getStressHistory(userId: number, _dateRange: string = '7d'): Observable<HealthTrackerPayload[]> {
    // Swagger list does not expose a user-specific endpoint for Stress,
    // so we fetch all and filter client-side.
    return this.getAllStress().pipe(map((items) => items.filter((item) => Number(item.userId) === Number(userId))));
  }

  getAllStress(): Observable<HealthTrackerPayload[]> {
    return this.http.get<HealthTrackerPayload[]>(this.stressUrl);
  }

  getStressById(id: number): Observable<HealthTrackerPayload> {
    return this.http.get<HealthTrackerPayload>(`${this.stressUrl}/${id}`);
  }

  updateStress(payload: any): Observable<HealthTrackerPayload> {
    if (!payload.id) {
      throw new Error('Stress id is required for update');
    }

    const { id, ...body } = payload;
    return this.http.put<HealthTrackerPayload>(`${this.stressUrl}/${id}`, body);
  }

  deleteStress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.stressUrl}/${id}`);
  }

  // ==================== SLEEP ====================

  logSleep(payload: any): Observable<HealthTrackerPayload> {
    return this.http.post<HealthTrackerPayload>(this.sleepsUrl, payload);
  }

  getSleepHistory(userId: number, _dateRange: string = '7d'): Observable<HealthTrackerPayload[]> {
    // Swagger list does not expose a user-specific endpoint for Sleep,
    // so we fetch all and filter client-side.
    return this.getAllSleeps().pipe(map((items) => items.filter((item) => Number(item.userId) === Number(userId))));
  }

  getAllSleeps(): Observable<HealthTrackerPayload[]> {
    return this.http.get<HealthTrackerPayload[]>(this.sleepsUrl);
  }

  getSleepById(id: number): Observable<HealthTrackerPayload> {
    return this.http.get<HealthTrackerPayload>(`${this.sleepsUrl}/${id}`);
  }

  updateSleep(payload: any): Observable<HealthTrackerPayload> {
    if (!payload.id) {
      throw new Error('Sleep id is required for update');
    }

    const { id, ...body } = payload;
    return this.http.put<HealthTrackerPayload>(`${this.sleepsUrl}/${id}`, body);
  }

  deleteSleep(id: number): Observable<void> {
    return this.http.delete<void>(`${this.sleepsUrl}/${id}`);
  }

  // ==================== ACTIVITY ====================

  logActivity(payload: any): Observable<HealthTrackerPayload> {
    return this.http.post<HealthTrackerPayload>(this.activitiesUrl, payload);
  }

  getActivityHistory(userId: number, _dateRange: string = '7d'): Observable<HealthTrackerPayload[]> {
    // Keep the API surface compatible with older UI code; backend swagger does not list a user-specific activity endpoint.
    return this.getAllActivities().pipe(map((items) => items.filter((item) => Number(item.userId) === Number(userId))));
  }

  getAllActivities(): Observable<HealthTrackerPayload[]> {
    return this.http.get<HealthTrackerPayload[]>(this.activitiesUrl);
  }

  getActivityById(id: number): Observable<HealthTrackerPayload> {
    return this.http.get<HealthTrackerPayload>(`${this.activitiesUrl}/${id}`);
  }

  updateActivity(payload: HealthTrackerPayload): Observable<HealthTrackerPayload> {
    if (!payload.id) {
      throw new Error('Activity id is required for update');
    }

    const { id, ...body } = payload;
    return this.http.put<HealthTrackerPayload>(`${this.activitiesUrl}/${id}`, body);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.activitiesUrl}/${id}`);
  }

  // ==================== WELL-BEING METRICS ====================

  getWellBeingMetrics(): Observable<WellBeingMetric[]> {
    return this.http.get<WellBeingMetric[]>(this.wellBeingMetricsUrl);
  }

  getWellBeingMetricById(id: number): Observable<WellBeingMetric> {
    return this.http.get<WellBeingMetric>(`${this.wellBeingMetricsUrl}/${id}`);
  }

  createWellBeingMetric(payload: HealthTrackerPayload): Observable<WellBeingMetric> {
    return this.http.post<WellBeingMetric>(this.wellBeingMetricsUrl, payload as Record<string, unknown>);
  }

  updateWellBeingMetric(id: number, payload: HealthTrackerPayload): Observable<WellBeingMetric> {
    return this.http.put<WellBeingMetric>(`${this.wellBeingMetricsUrl}/${id}`, payload as Record<string, unknown>);
  }

  deleteWellBeingMetric(id: number): Observable<void> {
    return this.http.delete<void>(`${this.wellBeingMetricsUrl}/${id}`);
  }

  // ==================== MEDICATION REMINDERS ====================

  getMedicationReminders(): Observable<HealthTrackerPayload[]> {
    return this.http.get<HealthTrackerPayload[]>(this.medicationRemindersUrl);
  }

  createMedicationReminder(payload: HealthTrackerPayload): Observable<HealthTrackerPayload> {
    return this.http.post<HealthTrackerPayload>(this.medicationRemindersUrl, payload);
  }

  updateMedicationReminder(payload: HealthTrackerPayload): Observable<HealthTrackerPayload> {
    if (!payload.id) {
      throw new Error('Medication reminder id is required for update');
    }

    const { id, ...body } = payload;
    return this.http.put<HealthTrackerPayload>(`${this.medicationRemindersUrl}/${id}`, body);
  }

  deleteMedicationReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicationRemindersUrl}/${id}`);
  }

  // ==================== MEDICATION SCHEDULES ====================

  getMedicationSchedules(): Observable<HealthTrackerPayload[]> {
    return this.http.get<HealthTrackerPayload[]>(this.medicationSchedulesUrl);
  }

  createMedicationSchedule(payload: HealthTrackerPayload): Observable<HealthTrackerPayload> {
    return this.http.post<HealthTrackerPayload>(this.medicationSchedulesUrl, payload);
  }

  updateMedicationSchedule(payload: HealthTrackerPayload): Observable<HealthTrackerPayload> {
    if (!payload.id) {
      throw new Error('Medication schedule id is required for update');
    }

    const { id, ...body } = payload;
    return this.http.put<HealthTrackerPayload>(`${this.medicationSchedulesUrl}/${id}`, body);
  }

  deleteMedicationSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicationSchedulesUrl}/${id}`);
  }

  // ==================== SMART ALERTS ====================

  getAlertById(alertId: number): Observable<HealthAlert> {
    return this.http.get<HealthAlert>(`${this.alertsUrl}/${alertId}`);
  }

  getUserAlerts(userId: number): Observable<HealthAlert[]> {
    return this.http.get<HealthAlert[]>(`${this.alertsUrl}/user/${userId}`);
  }

  getActiveAlerts(userId: number): Observable<HealthAlert[]> {
    return this.http.get<HealthAlert[]>(`${this.alertsUrl}/user/${userId}/active`);
  }

  ignoreAlert(alertId: number): Observable<void> {
    return this.http.post<void>(`${this.alertsUrl}/${alertId}/ignore`, {});
  }

  escalateIgnoredAlerts(userId: number): Observable<void> {
    return this.http.post<void>(`${this.alertsUrl}/escalate/${userId}`, {});
  }

  analyzeAlerts(userId: number): Observable<HealthAlert[]> {
    return this.http.post<HealthAlert[]>(`${this.alertsUrl}/analyze/${userId}`, {});
  }

  deleteAlert(alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.alertsUrl}/${alertId}`);
  }

  // ==================== PREGNANCY TRACKING ====================

  getPregnancyTracking(): Observable<PregnancyTracking[]> {
    return this.http.get<PregnancyTracking[]>(this.pregnancyTrackingsUrl);
  }

  addPregnancyTracking(payload: Partial<PregnancyTracking>): Observable<PregnancyTracking> {
    return this.http.post<PregnancyTracking>(this.pregnancyTrackingsUrl, payload);
  }

  deletePregnancyTracking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.pregnancyTrackingsUrl}/${id}`);
  }

  // ==================== PREGNANCY CHECKUPS ====================

  getPregnancyCheckups(): Observable<PregnancyCheckup[]> {
    return this.http.get<PregnancyCheckup[]>(this.pregnancyCheckupsUrl);
  }

  addPregnancyCheckup(payload: Partial<PregnancyCheckup>): Observable<PregnancyCheckup> {
    return this.http.post<PregnancyCheckup>(this.pregnancyCheckupsUrl, payload);
  }

  deletePregnancyCheckup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.pregnancyCheckupsUrl}/${id}`);
  }
}
