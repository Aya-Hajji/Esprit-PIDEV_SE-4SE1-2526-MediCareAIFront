# CRUD Verification Checklist (Appointments + Medical)

Use this sequence to verify frontend flows against currently exposed backend routes.

## Preconditions
- Backend is running at `http://localhost:8089/MediCareAI`.
- Frontend is running.
- You are authenticated in the app.
- Keep browser DevTools Network tab open.

## 1) Appointment Module Verification

### 1.1 Create appointment
- UI path: Admin -> Appointments -> Schedule Appointment.
- If doctor/patient dropdowns are empty, enter doctorId/patientId manually in fallback fields.
- Fill startTime/endTime/type and submit.
- Expect:
  - HTTP `POST /appointments` -> 2xx
  - New appointment appears in list.

### 1.2 Read appointment list and details
- UI path: Admin -> Appointments list.
- Open an appointment details page.
- Expect:
  - HTTP `GET /appointments` -> 2xx
  - HTTP `GET /appointments/{id}` -> 2xx

### 1.3 Update appointment (reschedule)
- From list or details, change start/end and save.
- Expect:
  - HTTP `PUT /appointments/{id}` -> 2xx
  - Updated time visible in list/details.

### 1.4 Cancel and no-show flows
- Cancel one appointment.
- Mark another as no-show.
- Expect:
  - Both actions call `PUT /appointments/{id}` with updated status.
  - Status becomes `CANCELLED` or `NO_SHOW` in UI.

### 1.5 Reminder CRUD-adjacent flows
- In details/list, schedule reminder and send now.
- Expect:
  - HTTP `POST /appointments/{appointmentId}/reminders/schedule` -> 2xx
  - HTTP `POST /appointments/{appointmentId}/reminders/send` -> 2xx
  - HTTP `GET /appointments/{appointmentId}/reminders` -> 2xx

### 1.6 Teleconsultation flow
- Open session room and start/join session.
- Expect:
  - HTTP `GET /appointments/{appointmentId}/teleconsultation` -> 2xx or empty state
  - HTTP `POST /appointments/{appointmentId}/teleconsultation/start` -> 2xx
  - HTTP `POST /appointments/{appointmentId}/teleconsultation/join` -> 2xx

## 2) Medical Records Module Verification

### 2.1 Create/read medical record
- UI path: Admin -> Medical -> Records tab.
- If patient dropdown is empty, enter patientId manually in fallback field.
- Create a record.
- Load records for the same patient.
- Expect:
  - HTTP `POST /medical-records` -> 2xx
  - HTTP `GET /medical-records/patient/{patientId}` -> 2xx

### 2.2 Update medical record (history/treatments)
- Open the record and add history item and treatment item.
- Expect:
  - HTTP `PUT /medical-records/{id}` -> 2xx
  - Items appear in the record details panel.

### 2.3 Delete medical record
- Delete the selected medical record.
- Expect:
  - HTTP `DELETE /medical-records/{id}` -> 2xx
  - Record removed from list after refresh.

### 2.4 Child entities create/read
- For an opened record, create one item for each section:
  - Prescription
  - Lab result
  - Medical image
  - Allergy
  - Visit note
- Expect create calls:
  - `POST /prescriptions`
  - `POST /lab-results`
  - `POST /medical-images`
  - `POST /allergies`
  - `POST /visit-notes`
- Expect read calls:
  - `GET /prescriptions/medical-record/{medicalRecordId}`
  - `GET /lab-results/medical-record/{medicalRecordId}`
  - `GET /medical-images/medical-record/{medicalRecordId}`
  - `GET /allergies/medical-record/{medicalRecordId}`
  - `GET /visit-notes/medical-record/{medicalRecordId}`

## 3) Known Non-Exposed Taxonomy Endpoints
- These are not currently present in backend OpenAPI and are intentionally guarded in frontend:
  - `/specialties`
  - `/diseases`
  - `/symptoms`
- Expected behavior in UI: informational message and no failing request storm.

## 4) Pass Criteria
- No console flood of repeated 500 errors.
- All operations above return 2xx (or controlled empty-state where documented).
- UI reflects state changes after create/update/delete.

## 5) If a step fails
Capture and share:
- Screen where it failed.
- Request method + URL.
- Response status + body.
- Minimal payload sent.

This is enough to patch the exact failing flow quickly.
