import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatbotService, SpecialtyDiagnosis, DiseaseDiagnosis } from '../../shared/services/chatbot.service';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  specialties?: SpecialtyDiagnosis[];
  diseases?: DiseaseDiagnosis[];
}

@Component({
  selector: 'app-symptom-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './symptom-ai.component.html',
  styleUrl: './symptom-ai.component.css'
})
export class SymptomAiComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  messages: Message[] = [];
  userInput = '';
  isTyping = false;
  isDoctor = false;
  isPatient = false;

  constructor(
    private authService: AuthService,
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    const role = (user?.role || '').toString().toUpperCase().replace('ROLE_', '').trim();
    this.isDoctor = role === 'DOCTOR';
    this.isPatient = role === 'PATIENT';

    if (this.isDoctor) {
      this.addBotMessage('👨‍⚕️ Hello Doctor! Describe the patient\'s symptoms and I will identify the corresponding diseases.');
    } else {
      this.addBotMessage('🤖 Hello! Describe your symptoms and I will guide you to the appropriate medical specialty.');
    }
  }

  ngAfterViewChecked(): void {
    if (this.chatContainer) {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  sendMessage(): void {
    const input = this.userInput.trim();
    if (!input || this.isTyping) return;

    this.addUserMessage(input);
    this.userInput = '';

    const symptomNames = this.extractSymptomNames(input);

    if (symptomNames.length === 0) {
      this.addBotMessage(
        'Please describe your symptoms separated by commas.\nExample: "Fever, Headache, Fatigue"'
      );
      return;
    }

    this.isTyping = true;
    this.cdr.detectChanges();

    if (this.isDoctor) {
      this.callDoctorDiagnose(symptomNames);
    } else {
      this.callPatientDiagnose(symptomNames);
    }
  }

  private callPatientDiagnose(symptomNames: string[]): void {
    this.chatbotService.diagnosePatient(symptomNames).subscribe({
      next: (specialties) => {
        this.isTyping = false;

        if (!specialties || specialties.length === 0) {
          this.addBotMessage(
            `No specialty found for the symptoms: ${symptomNames.join(', ')}.\n\nPlease consult a general practitioner.`
          );
        } else {
          this.messages.push({
            type: 'bot',
            content: `Based on your symptoms (${symptomNames.join(', ')}), here are the recommended specialties:`,
            timestamp: new Date(),
            specialties
          });
          this.addBotMessage('⚠️ This analysis does not replace professional medical advice.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Chatbot] Patient error:', err);
        this.isTyping = false;
        this.addBotMessage('An error occurred during analysis. Please check your connection and try again.');
        this.cdr.detectChanges();
      }
    });
  }

  private callDoctorDiagnose(symptomNames: string[]): void {
    this.chatbotService.diagnoseDoctor(symptomNames).subscribe({
      next: (diseases) => {
        this.isTyping = false;

        if (!diseases || diseases.length === 0) {
          this.addBotMessage(
            `No disease found for the symptoms: ${symptomNames.join(', ')}.`
          );
        } else {
          this.messages.push({
            type: 'bot',
            content: `Symptoms: ${symptomNames.join(', ')}. Matching diseases:`,
            timestamp: new Date(),
            diseases
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Chatbot] Doctor error:', err);
        this.isTyping = false;
        this.addBotMessage('An error occurred during analysis. Please check your connection and try again.');
        this.cdr.detectChanges();
      }
    });
  }

  private extractSymptomNames(input: string): string[] {
    return input
      .split(/[,;\/\n]|\bet\b|\band\b/i)
      .map(s => s.trim())
      .filter(s => s.length >= 2)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  }

  addUserMessage(content: string): void {
    this.messages.push({ type: 'user', content, timestamp: new Date() });
  }

  addBotMessage(content: string): void {
    this.messages.push({ type: 'bot', content, timestamp: new Date() });
  }

  clearChat(): void {
    this.messages = [];
    this.isTyping = false;
    this.addBotMessage(this.isDoctor
      ? 'Chat cleared. Describe the patient\'s symptoms.'
      : 'Chat cleared. How can I help you?'
    );
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
