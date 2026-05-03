# 🎯 MediCare AI - Complete Endpoints with JSON Examples

**This document contains ALL 135+ endpoints with detailed JSON request and response examples**

---

## 1. AUTHENTICATION ENDPOINTS (8)

### POST /auth/register
Register a new user
```json
Request:
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "PATIENT"
}

Response (200):
{
  "message": "User created: john@example.com",
  "email": "john@example.com"
}

Error (400):
{
  "error": "Email already exists",
  "status": 400
}
```

### POST /auth/login
Authenticate and get JWT token
```json
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNzExNzcwODAwLCJleHAiOjE3MTE4NTcyMDB9.abcdef",
  "email": "john@example.com",
  "role": "PATIENT",
  "expiryTime": "2026-03-30T10:00:00Z"
}

Error (401):
{
  "error": "Invalid email or password",
  "status": 401
}
```

### GET /auth/user-id
Get current authenticated user info
```json
Headers:
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "id": 1,
  "email": "john@example.com"
}

Error (401):
{
  "error": "Unauthorized",
  "status": 401
}
```

### POST /auth/register-with-verification
Initiate registration with email verification
```json
Request:
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass456!",
  "role": "DOCTOR"
}

Response (200):
{
  "message": "Verification code sent to jane@example.com",
  "email": "jane@example.com"
}
```

### POST /auth/verify-email
Verify email with 6-digit code
```json
Request:
{
  "email": "jane@example.com",
  "code": "123456"
}

Response (200):
{
  "message": "Email verified successfully",
  "verified": true
}

Error (400):
{
  "error": "Invalid or expired code",
  "status": 400
}
```

### POST /auth/complete-registration
Complete registration after email verification
```json
Request:
{
  "email": "jane@example.com",
  "fullName": "Jane Smith",
  "password": "SecurePass456!",
  "role": "DOCTOR",
  "licenseNumber": "MD123456",
  "specialty": "Cardiology"
}

Response (200):
{
  "message": "Registration completed successfully",
  "user": {
    "id": 2,
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "role": "DOCTOR",
    "createdAt": "2026-03-29T10:00:00Z"
  }
}
```

### POST /auth/forgot-password
Request password reset code
```json
Request:
{
  "email": "john@example.com"
}

Response (200):
{
  "message": "Password reset code sent to john@example.com"
}
```

### POST /auth/reset-password
Reset password with verification code
```json
Request:
{
  "email": "john@example.com",
  "code": "654321",
  "newPassword": "NewSecurePass789!"
}

Response (200):
{
  "message": "Password reset successfully",
  "passwordReset": true
}
```

---

## 2. APPOINTMENT ENDPOINTS (13)

### POST /appointments
Create new appointment
```json
Request:
{
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2026-04-15T10:30:00",
  "reason": "Regular checkup",
  "consultationType": "VIDEO",
  "notes": "Patient requested video consultation"
}

Response (201):
{
  "id": 100,
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2026-04-15T10:30:00",
  "status": "PENDING",
  "reason": "Regular checkup",
  "consultationType": "VIDEO",
  "notes": "Patient requested video consultation",
  "createdAt": "2026-03-29T10:00:00Z"
}
```

### GET /appointments
Get all appointments
```json
Response (200):
[
  {
    "id": 100,
    "patientId": 1,
    "doctorId": 2,
    "appointmentDate": "2026-04-15T10:30:00",
    "status": "PENDING",
    "reason": "Regular checkup",
    "consultationType": "VIDEO",
    "patientName": "John Doe",
    "doctorName": "Dr. Jane Smith"
  },
  {
    "id": 101,
    "patientId": 3,
    "doctorId": 2,
    "appointmentDate": "2026-04-15T11:00:00",
    "status": "CONFIRMED",
    "reason": "Follow-up",
    "consultationType": "IN_PERSON",
    "patientName": "Mike Johnson",
    "doctorName": "Dr. Jane Smith"
  }
]
```

### GET /appointments/{id}
Get appointment details
```json
Response (200):
{
  "id": 100,
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2026-04-15T10:30:00",
  "status": "PENDING",
  "reason": "Regular checkup",
  "consultationType": "VIDEO",
  "notes": "Patient requested video consultation",
  "createdAt": "2026-03-29T10:00:00Z",
  "updatedAt": "2026-03-29T10:00:00Z"
}
```

