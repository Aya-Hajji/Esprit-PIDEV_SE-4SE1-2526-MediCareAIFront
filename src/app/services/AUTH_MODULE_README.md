# Auth Module Documentation

## Overview
The authentication module is configured to handle user registration and login with JWT token-based authentication. It integrates with the backend API running on `http://localhost:8805/auth`.

## Features
- User registration (signup)
- User login
- JWT token management
- Automatic token injection in HTTP requests
- User session persistence
- Role-based access control

## API Endpoints

### Register (Sign Up)
**Endpoint:** `POST http://localhost:8805/auth/register`

**Request Body:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Braheeeem",
  "email": "test@gmail.com",
  "password": "Test123",
  "role": "DOCTOR",
  "gender": "MALE",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "test@gmail.com",
    "firstName": "Ahmed",
    "lastName": "Braheeeem",
    "role": "DOCTOR",
    "gender": "MALE",
    "phoneNumber": "+1234567890"
  }
}
```

### Login
**Endpoint:** `POST http://localhost:8805/auth/login`

**Request Body:**
```json
{
  "email": "test@gmail.com",
  "password": "Test123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "test@gmail.com",
    "firstName": "Ahmed",
    "lastName": "Braheeeem",
    "role": "DOCTOR",
    "gender": "MALE",
    "phoneNumber": "+1234567890"
  }
}
```

## Services

### AuthService
Located in: `src/app/services/auth.service.ts`

**Key Methods:**
- `register(data: SignupRequest): Observable<AuthResponse>` - Register a new user
- `login(data: LoginRequest): Observable<AuthResponse>` - Login a user
- `logout(): void` - Logout user and clear session
- `isLoggedIn(): boolean` - Check if user is currently logged in
- `currentUserValue` - Get current logged-in user
- `tokenValue` - Get current auth token

**Observables:**
- `currentUser: Observable<any>` - Observable of current user
- `token: Observable<string | null>` - Observable of auth token

### AuthInterceptor
Located in: `src/app/services/auth.interceptor.ts`

Automatically adds the JWT token to all HTTP requests in the `Authorization` header:
```
Authorization: Bearer <token>
```

### AuthGuard
Located in: `src/app/services/auth.guard.ts`

Protects routes by checking if user is authenticated and has required role.

## Usage Examples

### In Components

**Using Auth Service:**
```typescript
import { AuthService } from '../services/auth.service';

export class MyComponent {
  constructor(private authService: AuthService) {}

  // Check if user is logged in
  if (this.authService.isLoggedIn()) {
    console.log(this.authService.currentUserValue);
  }

  // Subscribe to current user
  this.authService.currentUser.subscribe(user => {
    console.log('Current user:', user);
  });

  // Get token
  const token = this.authService.tokenValue;
}
```

### In Routing

**Protecting Routes:**
```typescript
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['DOCTOR', 'NURSE', 'PATIENT', 'PHARMACIST'] }
  }
];
```

## Components

### Landing Component
- Added "Sign Up" button in header navigation
- Added "Sign In" button in header navigation
- Both buttons navigate to respective pages

### Login Component
- Email and password login form
- Integrates with AuthService for authentication
- Stores JWT token and user data on successful login
- Redirects based on user role (admin to /admin, others to /dashboard)

### Signup Component
- Multi-step registration form
- Personal information, credentials, and role/details steps
- Integrates with AuthService for registration
- Stores JWT token and user data on successful registration
- Redirects to dashboard after registration

## Data Persistence

User data and tokens are persisted in browser localStorage:
- `authToken` - JWT authentication token
- `authUser` - User object (serialized as JSON)

This allows users to remain logged in across browser sessions until they explicitly logout or the token expires.

## Error Handling

Both login and registration handle errors gracefully:
- Network errors
- Invalid credentials
- Server errors

Error messages are displayed to users with appropriate feedback.

## Security Notes

1. **Token Storage:** Tokens are stored in localStorage. For production, consider using secure HttpOnly cookies.
2. **HTTPS:** Always use HTTPS in production to prevent token interception.
3. **Token Expiration:** Implement token refresh logic if tokens have expiration times.
4. **Password Validation:** Frontend validation is implemented; backend should also validate.
5. **CORS:** Ensure backend is configured with proper CORS settings for frontend domain.

## Next Steps / TODO

1. Implement token refresh mechanism
2. Add password reset functionality
3. Implement email verification
4. Add social login integration (Google, Microsoft, etc.)
5. Implement more granular role-based access control
6. Add user profile management
7. Implement logout confirmation
8. Add rate limiting for auth endpoints

## Troubleshooting

### Module not found errors
- Ensure HttpClientModule is imported in AppModule
- Verify AuthInterceptor is registered in providers

### Token not being sent
- Check if AuthInterceptor is properly configured
- Verify token is being stored in localStorage
- Check browser console for errors

### Redirect loops
- Verify AuthGuard logic
- Ensure login/signup pages don't require authentication
- Check routing configuration
