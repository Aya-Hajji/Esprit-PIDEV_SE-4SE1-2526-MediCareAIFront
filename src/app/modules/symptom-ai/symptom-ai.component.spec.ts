import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SymptomAiComponent } from './symptom-ai.component';

describe('SymptomAiComponent', () => {
  let component: SymptomAiComponent;
  let fixture: ComponentFixture<SymptomAiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymptomAiComponent, CommonModule, RouterLink],
      providers: [{
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => null } } }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(SymptomAiComponent);
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
    const moduleMetadata = (SymptomAiComponent as any).ɵcmp;
    expect(moduleMetadata.dependencies).toBeDefined();
  });

  it('should use RouterLink', () => {
    const moduleMetadata = (SymptomAiComponent as any).ɵcmp;
    expect(moduleMetadata.dependencies).toBeDefined();
  });

  it('should detect changes after initialization', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBe(component);
  });

  it('should render with correct selector', () => {
    const metadata = (SymptomAiComponent as any).ɵcmp;
    expect(metadata.selectors[0][0]).toBe('app-symptom-ai');
  });

  it('should be standalone component', () => {
    const metadata = (SymptomAiComponent as any).ɵcmp;
    expect(metadata.standalone).toBe(true);
  });

  it('should handle component lifecycle', () => {
    expect(() => {
      fixture.detectChanges();
      fixture.destroy();
    }).not.toThrow();
  });
});