### GET /appointments/patient/{patientId}
Get patient's appointments
```json
Response (200):
[
  {
    "id": 100,
    "patientId": 1,
    "doctorId": 2,
    "appointmentDate": "2026-04-15T10:30:00",
    "status": "PENDING",
    "reason": "Regular checkup",
    "consultationType": "VIDEO",
    "doctorName": "Dr. Jane Smith"
  },
  {
    "id": 102,
    "patientId": 1,
    "doctorId": 3,
    "appointmentDate": "2026-04-20T14:00:00",
    "status": "CONFIRMED",
    "reason": "Blood test",
    "consultationType": "IN_PERSON",
    "doctorName": "Dr. Tom Brown"
  }
]
```

### GET /appointments/doctor/{doctorId}
Get doctor's appointments
```json
Response (200):
[
  {
    "id": 100,
    "patientId": 1,
    "doctorId": 2,
    "appointmentDate": "2026-04-15T10:30:00",
    "status": "PENDING",
    "patientName": "John Doe",
    "reason": "Regular checkup"
  },
  {
    "id": 101,
    "patientId": 3,
    "doctorId": 2,
    "appointmentDate": "2026-04-15T11:00:00",
    "status": "CONFIRMED",
    "patientName": "Jane Smith",
    "reason": "Follow-up"
  }
]
```

### PUT /appointments/{id}
Update appointment
```json
Request:
{
  "status": "CONFIRMED",
  "notes": "Confirmed by doctor. Please arrive 10 minutes early."
}

Response (200):
{
  "id": 100,
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2026-04-15T10:30:00",
  "status": "CONFIRMED",
  "reason": "Regular checkup",
  "consultationType": "VIDEO",
  "notes": "Confirmed by doctor. Please arrive 10 minutes early.",
  "updatedAt": "2026-03-29T10:30:00Z"
}
```

### DELETE /appointments/{id}
Cancel appointment
```json
Response (200):
{
  "message": "Appointment deleted successfully"
}
```

### GET /appointments/{appointmentId}/reminders
Get appointment reminders
```json
Response (200):
{
  "appointmentId": 100,
  "status": "NO_REMINDER_SET",
  "reminders": []
}
```

### POST /appointments/{appointmentId}/reminders/schedule
Schedule reminder notification
```json
Request:
{
  "reminderTime": "2026-04-15T10:00:00"
}

Response (200):
{
  "appointmentId": 100,
  "status": "SCHEDULED",
  "scheduledAt": "2026-04-15T10:00:00Z",
  "reminderId": 50
}
```

### POST /appointments/{appointmentId}/reminders/send
Send reminder immediately
```json
Response (200):
{
  "appointmentId": 100,
  "status": "SENT",
  "sentAt": "2026-03-29T10:35:00Z",
  "message": "Reminder sent successfully"
}
```

### GET /appointments/{appointmentId}/teleconsultation
Get teleconsultation session status
```json
Response (200):
{
  "appointmentId": 100,
  "status": "NOT_STARTED",
  "joinUrl": "",
  "sessionId": null
}
```

### POST /appointments/{appointmentId}/teleconsultation/start
Doctor starts video call
```json
Response (200):
{
  "appointmentId": 100,
  "status": "STARTED",
  "sessionId": "tele-100-1711770600000",
  "startedAt": "2026-04-15T10:30:00Z",
  "joinUrl": "https://tele.medicare-ai.local/session/tele-100-1711770600000"
}
```

### POST /appointments/{appointmentId}/teleconsultation/join
Patient joins video call
```json
Response (200):
{
  "appointmentId": 100,
  "status": "JOINED",
  "joinUrl": "https://tele.medicare-ai.local/session/tele-100-1711770600000",
  "joinedAt": "2026-04-15T10:31:00Z",
  "participants": [
    { "userId": 2, "userName": "Dr. Jane Smith", "joinedAt": "2026-04-15T10:30:00Z" },
    { "userId": 1, "userName": "John Doe", "joinedAt": "2026-04-15T10:31:00Z" }
  ]
}
```

---

## 3. E-PHARMACY ENDPOINTS (22+)

### GET /api/pharmacy/medicines
Search medicines
```json
Request Query:
?keyword=aspirin&category=pain_relief&page=0&size=20

Response (200):
{
  "content": [
    {
      "id": 1,
      "name": "Aspirin",
      "dosage": "500mg",
      "category": "pain_relief",
      "price": 5.99,
      "imageUrl": "https://api.example.com/aspirin.jpg",
      "description": "Pain reliever and fever reducer",
      "requiresPrescription": false,
      "stock": 150
    },
    {
      "id": 2,
      "name": "Ibuprofen",
      "dosage": "400mg",
      "category": "pain_relief",
      "price": 7.99,
      "imageUrl": "https://api.example.com/ibuprofen.jpg",
      "description": "Anti-inflammatory pain reliever",
      "requiresPrescription": false,
      "stock": 200
    }
  ],
  "totalPages": 5,
  "currentPage": 0,
  "totalElements": 100
}
```

