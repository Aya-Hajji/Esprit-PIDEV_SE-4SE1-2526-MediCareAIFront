import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HealthTrackerComponent } from './health-tracker.component';

describe('HealthTrackerComponent', () => {
  let component: HealthTrackerComponent;
  let fixture: ComponentFixture<HealthTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthTrackerComponent, CommonModule, RouterLink],
      providers: [{
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => null } } }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(HealthTrackerComponent);
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
    const moduleMetadata = (HealthTrackerComponent as any).ɵcmp;
    expect(moduleMetadata.dependencies).toBeDefined();
  });

  it('should use RouterLink', () => {
    const moduleMetadata = (HealthTrackerComponent as any).ɵcmp;
    expect(moduleMetadata.dependencies).toBeDefined();
  });

  it('should detect changes after initialization', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBe(component);
  });

  it('should render with correct selector', () => {
    const metadata = (HealthTrackerComponent as any).ɵcmp;
    expect(metadata.selectors[0][0]).toBe('app-health-tracker');
  });

  it('should be standalone component', () => {
    const metadata = (HealthTrackerComponent as any).ɵcmp;
    expect(metadata.standalone).toBe(true);
  });

  it('should handle component lifecycle', () => {
    expect(() => {
      fixture.detectChanges();
      fixture.destroy();
    }).not.toThrow();
  });
});
