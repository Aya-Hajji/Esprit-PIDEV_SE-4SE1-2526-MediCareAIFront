# Module 2 Debug Guide 🔧

## Common Issues and Solutions

### 1. Authentication Errors

#### Issue: "401 Unauthorized" responses

**Symptoms:**
- All API calls return 401 status
- Error message: "Vous devez être connecté"
- Network tab shows no Authorization header

**Debugging Steps:**

```typescript
// Step 1: Check if token exists
console.log('Token:', localStorage.getItem('authToken'));
console.log('UserId:', localStorage.getItem('userId'));

// Step 2: Check service is sending headers
// Add to collaboration.service.ts:
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('authToken');
  console.log('Getting auth header with token:', token);
  let headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  console.log('Final headers:', headers);
  return headers;
}

// Step 3: Monitor network requests
// Open DevTools → Network tab → filter by API calls
// Check Request Headers for Authorization field

// Step 4: Check token format
const token = localStorage.getItem('authToken');
if (token.startsWith('Bearer ')) {
  console.warn('Token already has Bearer prefix!');
  // Remove prefix if needed
}
```

**Solutions:**
1. Ensure user is logged in before accessing module
2. Verify localStorage keys match: `authToken` and `userId`
3. Check token expiration: `jwt_decode(token)`
4. Clear localStorage and re-login: `localStorage.clear()`

---

### 2. Component Not Loading

#### Issue: Blank page or "Component not found"

**Symptoms:**
- White screen when navigating to route
- Error: "Cannot match any routes"
- No console errors

**Debugging:**

```typescript
// Check route configuration
// In professional-collaboration.routes.ts
export const PROFESSIONAL_COLLABORATION_ROUTES: Routes = [
  {
    path: '',
    component: CollaborationListComponent
  },
  // ... other routes
];

// Verify main app includes the routes
// In app-routing-module.ts
{
  path: 'professional-collaboration',
  loadChildren: () => Promise.resolve(PROFESSIONAL_COLLABORATION_ROUTES)
}

// Test direct navigation
router.navigate(['/professional-collaboration']);

// In template, check route works:
<a routerLink="/professional-collaboration">Test Link</a>
```

**Solutions:**
1. Check route path spelling matches exactly
2. Verify component is imported in routes file
3. Check main app routes include lazy-loaded module
4. Clear browser cache: Ctrl+Shift+Delete

---

### 3. API Endpoint Not Found (404 Errors)

#### Issue: "404 Not Found" on all API calls

**Symptoms:**
- Network status: 404
- Error: "Cannot POST /api/collaboration/sessions"
- Backend endpoint doesn't exist

**Debugging:**

```typescript
// Check endpoint URLs in services
const sessionUrl = `${environment.apiUrl}api/collaboration/sessions`;
console.log('Session URL:', sessionUrl);
// Should output: http://localhost:8089/MediCareAI/api/collaboration/sessions

// Verify environment.apiUrl
console.log('API Base URL:', environment.apiUrl);
// Should output: http://localhost:8089/MediCareAI/

// Check for double slashes
const debugUrl = `${environment.apiUrl}api/collaboration/sessions`;
if (debugUrl.includes('///')) {
  console.warn('Double slash detected!');
}

// Test API endpoint directly in browser
// In DevTools console:
fetch('http://localhost:8089/MediCareAI/api/collaboration/sessions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
.then(r => r.json())
.then(data => console.log('API works:', data))
.catch(e => console.error('API error:', e));
```

**Solutions:**
1. Verify backend is running on correct port (8089)
2. Check endpoint format in service matches backend
3. Ensure environment.apiUrl has trailing slash
4. For development, check CORS configuration on backend

---

### 4. Services Not Injecting

#### Issue: "NullInjectorError: No provider for CollaborationService"

**Symptoms:**
- Error in constructor injection
- Component fails to instantiate
- Service is undefined

**Debugging:**

```typescript
// Standalone components don't need module declarations
// Just ensure service has providedIn: 'root'

@Injectable({
  providedIn: 'root' // ✅ This is required
})
export class CollaborationService {
  // Service code
}

// In component:
@Component({
  selector: 'app-collaboration-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  // Don't need providers array for services with providedIn: 'root'
})
export class CollaborationListComponent {
  constructor(private collaborationService: CollaborationService) {
    console.log('Service injected:', collaborationService);
  }
}
```

**Solutions:**
1. Check service has `providedIn: 'root'`
2. Verify service file is created in services folder
3. Check import path is correct in component
4. Rebuild project: `ng serve --poll`

---

### 5. Styling Not Applied

#### Issue: CSS not loaded or styling looks wrong

**Symptoms:**
- Layout broken or misaligned
- Colors don't match design
- Responsive design not working
- CSS file not found error (404)

**Debugging:**