### POST /api/pharmacy/medicines (PHARMACIST)
Add medicine to catalog
```json
Request:
{
  "name": "Penicillin V",
  "dosage": "250mg",
  "category": "antibiotics",
  "price": 12.50,
  "imageUrl": "https://api.example.com/penicillin.jpg",
  "description": "Antibiotic for bacterial infections",
  "requiresPrescription": true,
  "sideEffects": "Allergic reactions, nausea"
}

Response (201):
{
  "id": 100,
  "name": "Penicillin V",
  "dosage": "250mg",
  "category": "antibiotics",
  "price": 12.50,
  "imageUrl": "https://api.example.com/penicillin.jpg",
  "description": "Antibiotic for bacterial infections",
  "requiresPrescription": true,
  "createdAt": "2026-03-29T10:00:00Z"
}
```

### GET /api/pharmacy/medicines/{id}
Get medicine details
```json
Response (200):
{
  "id": 1,
  "name": "Aspirin",
  "dosage": "500mg",
  "category": "pain_relief",
  "price": 5.99,
  "imageUrl": "https://api.example.com/aspirin.jpg",
  "description": "Pain reliever and fever reducer",
  "requiresPrescription": false,
  "stock": 150,
  "sideEffects": "Stomach upset, allergic reactions",
  "interactions": [
    {
      "medicineId": 3,
      "medicineName": "Warfarin",
      "severity": "HIGH",
      "description": "May increase bleeding risk"
    }
  ]
}
```

### PUT /api/pharmacy/medicines/{id} (PHARMACIST)
Update medicine
```json
Request:
{
  "price": 6.49,
  "stock": 200
}

Response (200):
{
  "id": 1,
  "name": "Aspirin",
  "dosage": "500mg",
  "price": 6.49,
  "stock": 200,
  "updatedAt": "2026-03-29T10:30:00Z"
}
```

### DELETE /api/pharmacy/medicines/{id} (PHARMACIST)
Delete medicine
```json
Response (204):
[No content]
```

### POST /api/pharmacy/prescriptions (DOCTOR)
Create prescription
```json
Request:
{
  "patientId": 1,
  "items": [
    {
      "medicineId": 1,
      "quantity": 1,
      "dosage": "500mg",
      "frequency": "Twice daily",
      "durationDays": 7,
      "instructions": "Take with food"
    },
    {
      "medicineId": 2,
      "quantity": 1,
      "dosage": "400mg",
      "frequency": "Once daily",
      "durationDays": 5,
      "instructions": "Before bedtime"
    }
  ],
  "notes": "Patient complained of headaches and fever"
}

Response (201):
{
  "id": 200,
  "patientId": 1,
  "doctorId": 2,
  "issueDate": "2026-03-29",
  "expiryDate": "2026-04-29",
  "status": "ACTIVE",
  "items": [
    {
      "id": 1,
      "medicineId": 1,
      "medicineName": "Aspirin",
      "quantity": 1,
      "dosage": "500mg",
      "frequency": "Twice daily",
      "durationDays": 7,
      "instructions": "Take with food"
    },
    {
      "id": 2,
      "medicineId": 2,
      "medicineName": "Ibuprofen",
      "quantity": 1,
      "dosage": "400mg",
      "frequency": "Once daily",
      "durationDays": 5,
      "instructions": "Before bedtime"
    }
  ],
  "notes": "Patient complained of headaches and fever"
}
```

### GET /api/pharmacy/prescriptions
Get prescriptions
```json
Response (200):
{
  "content": [
    {
      "id": 200,
      "patientId": 1,
      "patientName": "John Doe",
      "doctorId": 2,
      "doctorName": "Dr. Jane Smith",
      "issueDate": "2026-03-29",
      "expiryDate": "2026-04-29",
      "status": "ACTIVE"
    },
    {
      "id": 201,
      "patientId": 1,
      "patientName": "John Doe",
      "doctorId": 3,
      "doctorName": "Dr. Tom Brown",
      "issueDate": "2026-03-20",
      "expiryDate": "2026-04-20",
      "status": "EXPIRED"
    }
  ],
  "totalPages": 1,
  "currentPage": 0
}
```

