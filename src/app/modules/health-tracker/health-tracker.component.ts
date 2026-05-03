import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-health-tracker',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './health-tracker.component.html',
  styleUrl: './health-tracker.component.css'
})
export class HealthTrackerComponent {}