```typescript
// In component, verify styleUrls
@Component({
  selector: 'app-collaboration-list',
  templateUrl: './collaboration-list.component.html',
  styleUrls: ['./collaboration-list.component.css'] // ✅ Check this
})

// Check file exists
// Should be: src/app/modules/professional-collaboration/components/collaboration-list/collaboration-list.component.css

// In DevTools:
// 1. Right-click element
// 2. Select "Inspect"
// 3. Look at Styles tab
// 4. Check if CSS rules are applied
// 5. Look for "×" icon next to property if overridden

// Force CSS reload
// In browser DevTools Console:
document.querySelectorAll('link[href*="collaboration"]').forEach(link => {
  link.href = link.href + '?v=' + Date.now();
});
```

**Solutions:**
1. Clear browser cache: Ctrl+Shift+Delete
2. Hard refresh: Ctrl+Shift+R
3. Check CSS file path is correct
4. Verify CSS file isn't in `.gitignore`
5. Rebuild with `ng serve`

---

### 6. Form Validation Issues

#### Issue: Form fields not validating correctly

**Symptoms:**
- Submit button always disabled
- Validation errors not showing
- Form invalid even with valid data

**Debugging:**

```typescript
// In component
export class SessionEditorComponent {
  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  initializeForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      // ... other fields
    });
  }

  // Debug form state
  debugForm() {
    console.log('Form value:', this.form.value);
    console.log('Form valid:', this.form.valid);
    console.log('Form status:', this.form.status);
    
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      console.log(`${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched,
        dirty: control?.dirty
      });
    });
  }

  // In template, add for debugging
  // <pre>{{ form.value | json }}</pre>
  // <p>Form valid: {{ form.valid }}</p>
}
```

**Solutions:**
1. Check all validators are correctly specified
2. Call `form.markAllAsTouched()` to show errors
3. Verify form control names match in template
4. Log form value and validity during development

---

### 7. Data Not Loading

#### Issue: Components show empty/loading forever

**Symptoms:**
- Spinner keeps spinning
- No data displays
- No errors in console

**Debugging:**

```typescript
// Add detailed logging to service
private http: HttpClient;

getAllSessions(filter?: CollaborationFilter): Observable<SessionExtended[]> {
  console.log('🔵 getAllSessions called with filter:', filter);
  
  let params = new HttpParams();
  if (filter?.searchTerm) {
    params = params.set('search', filter.searchTerm);
  }
  
  console.log('🔵 Request URL:', `${this.sessionUrl}`);
  console.log('🔵 Query params:', params.toString());
  
  return this.http.get<SessionExtended[]>(this.sessionUrl, { params }).pipe(
    tap(sessions => {
      console.log('✅ Sessions loaded:', sessions);
    }),
    catchError(error => {
      console.error('❌ Error loading sessions:', error);
      return of([]);
    })
  );
}

// In component
loadSessions() {
  console.log('Component: Starting loadSessions');
  
  this.collaborationService.getAllSessions().subscribe({
    next: (data) => {
      console.log('Component: Received data:', data);
      this.sessions = data;
    },
    error: (error) => {
      console.error('Component: Error:', error);
      this.errorMessage = error.message;
    }
  });
}

// Check in DevTools Network tab
// 1. Find GET request to /api/collaboration/sessions
// 2. Check Response tab for actual data
// 3. Check Status code (should be 200)
// 4. Check if response is valid JSON
```

**Solutions:**
1. Check API endpoint returns valid JSON
2. Verify HTTP status is 200 (not 201, 204, etc.)
3. Add error handling with catchError
4. Check network tab for actual response
5. Verify data structure matches interface

---

### 8. Navigation Not Working

#### Issue: Routing doesn't work, page doesn't navigate

**Symptoms:**
- router.navigate() doesn't change URL
- Links don't work
- Params not passed to component

**Debugging:**

```typescript
// Inject Router and check navigation
constructor(
  private router: Router,
  private activatedRoute: ActivatedRoute
) {}

testNavigation() {
  console.log('Current route:', this.activatedRoute);
  
  // Test navigate
  this.router.navigate(['/professional-collaboration']).then(success => {
    if (success) {
      console.log('Navigation successful');
    } else {
      console.error('Navigation failed');
    }
  });
}

// In component, check route params
ngOnInit() {
  this.activatedRoute.params.subscribe(params => {
    console.log('Route params:', params);
    if (params['id']) {
      console.log('Got ID:', params['id']);
    }
  });
}

// In template, verify routerLink
<a [routerLink]="['/professional-collaboration', sessionId]">
  View Session
</a>
```

**Solutions:**
1. Verify route path is spelled correctly
2. Check routes array includes the path
3. Ensure RouterModule is imported
4. Check lazy loading syntax is correct
5. Use absolute paths: `/professional-collaboration`

---

### 9. File Upload Issues

#### Issue: File upload fails or doesn't work

**Symptoms:**
- Upload button appears but nothing happens
- 400/413 errors on upload
- File size errors

**Debugging:**

```typescript
// In component
onFileSelected(event: any) {
  const file = event.target.files[0];
  console.log('File selected:', {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeInMB: (file.size / 1024 / 1024).toFixed(2)
  });
}

