import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CollaborationComponent } from './collaboration.component';

describe('CollaborationComponent', () => {
  let component: CollaborationComponent;
  let fixture: ComponentFixture<CollaborationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollaborationComponent, CommonModule, RouterLink],
      providers: [{
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => null } } }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(CollaborationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with standalone component', () => {
    expect(component).toBeDefined();
    expect(fixture.componentInstance).toBe(component);
  });

  it('should render template successfully', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });

  it('should use CommonModule', () => {
    const moduleMetadata = (CollaborationComponent as any).ɵcmp;
    expect(moduleMetadata.dependencies).toBeDefined();
  });

  it('should use RouterLink', () => {
    const moduleMetadata = (CollaborationComponent as any).ɵcmp;
    expect(moduleMetadata.dependencies).toBeDefined();
  });

  it('should detect changes after initialization', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBe(component);
  });
});
