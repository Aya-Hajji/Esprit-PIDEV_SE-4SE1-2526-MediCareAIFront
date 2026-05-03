# Module 2 Integration Guide 🚀

## Quick Start

### 1. Import Routes in App

In `src/app/app-routing-module.ts`:

```typescript
import { PROFESSIONAL_COLLABORATION_ROUTES } from './modules/professional-collaboration';

export const routes: Routes = [
  // ... existing routes ...
  {
    path: 'professional-collaboration',
    loadChildren: () => Promise.resolve(PROFESSIONAL_COLLABORATION_ROUTES)
  },
  // ... other routes ...
];
```

### 2. Update Navigation Menu

Add links to your navigation component:

```html
<nav>
  <!-- Existing links -->
  <a routerLink="/professional-collaboration">Collaborations</a>
  <a routerLink="/professional-collaboration/meetings">Réunions</a>
</nav>
```

### 3. Verify Authentication

Ensure AuthService stores token with key 'authToken':

```typescript
// In AuthService
login(credentials: any): Observable<any> {
  return this.http.post('/api/auth/login', credentials).pipe(
    tap(response => {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userId', response.userId);
    })
  );
}
```

## Backend API Setup

### Expected API Structure

The backend should provide these endpoints:

```
BASE_URL: http://localhost:8089/MediCareAI

/api/collaboration/sessions
/api/collaboration/documents
/api/collaboration/annotations
/api/meetings
```

### Authentication

All endpoints expect:
- **Headers**: `Authorization: Bearer {token}`
- **Content-Type**: `application/json`

### Response Format

Sessions:
```json
{
  "id": 1,
  "title": "Diagnostic collaboratif",
  "description": "...",
  "caseNumber": "CASE-2024-001",
  "category": "CARDIOLOGY",
  "status": "ACTIVE",
  "organizerId": 123,
  "organizerName": "Dr. Smith",
  "maxParticipants": 10,
  "participantCount": 5,
  "documentCount": 3,
  "createdAt": "2024-01-15T10:00:00Z",
  "isOrganicer": true,
  "membershipRole": "ORGANIZER"
}
```

Meetings:
```json
{
  "id": 1,
  "title": "Consultation vidéo",
  "description": "...",
  "scheduledDate": "2024-01-20",
  "scheduledTime": "15:30",
  "duration": 60,
  "venue": "VIRTUAL",
  "meetingLink": "https://teams.microsoft.com/...",
  "status": "SCHEDULED",
  "isRecorded": true,
  "organizerId": 123,
  "participantCount": 8
}
```

## Environment Configuration

Ensure `environment.ts` has the correct API URL:

```typescript
export const environment = {
  apiUrl: 'http://localhost:8089/MediCareAI/',
  // ... other config
};
```

## Required Features

### For Sessions:
- Role-based access (ORGANIZER, EDITOR, VIEWER)
- Status management
- Participant management
- Document association

### For Meetings:
- Schedule with date/time
- Participant tracking
- Meeting link generation
- Recording capability

## Testing Navigation

After integration, test these routes:

1. **Collaboration Sessions**
   - `/professional-collaboration` - List view
   - `/professional-collaboration/create` - Create new
   - `/professional-collaboration/edit/1` - Edit session
   - `/professional-collaboration/1` - Session details

2. **Meetings**
   - `/professional-collaboration/meetings` - List view
   - `/professional-collaboration/meeting/create` - Schedule
   - `/professional-collaboration/meeting/edit/1` - Edit
   - `/professional-collaboration/meeting/1` - Meeting details

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│         Angular Component               │
│  (collaboration-list, meeting-list)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│           Services                      │
│  (CollaborationService, MeetingService) │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      AuthInterceptor / Headers          │
│    (JWT Token Management)               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         HTTP Requests                   │
│   (GET, POST, PUT, DELETE)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Backend API Server                 │
│    (Port 8089/MediCareAI)               │
└─────────────────────────────────────────┘
```

## Common Integration Issues

### Issue 1: "401 Unauthorized" on API calls

**Solution**: Verify token is stored in localStorage
```typescript
console.log('Token:', localStorage.getItem('authToken'));
console.log('UserId:', localStorage.getItem('userId'));
```

### Issue 2: "Cannot find module" errors

**Solution**: Ensure files are created in correct paths
```
src/app/modules/professional-collaboration/
├── components/
├── services/
├── models/
└── professional-collaboration.routes.ts
```

### Issue 3: Routes not working

**Solution**: Verify lazy loading in main routes
```typescript
{
  path: 'professional-collaboration',
  loadChildren: () => Promise.resolve(PROFESSIONAL_COLLABORATION_ROUTES)
}
```

### Issue 4: Styling not applied

**Solution**: Ensure CSS files are referenced in components
```typescript
@Component({
  styleUrls: ['./component-name.component.css']
})
```

## Integration Checklist

- [ ] Module files created in correct directory
- [ ] Routes added to app routing
- [ ] Navigation links updated
- [ ] Authentication configured
- [ ] API endpoints verified
- [ ] Environment URL configured
- [ ] localStorage keys match (authToken, userId)
- [ ] Components can be navigated to via URL
- [ ] Styling loads correctly
- [ ] Services can be injected
- [ ] API calls include auth headers
- [ ] No console errors on page load

## Performance Optimization Tips

1. **Lazy Loading Routes**: Already implemented ✅
2. **Standalone Components**: Already implemented ✅
3. **OnPush Change Detection**: Can be added to components
4. **Trackby in *ngFor**: Recommended for large lists
5. **Unsubscribe from Observables**: Use async pipe or takeUntil

## Security Considerations

1. **Token Storage**: Currently using localStorage (consider more secure alternatives)
2. **CORS**: Ensure backend allows requests from frontend origin
3. **HTTPS**: Use in production only
4. **Role-Based Access**: Frontend validates, backend enforces
5. **Input Validation**: Forms validate before submission

## Support & Debugging

Enable detailed logging:

```typescript
// In services, add console.logs
console.log('Request:', method, url);
console.log('Auth Headers:', headers);
console.log('Response:', response);
console.log('Error:', error);
```

Check browser DevTools:
- Network tab for HTTP requests
- Console for errors and logs
- Application tab for localStorage

## Next Steps

1. Configure backend endpoints
2. Test each route individually
3. Test with real authentication
4. Test with sample data
5. Monitor performance in DevTools
6. Gather user feedback
7. Iterate on UI/UX

---

**Module Version**: 2.0.0  
**Last Updated**: 2024  
**Status**: Ready for Integration