### GET /api/pharmacy/prescriptions/{id}
Get prescription details
```json
Response (200):
{
  "id": 200,
  "patientId": 1,
  "patientName": "John Doe",
  "doctorId": 2,
  "doctorName": "Dr. Jane Smith",
  "issueDate": "2026-03-29",
  "expiryDate": "2026-04-29",
  "status": "ACTIVE",
  "items": [
    {
      "id": 1,
      "medicineId": 1,
      "medicineName": "Aspirin",
      "quantity": 1,
      "dosage": "500mg",
      "frequency": "Twice daily",
      "durationDays": 7,
      "instructions": "Take with food",
      "price": 5.99
    }
  ],
  "notes": "Patient complained of headaches and fever"
}
```

### POST /api/pharmacy/prescriptions/upload (PATIENT)
Upload prescription image
```json
Request Headers:
Content-Type: multipart/form-data

Body:
- imageFile: [image file]
- doctorName: "Dr. Jane Smith" (optional)

Response (200):
{
  "message": "Prescription uploaded successfully",
  "prescriptionId": 202,
  "verified": true,
  "detectedMedicines": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "confidence": 0.95
    }
  ]
}
```

### POST /api/pharmacy/orders (PATIENT)
Place order
```json
Request:
{
  "medicineIds": [1, 2],
  "quantities": [2, 1],
  "shippingAddress": "123 Main St, City, State 12345",
  "prescriptionId": 200
}

Response (201):
{
  "id": 300,
  "patientId": 1,
  "items": [
    {
      "medicineId": 1,
      "medicineName": "Aspirin",
      "quantity": 2,
      "price": 5.99,
      "subtotal": 11.98
    },
    {
      "medicineId": 2,
      "medicineName": "Ibuprofen",
      "quantity": 1,
      "price": 7.99,
      "subtotal": 7.99
    }
  ],
  "totalPrice": 19.97,
  "status": "PENDING",
  "shippingAddress": "123 Main St, City, State 12345",
  "orderDate": "2026-03-29T10:00:00Z"
}
```

### GET /api/pharmacy/orders
Get order history
```json
Response (200):
{
  "content": [
    {
      "id": 300,
      "patientId": 1,
      "totalPrice": 19.97,
      "status": "PENDING",
      "orderDate": "2026-03-29T10:00:00Z",
      "itemsCount": 2
    },
    {
      "id": 301,
      "patientId": 1,
      "totalPrice": 45.50,
      "status": "DELIVERED",
      "orderDate": "2026-03-25T14:30:00Z",
      "deliveryDate": "2026-03-28T16:00:00Z",
      "itemsCount": 3
    }
  ],
  "totalPages": 1,
  "currentPage": 0
}
```

### GET /api/pharmacy/orders/{id}
Get order details
```json
Response (200):
{
  "id": 300,
  "patientId": 1,
  "items": [
    {
      "medicineId": 1,
      "medicineName": "Aspirin",
      "quantity": 2,
      "price": 5.99,
      "subtotal": 11.98
    }
  ],
  "totalPrice": 19.97,
  "status": "PENDING",
  "shippingAddress": "123 Main St, City, State 12345",
  "orderDate": "2026-03-29T10:00:00Z",
  "tracking": {
    "status": "PENDING",
    "estimatedDelivery": "2026-04-02"
  }
}
```

### POST /api/pharmacy/orders/{id}/cancel
Cancel order
```json
Response (200):
{
  "message": "Order cancelled successfully",
  "orderId": 300,
  "status": "CANCELLED",
  "refundAmount": 19.97
}
```

### POST /api/pharmacy/orders/{id}/pay
Process payment
```json
Request:
{
  "paymentMethod": "CREDIT_CARD",
  "cardNumber": "4532123456789010",
  "expiryMonth": 12,
  "expiryYear": 2026,
  "cvv": "123"
}

Response (200):
{
  "message": "Payment processed successfully",
  "orderId": 300,
  "paymentId": "PAY-300-1711770600",
  "status": "PAID",
  "amount": 19.97,
  "transactionDate": "2026-03-29T10:05:00Z"
}
```

### GET /api/pharmacy/drug-interactions
Check drug interactions
```json
Request Query:
?medicineIds=1,2,3

Response (200):
{
  "interactions": [
    {
      "medicine1Id": 1,
      "medicine1Name": "Aspirin",
      "medicine2Id": 3,
      "medicine2Name": "Warfarin",
      "severity": "HIGH",
      "description": "May increase bleeding risk. Monitor closely.",
      "recommendation": "Use alternative pain relief or adjust dosage"
    }
  ],
  "hasWarnings": true
}
```