uploadDocument() {
  const file = this.uploadForm.get('file')?.value;
  console.log('Uploading file:', file);
  
  if (!file) {
    console.error('No file selected');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', 'test');
  
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }

  this.collaborationService.uploadDocument(this.sessionId, file).subscribe({
    next: (doc) => console.log('Upload success:', doc),
    error: (error) => console.error('Upload failed:', error)
  });
}

// In service
uploadDocument(sessionId: number, file: File, description?: string) {
  console.log('Service: Uploading to session', sessionId);
  
  const formData = new FormData();
  formData.append('file', file);
  if (description) formData.append('description', description);
  
  // Note: Don't set Content-Type header for FormData
  // Browser sets it with boundary automatically
  
  return this.http.post<SharedDocument>(
    `${this.documentUrl}/sessions/${sessionId}`,
    formData
    // Don't pass headers object for FormData!
  );
}
```

**Solutions:**
1. Don't set Content-Type for FormData (let browser set it)
2. Check backend accepts multipart/form-data
3. Verify file size doesn't exceed backend limit
4. Check CORS allows file upload
5. Ensure FormData is used, not JSON

---

### 10. Permission Issues

#### Issue: "Access Denied" or "You don't have permission"

**Symptoms:**
- 403 Forbidden errors
- Some buttons hidden when they shouldn't be
- Edit/delete not working

**Debugging:**

```typescript
// Check user's role in session
export class CollaborationDetailComponent {
  session: SessionExtended | null = null;
  
  ngOnInit() {
    this.loadSession(id);
  }
  
  canEdit(): boolean {
    console.log('User role:', this.session?.membershipRole);
    console.log('Is organizer:', this.session?.isOrganicer);
    const result = this.session?.isOrganicer || this.session?.membershipRole === 'EDITOR';
    console.log('Can edit:', result);
    return result;
  }

  editSession() {
    if (!this.canEdit()) {
      console.error('Permission denied');
      alert('You do not have permission to edit this session');
      return;
    }
    // Proceed with edit
  }
}

// In template, debug visibility
<button *ngIf="canEdit()" (click)="editSession()">
  Edit - Debug: can edit = {{ canEdit() }}
</button>
```

**Solutions:**
1. Verify API returns correct `membershipRole`
2. Check backend enforces permissions
3. Verify `isOrganicer` flag is set correctly (note spelling)
4. Test with different user roles

---

## Debugging Tools

### 1. Console Logging Strategy

```typescript
// Use consistent prefix
const LOG = {
  service: (msg: any, data?: any) => console.log('🔵 Service:', msg, data),
  component: (msg: any, data?: any) => console.log('🟡 Component:', msg, data),
  success: (msg: any, data?: any) => console.log('✅ Success:', msg, data),
  error: (msg: any, data?: any) => console.error('❌ Error:', msg, data),
  warning: (msg: any, data?: any) => console.warn('⚠️ Warning:', msg, data)
};

// Usage
LOG.service('Loading sessions', { filter });
LOG.success('Sessions loaded', sessions);
LOG.error('Failed to load', error);
```

### 2. Browser DevTools

- **Network Tab**: Monitor API requests
- **Application Tab**: Check localStorage
- **Console Tab**: View logs and errors
- **Elements Tab**: Inspect DOM and styles

### 3. Angular DevTools Extension

Install: [Angular DevTools Chrome Extension](https://chrome.google.com/webstore/detail/angular-devtools/)

Features:
- Inspect component tree
- View component input/output
- Profile change detection
- Track route changes

### 4. Testing Endpoints

```bash
# Test API endpoint directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8089/MediCareAI/api/collaboration/sessions

# With verbose output
curl -v -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8089/MediCareAI/api/collaboration/sessions
```

---

## Performance Debugging

### Slow Loading

```typescript
// Measure load time
console.time('load-sessions');
this.collaborationService.getAllSessions().subscribe({
  next: () => {
    console.timeEnd('load-sessions');
  }
});

// Monitor network waterfall
// Open DevTools → Network tab
// Sort by time
// Look for bottlenecks
```

### Memory Leaks

```typescript
// Ensure you unsubscribe
private destroy$ = new Subject<void>();

ngOnInit() {
  this.collaborationService.sessions$
    .pipe(takeUntil(this.destroy$))
    .subscribe();
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## Useful Console Commands

```typescript
// Check auth state
localStorage.getItem('authToken');
localStorage.getItem('userId');

// Clear all data
localStorage.clear();

// Reload page
location.reload();

// Check environment
console.log(environment);

// Decode JWT (if using jwt_decode)
import jwt_decode from 'jwt-decode';
const token = localStorage.getItem('authToken');
console.log(jwt_decode(token));
```

---

For additional help, check:
- README.md - Feature documentation
- INTEGRATION_GUIDE.md - Setup instructions
- USAGE_EXAMPLES.md - Code examples
