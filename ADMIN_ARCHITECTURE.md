# MediCareAI Admin Panel - Architecture Documentation

## 🏗️ Architecture Overview

The admin panel has been structured following **Angular best practices** with a modular, scalable architecture that implements **Separation of Concerns (SoC)** principles.

## 📁 Project Structure

```
src/app/
├── shared/                          # Shared resources across the application
│   ├── models/                      # TypeScript interfaces and data models
│   │   ├── user.model.ts
│   │   ├── appointment.model.ts
│   │   ├── specialty.model.ts
│   │   ├── medical.model.ts
│   │   ├── health-event.model.ts
│   │   ├── subscription.model.ts
│   │   ├── forum.model.ts
│   │   └── collaboration.model.ts
│   │
│   └── services/                    # API services for backend communication
│       ├── user.service.ts
│       ├── appointment.service.ts
│       ├── specialty.service.ts
│       ├── medical.service.ts
│       ├── health-event.service.ts
│       ├── subscription.service.ts
│       ├── forum.service.ts
│       └── collaboration.service.ts
│
├── admin/                           # Admin module
│   ├── admin.component.ts           # Main admin shell component
│   ├── admin.component.html
│   ├── admin.component.css
│   │
│   └── modules/                     # Feature modules
│       ├── dashboard/               # System overview and analytics
│       │   ├── dashboard.component.ts
│       │   ├── dashboard.component.html
│       │   └── dashboard.component.css
│       │
│       ├── user-management/         # User CRUD operations
│       │   ├── user-list.component.ts
│       │   ├── user-list.component.html
│       │   └── user-list.component.css
│       │
│       ├── appointments/            # Appointment management
│       │   ├── appointment-list.component.ts
│       │   ├── appointment-list.component.html
│       │   └── appointment-list.component.css
│       │
│       ├── medical/                 # Medical data (specialties, diseases, symptoms)
│       │   ├── medical-management.component.ts
│       │   ├── medical-management.component.html
│       │   └── medical-management.component.css
│       │
│       ├── events/                  # Health events management
│       │   ├── events-list.component.ts
│       │   ├── events-list.component.html
│       │   └── events-list.component.css
│       │
│       ├── subscriptions/           # Subscription plans management
│       │   ├── subscription-management.component.ts
│       │   ├── subscription-management.component.html
│       │   └── subscription-management.component.css
│       │
│       └── forum/                   # Forum and community management
│           ├── forum-management.component.ts
│           ├── forum-management.component.html
│           └── forum-management.component.css
│
├── services/                        # Core services
│   ├── auth.service.ts              # Authentication logic
│   ├── auth.guard.ts                # Route protection
│   └── auth.interceptor.ts          # HTTP interceptor for tokens
│
└── environments/                    # Environment configurations
    ├── environment.ts
    └── environment.prod.ts
```

## 🎯 Key Features by Module

### 1. **Dashboard Module** 📊
- **Route**: `/admin/dashboard`
- **Features**:
  - Platform statistics overview
  - Key metrics (users, appointments, events, forum posts)
  - Quick action buttons
  - Real-time system health indicators

### 2. **User Management Module** 👥
- **Route**: `/admin/users`
- **Endpoints Used**:
  - `GET /users` - List all users
  - `GET /users/{id}` - Get user details
  - `POST /users` - Create user
  - `PUT /users/{id}` - Update user
  - `DELETE /users/{id}` - Delete user
  - `GET /users/email/{email}` - Get user by email
- **Features**:
  - View all platform users
  - Filter by role (Admin, Doctor, Patient, Pharmacist)
  - Search by username or email
  - Edit/Delete users
  - Role-based badges
  - Premium status indicators

### 3. **Appointment Management Module** 📅
- **Route**: `/admin/appointments`
- **Endpoints Used**:
  - `GET /appointments` - List all appointments (admin view)
  - `GET /appointments/{id}` - Get appointment details
  - `POST /appointments` - Create appointment
  - `PUT /appointments/{id}` - Update appointment
  - `DELETE /appointments/{id}` - Cancel appointment
  - `POST /appointments/{id}/no-show` - Mark as no-show
  - `GET /appointments/doctor/{doctorId}` - Doctor's appointments
  - `GET /availability/doctor/{doctorId}` - Doctor availability
  - `POST /availability` - Create availability slot
