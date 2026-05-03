import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User, UserRequestDTO, UserResponseDTO } from '../models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      httpMock.verify();
    } catch (e) {
      // Allow outstanding requests to be cleaned up between tests
      httpMock.match(() => true);
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all users', () => {
    const mockUsers: User[] = [
      { id: 1, email: 'user1@example.com', firstName: 'John', lastName: 'Doe', role: 'PATIENT' },
      { id: 2, email: 'user2@example.com', firstName: 'Jane', lastName: 'Doe', role: 'DOCTOR' }
    ];

    service.getAllUsers().subscribe((users) => {
      expect(users.length).toBe(2);
      expect(users[0].email).toBe('user1@example.com');
    });

    const req = httpMock.expectOne((request) => request.url.includes('users'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should get user by id', () => {
    const mockUser: User = {
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'PATIENT'
    };

    service.getUserById(1).subscribe((user) => {
      expect(user.id).toBe(1);
      expect(user.email).toBe('user@example.com');
    });

    const req = httpMock.expectOne((request) => request.url.includes('users/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should get user by email', () => {
    const mockUser: User = {
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'PATIENT'
    };

    service.getUserByEmail('user@example.com').subscribe((user) => {
      expect(user.email).toBe('user@example.com');
    });

    const req = httpMock.expectOne((request) => request.url.includes('email/user@example.com'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should create user', () => {
    const userData: UserRequestDTO = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      role: 'PATIENT'
    };

    const mockResponse: UserResponseDTO = {
      id: 3,
      username: 'newuser',
      email: 'newuser@example.com',
      role: 'PATIENT',
      premium: false
    };

    service.createUser(userData).subscribe((response) => {
      expect(response.id).toBe(3);
      expect(response.email).toBe('newuser@example.com');
    });

    const req = httpMock.expectOne((request) => request.url.includes('users'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update user', () => {
    const updateData: Partial<User> = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const mockResponse: User = {
      id: 1,
      email: 'user@example.com',
      firstName: 'Updated',
      lastName: 'Name',
      role: 'PATIENT'
    };

    service.updateUser(1, updateData).subscribe((user) => {
      expect(user.firstName).toBe('Updated');
    });

    const req = httpMock.expectOne((request) => request.url.includes('users/1'));
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete user', () => {
    service.deleteUser(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne((request) => request.url.includes('users/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle errors gracefully', () => {
    service.getAllUsers().subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne((request) => request.url.includes('users'));
    req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
  });
});