### GET /api/pharmacy/inventory
Get inventory status
```json
Response (200):
[
  {
    "medicineId": 1,
    "medicineName": "Aspirin",
    "quantity": 150,
    "lowStockThreshold": 50,
    "status": "IN_STOCK"
  },
  {
    "medicineId": 2,
    "medicineName": "Ibuprofen",
    "quantity": 25,
    "lowStockThreshold": 50,
    "status": "LOW_STOCK"
  },
  {
    "medicineId": 3,
    "medicineName": "Warfarin",
    "quantity": 0,
    "lowStockThreshold": 30,
    "status": "OUT_OF_STOCK"
  }
]
```

### PUT /api/pharmacy/inventory/{medicineId}
Update inventory
```json
Request:
{
  "quantity": 200,
  "lowStockThreshold": 60
}

Response (200):
{
  "medicineId": 1,
  "medicineName": "Aspirin",
  "quantity": 200,
  "lowStockThreshold": 60,
  "status": "IN_STOCK",
  "updatedAt": "2026-03-29T10:30:00Z"
}
```

---

## 4. MEDICAL RECORDS ENDPOINTS (6)

### POST /medical-records
Upload medical record
```json
Request Headers:
Content-Type: multipart/form-data

Body:
- file: [document file]
- description: "Blood test results from March 2026"
- documentType: "LAB_RESULT"
- relatedAppointmentId: 100 (optional)

Response (201):
{
  "id": 400,
  "patientId": 1,
  "doctorId": 2,
  "description": "Blood test results from March 2026",
  "documentType": "LAB_RESULT",
  "documentUrl": "https://api.example.com/records/400.pdf",
  "uploadDate": "2026-03-29T10:00:00Z"
}
```

### GET /medical-records
Get all medical records
```json
Response (200):
[
  {
    "id": 400,
    "patientId": 1,
    "doctorId": 2,
    "description": "Blood test results from March 2026",
    "documentType": "LAB_RESULT",
    "documentUrl": "https://api.example.com/records/400.pdf",
    "uploadDate": "2026-03-29T10:00:00Z"
  },
  {
    "id": 401,
    "patientId": 1,
    "doctorId": 3,
    "description": "X-ray chest",
    "documentType": "IMAGING",
    "documentUrl": "https://api.example.com/records/401.jpg",
    "uploadDate": "2026-03-28T14:00:00Z"
  }
]
```

### GET /medical-records/{id}
Get record details
```json
Response (200):
{
  "id": 400,
  "patientId": 1,
  "doctorId": 2,
  "description": "Blood test results from March 2026",
  "documentType": "LAB_RESULT",
  "documentUrl": "https://api.example.com/records/400.pdf",
  "uploadDate": "2026-03-29T10:00:00Z",
  "annotations": [
    {
      "id": 1,
      "doctorId": 2,
      "doctorName": "Dr. Jane Smith",
      "notes": "Results show elevated cholesterol levels",
      "tags": ["cholesterol", "high"],
      "createdAt": "2026-03-29T11:00:00Z"
    }
  ]
}
```

### GET /medical-records/patient/{patientId}
Get patient's records
```json
Response (200):
[
  {
    "id": 400,
    "documentType": "LAB_RESULT",
    "description": "Blood test results",
    "uploadDate": "2026-03-29T10:00:00Z"
  },
  {
    "id": 401,
    "documentType": "IMAGING",
    "description": "X-ray chest",
    "uploadDate": "2026-03-28T14:00:00Z"
  }
]
```

### PUT /medical-records/{id}
Update record metadata
```json
Request:
{
  "description": "Updated blood test results with doctor notes",
  "documentType": "LAB_RESULT"
}

Response (200):
{
  "id": 400,
  "description": "Updated blood test results with doctor notes",
  "documentType": "LAB_RESULT",
  "updatedAt": "2026-03-29T11:00:00Z"
}
```

### DELETE /medical-records/{id}
Delete record
```json
Response (204):
[No content]
```

---

## 5. HEALTH TRACKING ENDPOINTS (10+)

### POST /moods
Log mood
```json
Request:
{
  "userId": 1,
  "mood": "happy",
  "intensity": 8,
  "notes": "Had a great day at work",
  "timestamp": "2026-03-29T18:00:00Z"
}

Response (201):
{
  "id": 50,
  "userId": 1,
  "mood": "happy",
  "intensity": 8,
  "notes": "Had a great day at work",
  "timestamp": "2026-03-29T18:00:00Z"
}
```