- **Features**:
  - View all appointments across the platform
  - Filter by status (Scheduled, Completed, Cancelled, No-Show)
  - Mark appointments as no-show
  - Cancel appointments
  - View consultation types
  - Manage doctor availability

### 4. **Medical Data Management Module** 🏥
- **Route**: `/admin/medical`
- **Endpoints Used**:
  - **Specialties**: `/specialties` (CRUD)
  - **Diseases**: `/diseases` (CRUD)
    - `GET /diseases/by-specialty/{specialtyId}`
  - **Symptoms**: `/symptoms` (CRUD)
  - **Medical Records**: `/records` (CRUD)
- **Features**:
  - Tabbed interface for Specialties, Diseases, and Symptoms
  - Complete CRUD operations
  - Associate diseases with specialties
  - Link symptoms to diseases
  - Medical record management

### 5. **Health Events Module** 🎪
- **Route**: `/admin/events`
- **Endpoints Used**:
  - `GET /events` - List all events
  - `GET /events/upcoming` - Upcoming events
  - `POST /events` - Create event
  - `PUT /events/{id}` - Update event
  - `DELETE /events/{id}` - Delete event
  - `POST /events/{eventId}/participants/{userId}` - Add participant
  - `DELETE /events/{eventId}/participants/{userId}` - Remove participant
  - `GET /feedbacks/by-event/{eventId}` - Event feedbacks
- **Features**:
  - Grid view of health events
  - Event creation and management
  - Participant management
  - Feedback collection and review
  - Event location and date tracking

### 6. **Subscription Management Module** 💳
- **Route**: `/admin/subscriptions`
- **Endpoints Used**:
  - `GET /subscription-plans` - List all plans
  - `POST /subscription-plans` - Create plan
  - `PUT /subscription-plans/{id}` - Update plan
  - `DELETE /subscription-plans/{id}` - Delete plan
  - `GET /subscriptions/user/{userId}` - User subscriptions
  - `PUT /subscriptions/{id}/renew` - Renew subscription
- **Features**:
  - Visual plan cards with pricing
  - CRUD operations for subscription plans
  - Duration and pricing management
  - User subscription tracking
  - Renewal management

### 7. **Forum Management Module** 💬
- **Route**: `/admin/forum`
- **Endpoints Used**:
  - `GET /forum/posts` - List all posts
  - `POST /forum/posts` - Create post
  - `PUT /forum/posts/{id}` - Update post
  - `DELETE /forum/posts/{id}` - Delete post
  - `GET /forum/posts/{postId}/replies` - Post replies
  - `POST /forum/posts/{postId}/replies` - Create reply
  - `DELETE /forum/replies/{id}` - Delete reply
- **Features**:
  - Monitor all forum discussions
  - View post details with reply counts
  - Premium-only post indicators
  - Content moderation tools
  - Delete inappropriate posts/replies

## 🔐 Security & Authentication

### Auth Flow
1. **Login**: User authenticates via `auth.service.ts`
2. **Token Storage**: JWT token stored in localStorage
3. **Interceptor**: `auth.interceptor.ts` automatically adds token to all HTTP requests
4. **Route Guard**: `auth.guard.ts` protects admin routes
5. **Logout**: Clears token and redirects to login

### Protected Routes
All admin routes require:
- Valid authentication token
- Role: `ADMIN`

## 🎨 UI/UX Design Patterns

### Consistent Layout
- **Sidebar Navigation**: Fixed left sidebar with module links
- **Active Link Highlighting**: `routerLinkActive` directive
- **Main Content Area**: Dynamic router outlet for module components
- **Responsive Design**: Mobile-friendly sidebar toggle

### Shared Styles
- Modular CSS with component-specific styles
- Shared utility classes via CSS imports
- Consistent color scheme:
  - Primary: `#008236` (Green)
  - Success: `#00A63E`
  - Error: `#dc2626`
  - Info: `#2B7FFF`
  - Warning: `#fbbf24`

