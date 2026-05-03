import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-symptom-ai',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './symptom-ai.component.html',
  styleUrl: './symptom-ai.component.css'
})
export class SymptomAiComponent {}