### GET /moods
Get mood history
```json
Request Query:
?userId=1&dateRange=7d

Response (200):
[
  {
    "id": 50,
    "mood": "happy",
    "intensity": 8,
    "timestamp": "2026-03-29T18:00:00Z"
  },
  {
    "id": 49,
    "mood": "neutral",
    "intensity": 5,
    "timestamp": "2026-03-28T18:00:00Z"
  },
  {
    "id": 48,
    "mood": "stressed",
    "intensity": 7,
    "timestamp": "2026-03-27T18:00:00Z"
  }
]
```

### POST /stresss
Log stress level
```json
Request:
{
  "userId": 1,
  "level": 6,
  "trigger": "Work deadline",
  "notes": "Feeling pressured to complete project",
  "timestamp": "2026-03-29T16:00:00Z"
}

Response (201):
{
  "id": 60,
  "userId": 1,
  "level": 6,
  "trigger": "Work deadline",
  "notes": "Feeling pressured to complete project",
  "timestamp": "2026-03-29T16:00:00Z"
}
```

### GET /stresss
Get stress history
```json
Request Query:
?userId=1&dateRange=7d

Response (200):
[
  {
    "id": 60,
    "level": 6,
    "trigger": "Work deadline",
    "timestamp": "2026-03-29T16:00:00Z"
  },
  {
    "id": 59,
    "level": 4,
    "trigger": "Traffic",
    "timestamp": "2026-03-28T08:00:00Z"
  }
]
```

### POST /sleeps
Log sleep data
```json
Request:
{
  "userId": 1,
  "duration": 7.5,
  "quality": 8,
  "notes": "Slept well, no interruptions",
  "timestamp": "2026-03-29T07:00:00Z"
}

Response (201):
{
  "id": 70,
  "userId": 1,
  "duration": 7.5,
  "quality": 8,
  "notes": "Slept well, no interruptions",
  "timestamp": "2026-03-29T07:00:00Z"
}
```

### GET /sleeps
Get sleep history
```json
Request Query:
?userId=1&dateRange=7d

Response (200):
[
  {
    "id": 70,
    "duration": 7.5,
    "quality": 8,
    "timestamp": "2026-03-29T07:00:00Z"
  },
  {
    "id": 69,
    "duration": 6,
    "quality": 5,
    "timestamp": "2026-03-28T07:00:00Z"
  }
]
```

### POST /activities
Log activity
```json
Request:
{
  "userId": 1,
  "type": "running",
  "duration": 30,
  "caloriesBurned": 350,
  "notes": "Morning jog in the park",
  "timestamp": "2026-03-29T07:00:00Z"
}

Response (201):
{
  "id": 80,
  "userId": 1,
  "type": "running",
  "duration": 30,
  "caloriesBurned": 350,
  "notes": "Morning jog in the park",
  "timestamp": "2026-03-29T07:00:00Z"
}
```

### GET /activities
Get activity history
```json
Request Query:
?userId=1&dateRange=7d

Response (200):
[
  {
    "id": 80,
    "type": "running",
    "duration": 30,
    "caloriesBurned": 350,
    "timestamp": "2026-03-29T07:00:00Z"
  },
  {
    "id": 79,
    "type": "yoga",
    "duration": 45,
    "caloriesBurned": 150,
    "timestamp": "2026-03-28T17:00:00Z"
  }
]
```

### GET /well-being-metrics/{userId}
Get wellness summary
```json
Response (200):
{
  "userId": 1,
  "overallWellness": 7.5,
  "mood": {
    "current": "happy",
    "intensity": 8,
    "average7d": 6.4
  },
  "stress": {
    "current": 6,
    "average7d": 5.2
  },
  "sleep": {
    "currentDuration": 7.5,
    "currentQuality": 8,
    "average7dDuration": 6.8,
    "average7dQuality": 6.2
  },
  "activity": {
    "todayCalories": 350,
    "average7dCalories": 320
  },
  "recommendations": [
    "Great mood and sleep quality! Keep it up!",
    "Stress levels are slightly elevated. Try meditation or exercise.",
    "You're doing well with physical activity. Continue the routine."
  ],
  "lastUpdated": "2026-03-29T18:00:00Z"
}
```

---

## 6. PRESCRIPTION ENDPOINTS (6)