### Component Patterns
- **Table Views**: For list-based data (users, appointments, forum posts)
- **Card Grids**: For visual items (events, subscription plans)
- **Tabs**: For grouped data (medical management)
- **Status Badges**: Color-coded status indicators
- **Action Buttons**: Consistent icon-based actions

## 📡 API Integration

### Base URL Configuration
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8805/api'
};
```

### Service Pattern
All services follow a consistent pattern:
```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {
  private apiUrl = `${environment.apiUrl}/endpoint`;
  
  constructor(private http: HttpClient) {}
  
  getAll(): Observable<Entity[]> { }
  getById(id: number): Observable<Entity> { }
  create(entity: Entity): Observable<Entity> { }
  update(id: number, entity: Partial<Entity>): Observable<Entity> { }
  delete(id: number): Observable<void> { }
}
```

## 🚀 Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Analytics**: Charts and graphs using Chart.js/D3.js
3. **Bulk Operations**: Multi-select and bulk actions
4. **Export Functionality**: CSV/PDF export for reports
5. **Advanced Filters**: Date ranges, multi-criteria filters
6. **Audit Logs**: Complete admin action tracking
7. **Notifications**: Real-time admin notifications
8. **User Impersonation**: Admin view as user
9. **Advanced Search**: Full-text search across entities
10. **Role Permissions**: Granular permission management

### Additional Modules
- **Collaboration Management**: Sessions, documents, meetings
- **Medical Records**: Patient health records viewer
- **Inventory Control**: Medical supplies tracking
- **Pharmacy Management**: Prescription and medication tracking
- **Analytics Dashboard**: Advanced reporting and insights
- **System Settings**: Platform configuration

## 🛠️ Development Guidelines

### Adding a New Module

1. **Create Component Files**:
```bash
src/app/admin/modules/new-module/
  ├── new-module.component.ts
  ├── new-module.component.html
  └── new-module.component.css
```

2. **Create Service** (if needed):
```bash
src/app/shared/services/new-module.service.ts
```

3. **Create Model**:
```bash
src/app/shared/models/new-module.model.ts
```

4. **Add Route** in `app-routing-module.ts`:
```typescript
{
  path: 'admin',
  component: AdminComponent,
  children: [
    { path: 'new-module', component: NewModuleComponent }
  ]
}
```

5. **Add Navigation Link** in `admin.component.html`

6. **Register Component** in `app-module.ts`

### Code Style
- Use TypeScript strict mode
- Follow Angular style guide
- Use RxJS operators effectively
- Implement proper error handling
- Add loading states
- Use async pipe for subscriptions
- Unsubscribe from observables in `ngOnDestroy`

## 📚 Dependencies

### Core
- Angular 17+
- TypeScript 5+
- RxJS 7+

### HTTP & Routing
- @angular/common/http
- @angular/router

### Forms
- @angular/forms (FormsModule)

## 🔄 State Management

Currently using:
- **Services with BehaviorSubject** for shared state
- **Local component state** for UI-specific data

Future consideration:
- NgRx for complex state management
- Signals (Angular 16+) for reactive state

## 📊 Performance Optimizations

1. **Lazy Loading**: Future modules can be lazy-loaded
2. **OnPush Change Detection**: For list components
3. **Virtual Scrolling**: For large data sets
4. **Pagination**: Server-side pagination for tables
5. **Caching**: Service-level caching for frequently accessed data

## 🧪 Testing Strategy

### Unit Tests
- Component logic tests
- Service tests with mocked HTTP
- Guard and interceptor tests

### Integration Tests
- Component + Service integration
- Routing tests
- Form validation tests

### E2E Tests
- Critical user flows
- Admin workflows
- CRUD operations

## 📖 API Documentation Reference

The admin panel integrates with the following API endpoints:
- Base URL: `http://localhost:8805/api`
- Swagger Documentation: `http://localhost:8805/api/v3/api-docs`
- All requests require Bearer token authentication
- RESTful design patterns
- JSON request/response format

## 🎓 Learning Resources

- [Angular Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Angular Style Guide](https://angular.io/guide/styleguide)

---

**Built with ❤️ for MediCareAI Platform**
