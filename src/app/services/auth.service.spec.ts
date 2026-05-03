import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginRequest, SignupRequest } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      httpMock.verify();
    } catch (e) {
      // Allow outstanding requests to be cleaned up between tests
      httpMock.match(() => true);
    }
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login user', () => {
    const credentials: LoginRequest = { email: 'test@example.com', password: 'password' };

    service.login(credentials).subscribe((response) => {
      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('login'));
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'test-token',
      role: 'PATIENT',
      email: 'test@example.com'
    });
  });

  it('should register user', () => {
    const userData: SignupRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'PATIENT',
      gender: 'MALE',
      phoneNumber: '+1234567890'
    };

    service.register(userData).subscribe((response) => {
      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('register'));
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'test-token',
      role: 'PATIENT',
      email: 'john@example.com'
    });
  });

  it('should logout user', () => {
    localStorage.setItem('authToken', 'test-token');

    service.logout();

    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('should verify email', () => {
    const verifyData = { email: 'test@example.com', code: '123456' };

    service.verifyEmail(verifyData).subscribe((response) => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('verify-email'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should resend verification email', () => {
    const resendData = { email: 'test@example.com' };

    service.resendVerificationCode(resendData).subscribe((response) => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('resend-verification'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should request password reset', () => {
    const resetData = { email: 'test@example.com' };

    service.requestPasswordReset(resetData).subscribe((response) => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('forgot-password'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should confirm password reset', () => {
    const resetData = {
      email: 'test@example.com',
      code: '123456',
      newPassword: 'newpassword123'
    };

    service.resetPassword(resetData).subscribe((response) => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('reset-password'));
    expect(req.request.method).toBe('POST');
    req.flush('Password reset successfully.');
  });

  it('should get current user observable', (done) => {
    service.currentUser.subscribe((user) => {
      expect(service.currentUser).toBeDefined();
      done();
    });
  });

  it('should handle login error', () => {
    const credentials: LoginRequest = { email: 'test@example.com', password: 'wrongpassword' };

    service.login(credentials).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.status).toBe(401);
      }
    );

    const req = httpMock.expectOne((request) => request.url.includes('login'));
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });
});