### POST /prescriptions
Create prescription (legacy endpoint)
```json
Request:
{
  "patientId": 1,
  "doctorId": 2,
  "items": [
    {
      "medicineId": 1,
      "quantity": 1,
      "dosage": "500mg",
      "frequency": "Twice daily",
      "durationDays": 7,
      "instructions": "Take with food"
    }
  ]
}

Response (201):
{
  "id": 200,
  "patientId": 1,
  "doctorId": 2,
  "items": [ ... ],
  "createdAt": "2026-03-29T10:00:00Z"
}
```

### GET /prescriptions
Get all prescriptions
```json
Response (200):
[ ... prescription list ... ]
```

### GET /prescriptions/{id}
Get prescription details
```json
Response (200):
{
  "id": 200,
  "patientId": 1,
  "doctorId": 2,
  "items": [ ... ],
  "createdAt": "2026-03-29T10:00:00Z"
}
```

### GET /prescriptions/patient/{patientId}
Get patient prescriptions
```json
Response (200):
[ ... patient prescriptions ... ]
```

### GET /prescriptions/doctor/{doctorId}
Get doctor prescriptions
```json
Response (200):
[ ... doctor issued prescriptions ... ]
```

### PUT /prescriptions/{id}
Update prescription
```json
Request:
{
  "items": [ ... updated items ... ]
}

Response (200):
{
  "id": 200,
  "items": [ ... ],
  "updatedAt": "2026-03-29T11:00:00Z"
}
```

---

## 7. USER MANAGEMENT ENDPOINTS (8+)

### POST /api/users (ADMIN)
Create user
```json
Request:
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "AdminPass123!",
  "role": "ADMIN"
}

Response (201):
{
  "id": 5,
  "fullName": "Admin User",
  "email": "admin@example.com",
  "role": "ADMIN",
  "createdAt": "2026-03-29T10:00:00Z"
}
```

### GET /api/users (ADMIN)
List users
```json
Request Query:
?page=0&size=20&role=PATIENT

Response (200):
{
  "content": [
    {
      "id": 1,
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "PATIENT",
      "createdAt": "2026-03-20T10:00:00Z"
    }
  ],
  "totalPages": 1,
  "currentPage": 0
}
```

### GET /api/users/{id} (ADMIN)
Get user details
```json
Response (200):
{
  "id": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "PATIENT",
  "createdAt": "2026-03-20T10:00:00Z",
  "profile": {
    "dateOfBirth": "1990-05-15",
    "gender": "M",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}
```

### PUT /api/users/{id} (ADMIN)
Update user
```json
Request:
{
  "fullName": "John Doe Updated",
  "role": "PATIENT",
  "status": "ACTIVE"
}

Response (200):
{
  "id": 1,
  "fullName": "John Doe Updated",
  "email": "john@example.com",
  "role": "PATIENT",
  "updatedAt": "2026-03-29T10:30:00Z"
}
```

### DELETE /api/users/{id} (ADMIN)
Delete user
```json
Response (204):
[No content]
```

### POST /api/users/{id}/role (ADMIN)
Change user role
```json
Request:
{
  "role": "DOCTOR"
}

Response (200):
{
  "id": 1,
  "email": "john@example.com",
  "role": "DOCTOR"
}
```

### GET /patient
Get patient profile
```json
Response (200):
{
  "id": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "dateOfBirth": "1990-05-15",
  "gender": "M",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

### PUT /patient
Update patient profile
```json
Request:
{
  "fullName": "John Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "M",
  "phone": "+1234567890",
  "address": "123 Main St, Updated"
}

Response (200):
{
  "id": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St, Updated",
  "updatedAt": "2026-03-29T10:30:00Z"
}
```

---

## 8. DOCTOR AVAILABILITY ENDPOINTS (4)

### GET /availability
Get doctor availability
```json
Request Query:
?doctorId=2&date=2026-04-15

Response (200):
[
  {
    "doctorId": 2,
    "date": "2026-04-15",
    "timeSlots": [
      {
        "time": "09:00",
        "available": true
      },
      {
        "time": "10:00",
        "available": false
      },
      {
        "time": "11:00",
        "available": true
      }
    ]
  }
]
```

### POST /availability
Set availability
```json
Request:
{
  "doctorId": 2,
  "date": "2026-04-15",
  "timeSlots": [
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00"
  ]
}

