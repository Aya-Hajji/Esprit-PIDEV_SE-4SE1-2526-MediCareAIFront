import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  MedicalChatService,
  ChatMessage,
  MedicalContext,
  ImportedPatientDocument
} from '../../../../shared/services/medical-chat.service';
import { PatientPdfTextExtractService } from '../../../../shared/services/patient-pdf-text-extract.service';
import {
  AllergyDTO,
  LabResultDTO,
  MedicalRecordDTO,
  PrescriptionDTO,
  VisitNoteDTO
} from '../../../../shared/models/medical.model';
import { DoctorRecommendation } from '../../../../shared/services/doctor-recommendation.service';
import { User } from '../../../../shared/models/user.model';
import { downloadRecordAssistantConversationPdf } from '../../../../shared/utils/record-assistant-pdf-export';

@Component({
  selector: 'app-medical-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-chatbot.component.html',
  styleUrls: ['./medical-chatbot.component.css']
})
export class MedicalChatbotComponent implements OnInit, OnChanges, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('pdfFileInput') private pdfFileInput?: ElementRef<HTMLInputElement>;
  @Input() medicalRecord: MedicalRecordDTO | null = null;
  @Input() labResults: LabResultDTO[] = [];
  @Input() doctorRecommendations: DoctorRecommendation[] = [];
  /** Direct directory list (e.g. specialty filter) — preferred over legacy {@link doctorRecommendations}. */
  @Input() careTeamDoctors: User[] = [];
  @Input() allergies: AllergyDTO[] = [];
  @Input() prescriptions: PrescriptionDTO[] = [];
  @Input() visitNotes: VisitNoteDTO[] = [];

  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;
  isChatOpen = false;
  unreadCount = 0;

  /** Shortcuts — all prompts refer only to the imported PDF (service blocks chat without a PDF). */
  pdfQuickActions = [
    { label: 'Summarize PDF', prompt: 'Summarize the imported PDF in plain language, using only what is written in that file.' },
    { label: 'Key facts', prompt: 'List the main facts stated in the imported PDF only.' },
    { label: 'Explain terms', prompt: 'Explain medical terms that appear in the imported PDF that a layperson might not know.' },
    { label: 'SOAP layout', prompt: 'Reorganize the content of the imported PDF into a SOAP-style structure, without adding information not present in the file.' },
    { label: 'Questions for clinician', prompt: 'Based only on the imported PDF, what questions could I ask my clinician at the next visit?' }
  ];

  pdfImportLoading = false;
  pdfImportError: string | null = null;
  importedPdfSummary: { fileName: string; pageCount: number; charCount: number; truncated: boolean } | null = null;

  /** After the user picks a PDF shortcut once, hide shortcuts and show only the thread (until PDF/chat reset). */
  pdfShortcutsDismissed = false;

  /** User must send at least one message before PDF export is offered (avoids empty / misleading exports). */
  get hasConversationToExport(): boolean {
    return this.messages.some((m) => m.sender === 'user');
  }

  private shouldScroll = false;
  private lastRecordKey: string | null = null;

  constructor(
    private chatService: MedicalChatService,
    private sanitizer: DomSanitizer,
    private pdfExtract: PatientPdfTextExtractService
  ) {}

  ngOnInit(): void {
    this.subscribeToMessages();
    this.syncPdfSummaryFromService();
    this.pushContext();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const keys = [
      'medicalRecord',
      'labResults',
      'allergies',
      'prescriptions',
      'visitNotes',
      'doctorRecommendations',
      'careTeamDoctors'
    ];
    if (!keys.some((k) => !!changes[k])) {
      return;
    }

    const key = this.recordKey();
    if (key && key !== this.lastRecordKey) {
      this.lastRecordKey = key;
      this.pdfShortcutsDismissed = false;
      this.chatService.restartForDossier(this.buildContext());
      return;
    }

    this.pushContext();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private recordKey(): string | null {
    const r = this.medicalRecord;
    if (!r?.id && !r?.patientId) {
      return null;
    }
    return `${r.patientId ?? '?'}-${r.id ?? '?'}`;
  }

  private subscribeToMessages(): void {
    this.chatService.messageHistory$.subscribe((messages: ChatMessage[]) => {
      this.messages = messages;
      this.shouldScroll = true;

      if (!this.isChatOpen && messages.length > 1) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.sender === 'bot') {
          this.unreadCount++;
        }
      }
    });
  }

  private buildContext(): MedicalContext {
    const fromDirectory = (this.careTeamDoctors || []).filter(Boolean);
    const fromLegacy = (this.doctorRecommendations || []).map((row) => row.doctor).filter(Boolean);
    const doctors = fromDirectory.length > 0 ? fromDirectory : fromLegacy;
    return {
      medicalRecord: this.medicalRecord || undefined,
      labResults: this.labResults?.length ? [...this.labResults] : undefined,
      doctorRecommendations: doctors.length ? doctors : undefined,
      allergies: this.allergies?.length ? [...this.allergies] : undefined,
      prescriptions: this.prescriptions?.length ? [...this.prescriptions] : undefined,
      visitNotes: this.visitNotes?.length ? [...this.visitNotes] : undefined
    };
  }

  private pushContext(): void {
    this.chatService.setMedicalContext(this.buildContext());
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.unreadCount = 0;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendMessage(): void {
    if (!this.userInput.trim()) {
      return;
    }

    const message = this.userInput.trim();
    this.userInput = '';
    this.isLoading = true;
    this.pushContext();

    this.chatService.processUserMessage(message).subscribe({
      next: () => {
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: (error: unknown) => {
        console.error('Error sending message:', error);
        this.isLoading = false;
      }
    });
  }

  applyQuick(prompt: string): void {
    this.pdfShortcutsDismissed = true;
    this.userInput = prompt;
    setTimeout(() => this.sendMessage(), 0);
  }

  resetChat(): void {
    this.pdfShortcutsDismissed = false;
    this.chatService.resetConversation();
    this.syncPdfSummaryFromService();
    this.pushContext();
  }

  openPdfPicker(): void {
    this.pdfImportError = null;
    this.pdfFileInput?.nativeElement?.click();
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.pdfImportLoading = true;
    this.pdfImportError = null;

    this.pdfExtract.extractText(file).subscribe({
      next: ({ text, truncated, pageCount }) => {
        this.pdfImportLoading = false;
        if (!text.trim()) {
          this.pdfImportError =
            'No readable text in this PDF (common for image-only scans). Try a text-based export from your EHR.';
          return;
        }

        const doc: ImportedPatientDocument = {
          fileName: file.name,
          text,
          truncated,
          pageCount,
          importedAt: new Date().toISOString()
        };
        this.chatService.attachPatientPdf(doc);
        this.importedPdfSummary = {
          fileName: doc.fileName,
          pageCount: doc.pageCount,
          charCount: doc.text.length,
          truncated: doc.truncated
        };
        this.pdfShortcutsDismissed = false;
        this.pushContext();
        this.appendBotNotice(
          `**PDF imported** — “${doc.fileName}” (${pageCount} pp., ${doc.text.length} characters). ` +
            `Use the *Explain PDF* or *Structure (SOAP)* shortcuts, or ask your question mentioning the PDF.`
        );
      },
      error: (err: unknown) => {
        this.pdfImportLoading = false;
        this.pdfImportError = err instanceof Error ? err.message : 'Unable to read this PDF.';
      }
    });
  }

  clearImportedPdf(): void {
    this.chatService.clearPatientPdf();
    this.importedPdfSummary = null;
    this.pdfShortcutsDismissed = false;
    this.pdfImportError = null;
    this.pushContext();
    this.appendBotNotice('**PDF removed** — replies will rely only on the on-screen record.');
  }

  private syncPdfSummaryFromService(): void {
    const d = this.chatService.getPatientPdf();
    this.importedPdfSummary = d
      ? { fileName: d.fileName, pageCount: d.pageCount, charCount: d.text.length, truncated: d.truncated }
      : null;
  }

  private appendBotNotice(text: string): void {
    this.chatService.appendAssistantMessage(text);
  }

  exportChat(): void {
    if (!this.hasConversationToExport) {
      return;
    }
    downloadRecordAssistantConversationPdf(this.messages, {
      patientId: this.medicalRecord?.patientId ?? null,
      recordId: this.medicalRecord?.id ?? null,
      importedPdfFileName: this.importedPdfSummary?.fileName ?? null
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err: unknown) {
      console.error('Scroll error:', err);
    }
  }

  getMessageClass(message: ChatMessage): string {
    return `message ${message.sender === 'bot' ? 'bot-message' : 'user-message'} ${message.type || 'text'}`;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatMessage(text: string): SafeHtml {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const formatted = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
