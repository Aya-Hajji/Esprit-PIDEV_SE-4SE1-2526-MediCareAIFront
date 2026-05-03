import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMedicalData } from './admin-medical-data.component';

describe('AdminMedicalData', () => {
  let component: AdminMedicalData;
  let fixture: ComponentFixture<AdminMedicalData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMedicalData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMedicalData);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