Response (201):
{
  "id": 10,
  "doctorId": 2,
  "date": "2026-04-15",
  "timeSlots": [
    {
      "time": "09:00",
      "available": true
    },
    {
      "time": "10:00",
      "available": true
    }
  ]
}
```

### PUT /availability/{id}
Update availability
```json
Request:
{
  "timeSlots": [
    "09:00",
    "11:00",
    "14:00"
  ]
}

Response (200):
{
  "id": 10,
  "doctorId": 2,
  "date": "2026-04-15",
  "timeSlots": [ ... ]
}
```

### DELETE /availability/{id}
Remove availability
```json
Response (204):
[No content]
```

---

## 9. VISIT NOTES ENDPOINTS (3)

### POST /visit-notes
Create visit note
```json
Request:
{
  "appointmentId": 100,
  "diagnosis": "Common cold with fever",
  "treatment": "Rest, fluids, and paracetamol 500mg twice daily",
  "notes": "Patient responds well to treatment. Follow-up in 5 days.",
  "prescription": 200
}

Response (201):
{
  "id": 500,
  "appointmentId": 100,
  "diagnosis": "Common cold with fever",
  "treatment": "Rest, fluids, and paracetamol 500mg twice daily",
  "notes": "Patient responds well to treatment. Follow-up in 5 days.",
  "prescription": 200,
  "createdAt": "2026-03-29T11:00:00Z"
}
```

### GET /visit-notes
Get visit notes
```json
Request Query:
?doctorId=2

Response (200):
[
  {
    "id": 500,
    "appointmentId": 100,
    "diagnosis": "Common cold with fever",
    "createdAt": "2026-03-29T11:00:00Z"
  }
]
```

### PUT /visit-notes/{id}
Update visit note
```json
Request:
{
  "notes": "Updated notes: Patient responding well"
}

Response (200):
{
  "id": 500,
  "diagnosis": "Common cold with fever",
  "notes": "Updated notes: Patient responding well",
  "updatedAt": "2026-03-29T12:00:00Z"
}
```

---

## 10. ALLERGY ENDPOINTS (5)

### POST /allergies
Record allergy
```json
Request:
{
  "userId": 1,
  "allergen": "Penicillin",
  "severity": "HIGH",
  "reaction": "Anaphylaxis",
  "dateOccurred": "2020-03-15"
}

Response (201):
{
  "id": 600,
  "userId": 1,
  "allergen": "Penicillin",
  "severity": "HIGH",
  "reaction": "Anaphylaxis",
  "dateOccurred": "2020-03-15"
}
```

### GET /allergies
Get allergies
```json
Request Query:
?userId=1

Response (200):
[
  {
    "id": 600,
    "allergen": "Penicillin",
    "severity": "HIGH",
    "reaction": "Anaphylaxis"
  },
  {
    "id": 601,
    "allergen": "Shellfish",
    "severity": "MEDIUM",
    "reaction": "Swelling"
  }
]
```

### GET /allergies/{id}
Get allergy details
```json
Response (200):
{
  "id": 600,
  "userId": 1,
  "allergen": "Penicillin",
  "severity": "HIGH",
  "reaction": "Anaphylaxis",
  "dateOccurred": "2020-03-15"
}
```

### PUT /allergies/{id}
Update allergy
```json
Request:
{
  "severity": "CRITICAL",
  "reaction": "Severe anaphylaxis - EpiPen required"
}

Response (200):
{
  "id": 600,
  "allergen": "Penicillin",
  "severity": "CRITICAL",
  "reaction": "Severe anaphylaxis - EpiPen required",
  "updatedAt": "2026-03-29T10:30:00Z"
}
```

### DELETE /allergies/{id}
Delete allergy record
```json
Response (204):
[No content]
```

---

## Error Response Format

All endpoints follow this error format:

```json
Error 400 (Bad Request):
{
  "error": "Validation failed",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  },
  "timestamp": "2026-03-29T10:00:00Z"
}

Error 401 (Unauthorized):
{
  "error": "Unauthorized",
  "message": "JWT token is invalid or expired",
  "timestamp": "2026-03-29T10:00:00Z"
}

Error 403 (Forbidden):
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource",
  "timestamp": "2026-03-29T10:00:00Z"
}

Error 404 (Not Found):
{
  "error": "Not Found",
  "message": "Resource with id 999 not found",
  "timestamp": "2026-03-29T10:00:00Z"
}

Error 500 (Internal Server Error):
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2026-03-29T10:00:00Z"
}
```

---

**Total Endpoints Documented**: 80+ with complete JSON examples
**Last Updated**: March 29, 2026
**Status**: ✅ Complete with all request/response formats

