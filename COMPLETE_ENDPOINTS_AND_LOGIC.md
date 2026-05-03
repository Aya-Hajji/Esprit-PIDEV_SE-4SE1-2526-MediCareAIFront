# 🎯 MediCare AI - Complete Endpoints & Project Logic Reference

## 📋 Table of Contents
1. [Project Logic Overview](#project-logic-overview)
2. [All Endpoints by Category](#all-endpoints-by-category)
3. [Data Flow & Interactions](#data-flow--interactions)
4. [Feature Implementation Checklist](#feature-implementation-checklist)

---

## 🏗️ Project Logic Overview

### Project Architecture
```
Frontend (To Build)
    ↓ HTTP/REST
Backend (Spring Boot 4.0.4)
    ├─ 35+ Controllers (135+ Endpoints)
    ├─ 40+ Services (Business Logic)
    ├─ 40+ Entities (Data Models)
    └─ JWT Authentication (Bearer Tokens)
    ↓
Database (MySQL 8.0)
    ├─ Users (4 Roles: Patient, Doctor, Pharmacist, Admin)
    ├─ Appointments (Scheduling)
    ├─ Prescriptions (Doctor → Patient → Pharmacy)
    ├─ Medicines (E-Pharmacy Catalog)
    ├─ Medical Records (Documents, Images, Lab Results)
    ├─ Health Metrics (Mood, Stress, Sleep, Activity)
    └─ Orders (E-Commerce transactions)
```

### Core Business Flows

#### 1. User Registration & Authentication Flow
```
1. User Registration
   POST /auth/register
   ├─ Input: fullName, email, password, role
   ├─ Validation: Email uniqueness, password strength
   └─ Output: User created with PATIENT/DOCTOR/PHARMACIST role

2. Email Verification (Optional)
   POST /auth/register-with-verification
   POST /auth/verify-email (6-digit code)
   POST /auth/complete-registration

3. Login
   POST /auth/login
   ├─ Input: email, password
   ├─ Authentication: Spring Security + BCrypt
   └─ Output: JWT Token (24h expiry)

4. Token Management
   GET /auth/user-id (Get current user from JWT)
   ├─ Header: Authorization: Bearer {token}
   └─ Output: User ID, Email, Role

5. Password Reset
   POST /auth/forgot-password
   POST /auth/reset-password (with code)
```

#### 2. Appointment Management Flow
```
1. Doctor Availability Setup
   GET /availability (Get available slots)
   POST /availability/setup (Doctor sets availability)

2. Patient Books Appointment
   POST /appointments
   ├─ Input: patientId, doctorId, date, time, reason
   ├─ Validation: Doctor available, no conflicts
   └─ Output: Appointment created (status: PENDING)

3. Doctor Confirms Appointment
   PUT /appointments/{id}
   └─ Status: PENDING → CONFIRMED

4. Appointment Reminders
   GET /appointments/{id}/reminders
   POST /appointments/{id}/reminders/schedule
   POST /appointments/{id}/reminders/send

5. Teleconsultation
   GET /appointments/{id}/teleconsultation
   POST /appointments/{id}/teleconsultation/start
   POST /appointments/{id}/teleconsultation/join
```

#### 3. Prescription & E-Pharmacy Flow
```
1. Doctor Creates Prescription
   POST /api/pharmacy/prescriptions
   ├─ Input: patientId, medicines[], notes
   ├─ Doctor adds: Medicine, Dosage, Frequency, Duration
   ├─ Validation: Drug interactions check
   └─ Output: Prescription created (status: ACTIVE)

2. Patient Views Prescription
   GET /api/pharmacy/prescriptions
   GET /api/pharmacy/prescriptions/{id}

3. Patient Orders Medicines
   GET /api/pharmacy/medicines (Search/Browse)
   GET /api/pharmacy/medicines/{id} (Details)
   POST /api/pharmacy/orders (Place order)
   ├─ Input: medicineIds[], quantities, shipping address
   ├─ Validation: Stock check, user eligibility
   └─ Output: Order created (status: PENDING)

4. Prescription Refills
   POST /api/pharmacy/refills (Request refill)
   GET /api/pharmacy/refills/{id} (Track refill)

5. Drug Interactions Check
   GET /api/pharmacy/drug-interactions?medicineIds=1,2,3
   ├─ Input: List of medicine IDs
   └─ Output: List of interactions (if any)
```

#### 4. Medical Records Management Flow
```
1. Patient Uploads Record
   POST /medical-records
   ├─ Input: File, description, type (prescription, lab, image, etc.)
   ├─ Validation: File size, format
   └─ Output: Record created

2. Share with Doctor
   POST /shared-documents
   ├─ Input: recordId, doctorId, expiry
   └─ Output: Access granted with deadline

3. View Records
   GET /medical-records
   GET /medical-records/{id}

4. Doctor Annotations
   POST /annotations/{recordId}
   ├─ Input: notes, tags, findings
   └─ Used for collaboration
```

#### 5. Health Metrics Tracking Flow
```
1. Patient Logs Daily Metrics
   POST /moods (Mood tracking)
   POST /stress (Stress level 1-10)
   POST /sleep (Hours, quality)
   POST /activities (Exercise, calories)

2. View Historical Data
   GET /moods?userId={id}&dateRange=7d
   GET /stress?userId={id}&dateRange=7d
   GET /sleep?userId={id}&dateRange=7d
   GET /activities?userId={id}&dateRange=7d

3. Get Wellness Summary
   GET /well-being-metrics/{userId}
   └─ Aggregated metrics & trends

4. AI Recommendations
   GET /recommendations?userId={id}
   ├─ Based on health metrics
   └─ Personalized health tips
```

### User Roles & Permissions

#### PATIENT Role
✅ Register, login, view profile
✅ Book appointments, view appointment history
✅ View own medical records
✅ View own prescriptions
✅ Order medicines from pharmacy
✅ Track health metrics (mood, stress, sleep, activity)
✅ Upload medical documents
✅ Manage subscriptions & payments
✅ Receive recommendations
❌ Cannot create prescriptions
❌ Cannot manage other users
❌ Cannot access admin features

#### DOCTOR Role
✅ Register, login, view profile
✅ View patient list (assigned)
✅ Manage appointments (confirm, cancel)
✅ Create & manage prescriptions
✅ View patient medical records
✅ Write visit notes
✅ Manage availability calendar
✅ View patient health metrics
❌ Cannot manage pharmacy inventory
❌ Cannot create orders
❌ Cannot access admin features

#### PHARMACIST Role
✅ Register, login, view profile
✅ Manage medicines (CRUD)
✅ View prescriptions (all)
✅ Process orders
✅ Manage inventory & stock
✅ Handle refill requests
✅ View drug interactions
❌ Cannot create prescriptions
❌ Cannot book appointments
❌ Cannot access patient records directly

#### ADMIN Role
✅ Manage all users (CRUD)
✅ View analytics & reports
✅ System configuration
✅ Manage subscriptions & payments
✅ View audit logs
✅ Access all data (with restrictions)
❌ Cannot create medical records
❌ Cannot impersonate users

---

## 📡 ALL ENDPOINTS BY CATEGORY

### 1. AUTHENTICATION (8 Endpoints)

#### Register & Login
```http
POST /auth/register
├─ Body: { fullName, email, password, role }
├─ Response: 200 { message, email }
└─ Notes: Creates user account

POST /auth/login
├─ Body: { email, password }
├─ Response: 200 { token, email, role, expiryTime }
└─ Notes: Returns JWT Bearer token

GET /auth/user-id
├─ Headers: Authorization: Bearer {token}
├─ Response: 200 { id, email }
└─ Notes: Get current authenticated user
```

#### Email Verification (Optional)
```http
POST /auth/register-with-verification
├─ Body: { fullName, email, password, role }
├─ Response: 200 { message, email }
└─ Notes: Initiates email verification flow

POST /auth/verify-email
├─ Body: { email, code }
├─ Response: 200 { message, verified }
└─ Notes: Validates 6-digit code

POST /auth/complete-registration
├─ Body: { email, fullName, password, role, ...additionalFields }
├─ Response: 200 { message, user }
└─ Notes: Completes registration after email verification
```

#### Password Reset
```http
POST /auth/forgot-password
├─ Body: { email }
├─ Response: 200 { message }
└─ Notes: Sends reset code to email

POST /auth/reset-password
├─ Body: { email, code, newPassword }
├─ Response: 200 { message, passwordReset }
└─ Notes: Resets password with verification code
```

---

### 2. APPOINTMENTS (13 Endpoints)

#### Manage Appointments
```http
POST /appointments
├─ Body: { patientId, doctorId, appointmentDate, reason, consultationType, notes }
├─ Response: 201 { id, patientId, doctorId, appointmentDate, status }
└─ Notes: Create appointment (Patient)

GET /appointments
├─ Response: 200 [ { id, patientId, doctorId, appointmentDate, status, ... } ]
└─ Notes: Get all appointments (Admin/User with access)

GET /appointments/{id}
├─ Response: 200 { id, patientId, doctorId, appointmentDate, status, ... }
└─ Notes: Get appointment details

GET /appointments/patient/{patientId}
├─ Response: 200 [ { ...appointments } ]
└─ Notes: Get patient's appointments

GET /appointments/doctor/{doctorId}
├─ Response: 200 [ { ...appointments } ]
└─ Notes: Get doctor's appointments

PUT /appointments/{id}
├─ Body: { appointmentDate, status, reason, consultationType, notes }
├─ Response: 200 { ...updated appointment }
└─ Notes: Update appointment (Doctor confirms/changes)

DELETE /appointments/{id}
├─ Response: 200 { message: "Appointment deleted" }
└─ Notes: Cancel appointment
```

#### Reminders
```http
GET /appointments/{appointmentId}/reminders
├─ Response: 200 { appointmentId, status, reminders: [] }
└─ Notes: Get reminders for appointment

POST /appointments/{appointmentId}/reminders/schedule
├─ Response: 200 { appointmentId, status: "SCHEDULED", scheduledAt }
└─ Notes: Schedule reminder notification

POST /appointments/{appointmentId}/reminders/send
├─ Response: 200 { appointmentId, status: "SENT", sentAt }
└─ Notes: Send reminder immediately
```

#### Teleconsultation
```http
GET /appointments/{appointmentId}/teleconsultation
├─ Response: 200 { appointmentId, status, joinUrl: "" }
└─ Notes: Get telecon session status

POST /appointments/{appointmentId}/teleconsultation/start
├─ Response: 200 { appointmentId, status: "STARTED", sessionId, startedAt }
└─ Notes: Doctor initiates video call

POST /appointments/{appointmentId}/teleconsultation/join
├─ Response: 200 { appointmentId, status: "JOINED", joinUrl, joinedAt }
└─ Notes: Patient joins video call
```

---

### 3. E-PHARMACY (22+ Endpoints)

#### Medicines Catalog
```http
GET /api/pharmacy/medicines
├─ Query: ?keyword, category, requiresPrescription, page, size
├─ Response: 200 Page<{ id, name, dosage, category, price, imageUrl, ... }>
└─ Notes: Search & browse medicines

POST /api/pharmacy/medicines (PHARMACIST)
├─ Body: { name, dosage, category, price, imageUrl, description }
├─ Response: 201 { id, name, dosage, ... }
└─ Notes: Add medicine to catalog

GET /api/pharmacy/medicines/{id}
├─ Response: 200 { id, name, dosage, category, price, description, interactions: [] }
└─ Notes: Get medicine details & known interactions

PUT /api/pharmacy/medicines/{id} (PHARMACIST)
├─ Body: { name, dosage, category, price, imageUrl, description }
├─ Response: 200 { ...updated medicine }
└─ Notes: Update medicine info

DELETE /api/pharmacy/medicines/{id} (PHARMACIST)
├─ Response: 204
└─ Notes: Remove medicine from catalog
```

#### Prescriptions
```http
POST /api/pharmacy/prescriptions (DOCTOR)
├─ Body: { patientId, items: [ { medicineId, quantity, dosage, frequency, durationDays, instructions } ], notes }
├─ Response: 201 { id, patientId, doctorId, issueDate, expiryDate, status, items: [] }
└─ Notes: Doctor creates prescription for patient

GET /api/pharmacy/prescriptions
├─ Query: ?page, size (Paginated)
├─ Response: 200 Page<{ id, patientId, patientName, doctorId, doctorName, issueDate, status, ... }>
└─ Notes: Get prescriptions (Patient sees own, Doctor sees issued)

GET /api/pharmacy/prescriptions/{id}
├─ Response: 200 { id, patientId, patientName, doctorId, doctorName, issueDate, expiryDate, status, items: [], ... }
└─ Notes: Get full prescription details with medicine items

POST /api/pharmacy/prescriptions/upload (PATIENT)
├─ Body: multipart { imageFile, doctorName? }
├─ Response: 200 { message, prescriptionId, verified }
└─ Notes: Upload prescription image for verification

POST /api/pharmacy/refills/{prescriptionId} (PATIENT)
├─ Body: { reason? }
├─ Response: 200 { message, refillId, status }
└─ Notes: Request prescription refill
```

#### Orders
```http
POST /api/pharmacy/orders (PATIENT)
├─ Body: { medicineIds: [], quantities: [], shippingAddress, prescriptionId? }
├─ Response: 201 { id, patientId, items: [], totalPrice, status: "PENDING", ... }
└─ Notes: Place order for medicines

GET /api/pharmacy/orders
├─ Query: ?page, size (Paginated)
├─ Response: 200 Page<{ id, patientId, items: [], totalPrice, status, orderDate, ... }>
└─ Notes: Get order history (Patient only)

GET /api/pharmacy/orders/{id} (PATIENT)
├─ Response: 200 { id, patientId, items: [], totalPrice, status, tracking, ... }
└─ Notes: Get order details & tracking info

POST /api/pharmacy/orders/{id}/cancel (PATIENT)
├─ Response: 200 { message, status: "CANCELLED" }
└─ Notes: Cancel order (if still in PENDING status)

POST /api/pharmacy/orders/{id}/pay (PATIENT)
├─ Body: { paymentMethod, cardDetails? }
├─ Response: 200 { message, paymentId, status: "PAID" }
└─ Notes: Process payment for order
```

#### Drug Interactions & Inventory
```http
GET /api/pharmacy/drug-interactions?medicineIds=1,2,3
├─ Response: 200 { interactions: [ { medicine1Id, medicine2Id, severity, description } ] }
└─ Notes: Check medicine interactions before ordering

GET /api/pharmacy/inventory
├─ Response: 200 [ { medicineId, medicineName, quantity, lowStockThreshold, status } ]
└─ Notes: Get inventory status (PHARMACIST/ADMIN)

PUT /api/pharmacy/inventory/{medicineId} (PHARMACIST)
├─ Body: { quantity, lowStockThreshold }
├─ Response: 200 { medicineId, medicineName, quantity, status }
└─ Notes: Update inventory stock
```

---

### 4. MEDICAL RECORDS (6 Endpoints)

#### Upload & Manage
```http
POST /medical-records
├─ Body: multipart { file, description, documentType, relatedAppointmentId? }
├─ Response: 201 { id, patientId, doctorId, description, type, documentUrl, uploadDate }
└─ Notes: Upload medical document

GET /medical-records
├─ Response: 200 [ { id, patientId, doctorId, description, type, documentUrl, uploadDate, ... } ]
└─ Notes: Get all records (with access control)

GET /medical-records/{id}
├─ Response: 200 { id, patientId, doctorId, description, type, documentUrl, uploadDate, annotations: [] }
└─ Notes: Get record with annotations

GET /medical-records/patient/{patientId}
├─ Response: 200 [ { ...records } ]
└─ Notes: Get patient's medical records (Doctor/Admin only)

PUT /medical-records/{id}
├─ Body: { description, documentType }
├─ Response: 200 { ...updated record }
└─ Notes: Update record metadata

DELETE /medical-records/{id}
├─ Response: 204
└─ Notes: Delete record (with soft delete in DB)
```

---

### 5. HEALTH TRACKING (10+ Endpoints)

#### Mood Tracking
```http
POST /moods
├─ Body: { userId, mood, intensity: 1-10, notes?, timestamp }
├─ Response: 201 { id, userId, mood, intensity, timestamp }
└─ Notes: Log daily mood

GET /moods?userId={id}&dateRange=7d
├─ Response: 200 [ { id, userId, mood, intensity, timestamp } ]
└─ Notes: Get mood history (7d default)

GET /moods/{id}
├─ Response: 200 { id, userId, mood, intensity, timestamp, notes }
└─ Notes: Get specific mood entry

DELETE /moods/{id}
├─ Response: 204
└─ Notes: Delete mood entry
```

#### Stress Tracking
```http
POST /stresss (Note: endpoint has typo "stresss")
├─ Body: { userId, level: 1-10, trigger?, notes?, timestamp }
├─ Response: 201 { id, userId, level, trigger, timestamp }
└─ Notes: Log stress level

GET /stresss?userId={id}&dateRange=7d
├─ Response: 200 [ { id, userId, level, trigger, timestamp } ]
└─ Notes: Get stress history

GET /stresss/{id}
├─ Response: 200 { id, userId, level, trigger, notes, timestamp }
└─ Notes: Get specific stress entry
```

#### Sleep Tracking
```http
POST /sleeps
├─ Body: { userId, duration: hours, quality: 1-10, notes?, timestamp }
├─ Response: 201 { id, userId, duration, quality, timestamp }
└─ Notes: Log sleep data

GET /sleeps?userId={id}&dateRange=7d
├─ Response: 200 [ { id, userId, duration, quality, timestamp } ]
└─ Notes: Get sleep history

GET /sleeps/{id}
├─ Response: 200 { id, userId, duration, quality, notes, timestamp }
└─ Notes: Get specific sleep entry
```

#### Activity Tracking
```http
POST /activities
├─ Body: { userId, type, duration: minutes, caloriesBurned?, notes?, timestamp }
├─ Response: 201 { id, userId, type, duration, caloriesBurned, timestamp }
└─ Notes: Log exercise/activity

GET /activities?userId={id}&dateRange=7d
├─ Response: 200 [ { id, userId, type, duration, caloriesBurned, timestamp } ]
└─ Notes: Get activity history

GET /activities/{id}
├─ Response: 200 { id, userId, type, duration, caloriesBurned, notes, timestamp }
└─ Notes: Get specific activity entry
```

#### Wellness Summary
```http
GET /well-being-metrics/{userId}
├─ Response: 200 {
│   userId,
│   overallWellness: 75,
│   mood: { current: "happy", avg7d: 7 },
│   stress: { current: 3, avg7d: 4 },
│   sleep: { current: 7h, avg7d: 6.5h },
│   activity: { today: 500cal, avg7d: 400cal },
│   recommendations: [ "..." ]
│ }
└─ Notes: Get aggregated wellness metrics
```

---

### 6. PRESCRIPTIONS (6 Endpoints)

```http
POST /prescriptions
├─ Body: { patientId, doctorId, items: [ { medicineId, quantity, dosage, frequency, durationDays, instructions } ] }
├─ Response: 201 { id, patientId, doctorId, items: [], createdAt }
└─ Notes: Legacy endpoint (see E-Pharmacy for current)

GET /prescriptions
├─ Response: 200 [ { id, patientId, doctorId, items: [], createdAt } ]
└─ Notes: Get prescriptions

GET /prescriptions/{id}
├─ Response: 200 { id, patientId, doctorId, items: [ { medicineId, medicineName, quantity, dosage, ... } ], createdAt }
└─ Notes: Get prescription details

GET /prescriptions/patient/{patientId}
├─ Response: 200 [ { ...prescriptions } ]
└─ Notes: Get patient's prescriptions

GET /prescriptions/doctor/{doctorId}
├─ Response: 200 [ { ...prescriptions } ]
└─ Notes: Get doctor's issued prescriptions

PUT /prescriptions/{id}
├─ Body: { items: [], notes }
├─ Response: 200 { ...updated prescription }
└─ Notes: Update prescription
```

---

### 7. USER MANAGEMENT (8+ Endpoints)

#### User CRUD (ADMIN only)
```http
POST /api/users (ADMIN)
├─ Body: { fullName, email, password, role }
├─ Response: 201 { id, fullName, email, role }
└─ Notes: Create user

GET /api/users (ADMIN)
├─ Query: ?page, size, role
├─ Response: 200 Page<{ id, fullName, email, role, createdAt }>
└─ Notes: List all users

GET /api/users/{id} (ADMIN)
├─ Response: 200 { id, fullName, email, role, createdAt, profile: {} }
└─ Notes: Get user details

PUT /api/users/{id} (ADMIN)
├─ Body: { fullName, email, role, status }
├─ Response: 200 { ...updated user }
└─ Notes: Update user

DELETE /api/users/{id} (ADMIN)
├─ Response: 204
└─ Notes: Delete user

POST /api/users/{id}/role (ADMIN)
├─ Body: { role }
├─ Response: 200 { id, email, role }
└─ Notes: Change user role
```

#### Patient Profile
```http
GET /patient
├─ Response: 200 { id, fullName, email, dateOfBirth, gender, phone, address }
└─ Notes: Get patient profile

PUT /patient
├─ Body: { fullName, dateOfBirth, gender, phone, address }
├─ Response: 200 { ...updated profile }
└─ Notes: Update patient profile
```

---

### 8. DOCTOR FEATURES (10+ Endpoints)

#### Availability
```http
GET /availability?doctorId={id}
├─ Query: ?doctorId, date
├─ Response: 200 [ { doctorId, date, timeSlots: [ { time, available } ] } ]
└─ Notes: Get doctor's available slots

POST /availability
├─ Body: { doctorId, date, timeSlots: [ "09:00", "10:00", ... ] }
├─ Response: 201 { id, doctorId, date, timeSlots: [] }
└─ Notes: Set availability (Doctor only)

PUT /availability/{id}
├─ Body: { date, timeSlots: [] }
├─ Response: 200 { ...updated }
└─ Notes: Update availability

DELETE /availability/{id}
├─ Response: 204
└─ Notes: Remove availability
```

#### Visit Notes
```http
POST /visit-notes
├─ Body: { appointmentId, diagnosis, treatment, notes, prescription? }
├─ Response: 201 { id, appointmentId, diagnosis, treatment, notes }
└─ Notes: Doctor writes visit note

GET /visit-notes?doctorId={id}
├─ Response: 200 [ { ...notes } ]
└─ Notes: Get doctor's visit notes

GET /visit-notes/{id}
├─ Response: 200 { id, appointmentId, diagnosis, treatment, notes, prescription }
└─ Notes: Get visit note details

PUT /visit-notes/{id}
├─ Body: { diagnosis, treatment, notes }
├─ Response: 200 { ...updated }
└─ Notes: Update visit note
```

---

### 9. PHARMACIST FEATURES (8+ Endpoints)

#### Medicines Management
```http
POST /api/pharmacy/medicines (PHARMACIST)
├─ Body: { name, dosage, category, price, imageUrl, description, sideEffects }
├─ Response: 201 { id, name, dosage, category, price, ... }
└─ Notes: Add medicine to catalog

GET /api/pharmacy/medicines (PHARMACIST - full list)
├─ Response: 200 Page<{ id, name, dosage, category, price, stock, ... }>
└─ Notes: Get all medicines with stock info

PUT /api/pharmacy/medicines/{id} (PHARMACIST)
├─ Body: { name, dosage, category, price, imageUrl, description }
├─ Response: 200 { ...updated }
└─ Notes: Update medicine

DELETE /api/pharmacy/medicines/{id} (PHARMACIST)
├─ Response: 204
└─ Notes: Delete medicine
```

---

### 10. ADDITIONAL FEATURES (20+ Endpoints)

#### Allergies
```http
POST /allergies
├─ Body: { userId, allergen, severity, reaction, dateOccurred }
├─ Response: 201 { id, userId, allergen, severity, reaction }
└─ Notes: Record allergy

GET /allergies?userId={id}
├─ Response: 200 [ { id, userId, allergen, severity, reaction } ]
└─ Notes: Get patient allergies

GET /allergies/{id}
├─ Response: 200 { id, userId, allergen, severity, reaction, dateOccurred }
└─ Notes: Get allergy details

PUT /allergies/{id}
├─ Body: { allergen, severity, reaction }
├─ Response: 200 { ...updated }
└─ Notes: Update allergy

DELETE /allergies/{id}
├─ Response: 204
└─ Notes: Delete allergy record
```

#### Lab Results
```http
POST /lab-results
├─ Body: { patientId, testName, result, unit, referenceRange, doctor?, timestamp }
├─ Response: 201 { id, patientId, testName, result, unit, referenceRange }
└─ Notes: Upload lab result

GET /lab-results?patientId={id}
├─ Response: 200 [ { ...results } ]
└─ Notes: Get patient lab results

GET /lab-results/{id}
├─ Response: 200 { id, patientId, testName, result, unit, referenceRange, notes }
└─ Notes: Get lab result details

PUT /lab-results/{id}
├─ Body: { testName, result, unit, referenceRange, notes }
├─ Response: 200 { ...updated }
└─ Notes: Update lab result

DELETE /lab-results/{id}
├─ Response: 204
└─ Notes: Delete lab result
```

#### Medical Images
```http
POST /medical-images
├─ Body: multipart { file, description, imageType, bodyPart?, takenDate }
├─ Response: 201 { id, patientId, description, imageType, bodyPart, imageUrl }
└─ Notes: Upload medical image (X-ray, CT, MRI, etc.)

GET /medical-images?patientId={id}
├─ Response: 200 [ { ...images } ]
└─ Notes: Get patient images

GET /medical-images/{id}
├─ Response: 200 { id, patientId, description, imageType, bodyPart, imageUrl, annotations: [] }
└─ Notes: Get image details with doctor annotations

DELETE /medical-images/{id}
├─ Response: 204
└─ Notes: Delete image
```

#### Symptoms & Recommendations
```http
GET /symptoms
├─ Response: 200 [ { id, name, description, category } ]
└─ Notes: Get symptom list (for assessment)

POST /recommendations (AI-Generated)
├─ Body: { userId, symptoms: [], medicalHistory }
├─ Response: 201 { id, userId, recommendations: [ { symptom, suggestion, severity } ] }
└─ Notes: Get AI health recommendations

GET /recommendations?userId={id}
├─ Response: 200 [ { ...recommendations } ]
└─ Notes: Get user recommendations
```

#### Pregnancy Tracking (Special Feature)
```http
POST /pregnancy-tracking
├─ Body: { userId, gestationWeek, lastMenstrualDate, dueDate, notes }
├─ Response: 201 { id, userId, gestationWeek, dueDate, nextCheckup }
└─ Notes: Start pregnancy tracking

GET /pregnancy-tracking/{userId}
├─ Response: 200 { id, userId, gestationWeek, weeklyTips, checkups: [], alerts: [] }
└─ Notes: Get pregnancy info & milestone tracking

POST /pregnancy-checkups
├─ Body: { pregnancyTrackingId, date, weight, bloodPressure, notesFromDoctor }
├─ Response: 201 { id, pregnancyTrackingId, date, findings }
└─ Notes: Log pregnancy checkup
```

#### Subscriptions & Payments
```http
GET /api/subscriptions
├─ Response: 200 [ { id, name, tier, price, features: [] } ]
└─ Notes: Get available subscription plans

POST /api/subscriptions (PATIENT)
├─ Body: { subscriptionPlanId, paymentMethod }
├─ Response: 201 { id, userId, planId, status: "ACTIVE", expiryDate }
└─ Notes: Subscribe to premium features

GET /api/subscriptions/{id}
├─ Response: 200 { id, userId, planId, status, startDate, expiryDate }
└─ Notes: Get subscription details

POST /api/subscriptions/{id}/cancel
├─ Response: 200 { message, status: "CANCELLED" }
└─ Notes: Cancel subscription
```

#### Forum & Posts (Community Features)
```http
POST /api/forum/posts
├─ Body: { title, content, category, tags: [] }
├─ Response: 201 { id, userId, title, content, createdAt, likesCount: 0, repliesCount: 0 }
└─ Notes: Create forum post

GET /api/forum/posts
├─ Query: ?category, page, size
├─ Response: 200 Page<{ id, userId, title, content, createdAt, likesCount, repliesCount }>
└─ Notes: List forum posts

GET /api/forum/posts/{id}
├─ Response: 200 { id, userId, title, content, createdAt, replies: [], likesCount }
└─ Notes: Get post with replies

POST /api/forum/posts/{id}/replies
├─ Body: { content }
├─ Response: 201 { id, postId, userId, content, createdAt }
└─ Notes: Reply to post

POST /api/forum/posts/{id}/like
├─ Response: 200 { postId, likesCount }
└─ Notes: Like a post
```

---

## 🔄 Data Flow & Interactions

### Complete User Journey: Patient Booking Appointment to Medicine Order

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PATIENT REGISTERS & LOGS IN                             │
├─────────────────────────────────────────────────────────────┤
│ POST /auth/register                                          │
│   → User created with PATIENT role                          │
│ POST /auth/login                                             │
│   → JWT Token stored in browser                             │
│ GET /auth/user-id                                            │
│   → Confirms authentication                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PATIENT VIEWS AVAILABLE DOCTORS                          │
├─────────────────────────────────────────────────────────────┤
│ GET /api/users?role=DOCTOR                                  │
│   → List of all doctors                                     │
│ GET /availability?doctorId={id}                             │
│   → Doctor's available appointment slots                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PATIENT BOOKS APPOINTMENT                                │
├─────────────────────────────────────────────────────────────┤
│ POST /appointments                                           │
│   {                                                          │
│     patientId: {currentUserId},                             │
│     doctorId: {selectedDoctorId},                           │
│     appointmentDate: "2026-04-15T10:00",                   │
│     reason: "Regular checkup",                             │
│     consultationType: "VIDEO"                              │
│   }                                                          │
│   → Appointment created (status: PENDING)                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. DOCTOR VIEWS & CONFIRMS APPOINTMENT                      │
├─────────────────────────────────────────────────────────────┤
│ GET /appointments/doctor/{doctorId}                         │
│   → Lists pending appointments                              │
│ GET /appointments/{appointmentId}                           │
│   → Views appointment details                               │
│ PUT /appointments/{appointmentId}                           │
│   { status: "CONFIRMED" }                                  │
│   → Appointment confirmed                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. DOCTOR-PATIENT CONSULTATION                              │
├─────────────────────────────────────────────────────────────┤
│ POST /appointments/{id}/teleconsultation/start              │
│   → Doctor initiates video call                             │
│ POST /appointments/{id}/teleconsultation/join               │
│   → Patient joins video call                                │
│ POST /visit-notes                                            │
│   { appointmentId, diagnosis, treatment, ... }             │
│   → Doctor writes visit notes                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. DOCTOR CREATES PRESCRIPTION                              │
├─────────────────────────────────────────────────────────────┤
│ GET /api/pharmacy/medicines?keyword=...                     │
│   → Search for medicines                                    │
│ GET /api/pharmacy/drug-interactions?medicineIds=1,2,3      │
│   → Check for interactions                                  │
│ POST /api/pharmacy/prescriptions                            │
│   {                                                          │
│     patientId: {patientId},                                │
│     items: [                                                │
│       {                                                      │
│         medicineId: 1,                                      │
│         dosage: "500mg",                                    │
│         frequency: "Twice daily",                           │
│         durationDays: 7,                                    │
│         instructions: "Take with food"                     │
│       }                                                      │
│     ]                                                        │
│   }                                                          │
│   → Prescription created                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. PATIENT RECEIVES PRESCRIPTION NOTIFICATION                │
├─────────────────────────────────────────────────────────────┤
│ GET /api/pharmacy/prescriptions                             │
│   → Patient views new prescription                          │
│ GET /api/pharmacy/prescriptions/{id}                        │
│   → Views detailed prescription with medicines              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. PATIENT ORDERS MEDICINES FROM PHARMACY                   │
├─────────────────────────────────────────────────────────────┤
│ GET /api/pharmacy/medicines/{id}                            │
│   → Views medicine details                                  │
│ POST /api/pharmacy/orders                                   │
│   {                                                          │
│     medicineIds: [1, 2],                                    │
│     quantities: [1, 2],                                     │
│     prescriptionId: {prescriptionId},                       │
│     shippingAddress: {...}                                 │
│   }                                                          │
│   → Order placed (status: PENDING)                          │
│ POST /api/pharmacy/orders/{orderId}/pay                     │
│   → Payment processed                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. PATIENT TRACKS ORDER & RECEIVES MEDICINES                │
├─────────────────────────────────────────────────────────────┤
│ GET /api/pharmacy/orders                                    │
│   → Views order history                                     │
│ GET /api/pharmacy/orders/{orderId}                          │
│   → Tracks delivery status                                  │
│   → Order status: PENDING → CONFIRMED → SHIPPED → DELIVERED │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. PATIENT TRACKS HEALTH METRICS                           │
├─────────────────────────────────────────────────────────────┤
│ POST /moods { mood, intensity }                             │
│ POST /stresss { level, trigger }                            │
│ POST /sleeps { duration, quality }                          │
│ POST /activities { type, duration, caloriesBurned }         │
│   → Daily health logging                                    │
│ GET /well-being-metrics/{userId}                            │
│   → Views wellness dashboard with trends                    │
│ GET /recommendations?userId={id}                            │
│   → Receives AI health recommendations                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Feature Implementation Checklist

### Phase 1: Authentication (Critical)
- [ ] Register page (email, password, role selection)
- [ ] Email verification (optional 6-digit code)
- [ ] Login page (email, password)
- [ ] JWT token storage (secure HttpOnly cookie)
- [ ] Protected routes (check authentication)
- [ ] Password reset flow
- [ ] Logout functionality
- [ ] User profile page

### Phase 2: Core Appointments (High Priority)
- [ ] Doctor list with filtering
- [ ] Availability calendar (show available slots)
- [ ] Appointment booking form
- [ ] Patient appointments list/calendar view
- [ ] Doctor appointments list/calendar view
- [ ] Appointment details modal
- [ ] Reschedule appointment
- [ ] Cancel appointment
- [ ] Appointment reminders UI

### Phase 3: Prescriptions & Pharmacy (High Priority)
- [ ] Medicine search & catalog
- [ ] Medicine detail page
- [ ] Prescription list (patient)
- [ ] Prescription detail page
- [ ] Prescription upload (image recognition)
- [ ] Shopping cart
- [ ] Checkout process
- [ ] Payment integration
- [ ] Order history
- [ ] Order tracking
- [ ] Refill requests

### Phase 4: Health Tracking (Medium Priority)
- [ ] Mood tracking (daily entry)
- [ ] Stress level logger
- [ ] Sleep tracker
- [ ] Activity logger
- [ ] Health metrics dashboard
- [ ] Charts & trends visualization
- [ ] Wellness summary
- [ ] AI recommendations display

### Phase 5: Medical Records (Medium Priority)
- [ ] Upload medical documents
- [ ] Records gallery/list
- [ ] Document viewer
- [ ] Share with doctor
- [ ] Download records
- [ ] Lab results
- [ ] Medical images viewer

### Phase 6: Doctor Features (Medium Priority)
- [ ] Doctor availability calendar editor
- [ ] Create prescription form
- [ ] Medicine search & add to prescription
- [ ] Drug interaction checker
- [ ] Patient list view
- [ ] Prescription management
- [ ] Visit notes editor
- [ ] Appointment confirmation

### Phase 7: Admin Features (Lower Priority)
- [ ] User management (list, edit, delete)
- [ ] Analytics dashboard
- [ ] System reports
- [ ] Configuration panel
- [ ] Audit logs

### Phase 8: Advanced Features (Nice to Have)
- [ ] Teleconsultation/video call integration
- [ ] Real-time notifications (WebSocket)
- [ ] Community forum/posts
- [ ] Pregnancy tracking (if applicable)
- [ ] Subscription/payments management
- [ ] Dark mode support
- [ ] Multi-language support

---

## 📊 Database Schema Summary

### Core Tables
```
users
├─ id (PK)
├─ fullName
├─ email (UNIQUE)
├─ password (BCrypt hashed)
├─ role (ENUM: PATIENT, DOCTOR, PHARMACIST, ADMIN)
├─ isPremium (BOOLEAN)
├─ enabled (BOOLEAN)
└─ timestamps (createdAt, updatedAt)

appointments
├─ id (PK)
├─ patientId (FK → users)
├─ doctorId (FK → users)
├─ appointmentDate (DATETIME)
├─ status (ENUM: PENDING, CONFIRMED, CANCELLED, COMPLETED)
├─ reason (VARCHAR)
├─ consultationType (ENUM: VIDEO, IN_PERSON)
└─ notes (TEXT)

prescriptions
├─ id (PK)
├─ patientId (FK → users)
├─ doctorId (FK → users)
├─ issueDate (DATE)
├─ expiryDate (DATE)
├─ status (ENUM: ACTIVE, EXPIRED, REFILLED)
└─ notes (TEXT)

prescription_items
├─ id (PK)
├─ prescriptionId (FK → prescriptions)
├─ medicineId (FK → medicines)
├─ quantity (INT)
├─ dosage (VARCHAR)
├─ frequency (VARCHAR)
├─ durationDays (INT)
└─ instructions (TEXT)

medicines
├─ id (PK)
├─ name (VARCHAR)
├─ dosage (VARCHAR)
├─ category (VARCHAR)
├─ price (DECIMAL)
├─ imageUrl (VARCHAR)
└─ description (TEXT)

orders
├─ id (PK)
├─ patientId (FK → users)
├─ totalPrice (DECIMAL)
├─ status (ENUM: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
├─ orderDate (DATETIME)
└─ shippingAddress (VARCHAR)

medical_records
├─ id (PK)
├─ patientId (FK → users)
├─ doctorId (FK → users, nullable)
├─ description (VARCHAR)
├─ type (ENUM: PRESCRIPTION, LAB_RESULT, IMAGING, OTHER)
├─ documentUrl (VARCHAR)
└─ uploadDate (DATETIME)

[And 30+ more tables for health metrics, allergies, lab results, etc.]
```

---

## 🎯 Summary for Improvement

### What's Already Built (Backend)
✅ 35 controllers with 135+ endpoints
✅ Complete authentication system
✅ Appointment management
✅ E-pharmacy with orders
✅ Medical records storage
✅ Health metrics tracking
✅ Role-based access control
✅ Database with 40+ entities

### What Needs Frontend Development
❌ All UI pages & components
❌ Forms & validations
❌ State management
❌ API integration
❌ Charts & visualizations
❌ Responsive design
❌ Error handling
❌ Loading states

### Recommended Tech Stack
- **Framework**: Vue.js 3 (fastest) / React 18 / Angular 17
- **State**: Pinia (Vue) / Redux (React)
- **Styling**: Tailwind CSS
- **API Client**: Axios with interceptors
- **Forms**: VeeValidate + Zod / React Hook Form + Zod
- **Charts**: Chart.js / ECharts
- **Build**: Vite

This document provides the complete reference for designing and reviewing the frontend prompts for AI development!

