import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PregnancyWeekViewerComponent } from './components/pregnancy-week-viewer/pregnancy-week-viewer.component';

@Component({
  selector: 'app-pregnancy',
  imports: [CommonModule, RouterLink, PregnancyWeekViewerComponent],
  templateUrl: './pregnancy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PregnancyComponent {}

