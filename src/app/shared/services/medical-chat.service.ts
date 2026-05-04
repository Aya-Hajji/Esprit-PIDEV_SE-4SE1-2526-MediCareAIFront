import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AllergyDTO, MedicalRecordDTO, LabResultDTO, PrescriptionDTO, VisitNoteDTO } from '../models/medical.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number };
}

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
  type?: 'text' | 'analysis' | 'recommendation' | 'warning';
}

/** Text extracted from a patient PDF (letter, record export, etc.) — enriches assistant replies. */
export interface ImportedPatientDocument {
  fileName: string;
  text: string;
  truncated: boolean;
  pageCount: number;
  importedAt: string;
}

export interface MedicalContext {
  medicalRecord?: MedicalRecordDTO;
  labResults?: LabResultDTO[];
  doctorRecommendations?: User[];
  symptoms?: string[];
  allergies?: AllergyDTO[];
  prescriptions?: PrescriptionDTO[];
  visitNotes?: VisitNoteDTO[];
  importedPatientDocument?: ImportedPatientDocument;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalChatService {
  private readonly localMedicalRecordsKey = 'localMedicalRecordsFallback';
  private readonly localLabResultsKey = 'localLabResultsFallback';
  private readonly localUsersKey = 'cachedUsers';

  private messageHistory = new BehaviorSubject<ChatMessage[]>([]);
  messageHistory$ = this.messageHistory.asObservable();

  private conversationContext: MedicalContext = {};
  /** Imported PDF — kept when switching records until cleared. */
  private patientPdfImport: ImportedPatientDocument | null = null;
  private chatSessionId = this.generateSessionId();

  constructor(private readonly http: HttpClient) {
    this.ensureLocalAssistantData();
    this.hydrateContextFromLocalStorage();
    this.initializeWelcomeMessage();
  }

  private buildWelcomeMessage(): ChatMessage {
    return {
      sender: 'bot',
      text:
        '**Record assistant (PDF-based)**\n\n' +
        '**Import a PDF** (letter, report, export). All answers are generated **only** from the text of that file—nothing else.\n' +
        'Add your **Gemini API key** in `environment.ts` to enable the model. If the key is missing, the assistant will not answer.\n\n' +
        '*Educational / documentation help only — not a clinical decision.*',
      timestamp: new Date(),
      type: 'text'
    };
  }

  private initializeWelcomeMessage(): void {
    this.messageHistory.next([this.buildWelcomeMessage()]);
  }

  /**
   * Nouvelle session de chat quand l’utilisateur ouvre un autre dossier : garde le contexte aligné sur l’écran.
   */
  restartForDossier(context: MedicalContext): void {
    const pdfSnapshot = this.patientPdfImport;
    this.chatSessionId = this.generateSessionId();
    this.conversationContext = {};
    this.setMedicalContext(context);
    if (pdfSnapshot) {
      this.attachPatientPdf(pdfSnapshot);
    }
    const welcome = this.buildWelcomeMessage();
    const r = context.medicalRecord;
    let dossierText = r
      ? `**Record open** — patient #${r.patientId}${r.id ? `, record #${r.id}` : ''}. Chat answers still use **only** your imported PDF text.`
      : '**No record selected** — you can still chat if a PDF is imported.';
    if (pdfSnapshot) {
      dossierText += `\n\n**PDF in use** — “${pdfSnapshot.fileName}” (${pdfSnapshot.pageCount} pp.).`;
    } else {
      dossierText += '\n\n**Import a PDF** to ask questions about its content.';
    }
    const dossierLine: ChatMessage = {
      sender: 'bot',
      text: dossierText,
      timestamp: new Date(),
      type: 'text'
    };
    this.messageHistory.next([welcome, dossierLine]);
  }

  /** Attach or replace text extracted from a patient PDF to enrich replies. */
  attachPatientPdf(doc: ImportedPatientDocument): void {
    this.patientPdfImport = doc;
    this.conversationContext = { ...this.conversationContext, importedPatientDocument: doc };
  }

  clearPatientPdf(): void {
    this.patientPdfImport = null;
    const { importedPatientDocument: _removed, ...rest } = this.conversationContext;
    this.conversationContext = { ...rest };
  }

  getPatientPdf(): ImportedPatientDocument | null {
    return this.patientPdfImport;
  }

  /** Assistant message outside the normal user-question flow (e.g. PDF import confirmation). */
  appendAssistantMessage(text: string, type: ChatMessage['type'] = 'text'): void {
    const notice: ChatMessage = { sender: 'bot', text, timestamp: new Date(), type };
    this.messageHistory.next([...this.messageHistory.value, notice]);
  }

  setMedicalContext(context: MedicalContext): void {
    this.hydrateContextFromLocalStorage();
    this.conversationContext = {
      medicalRecord: context.medicalRecord ?? this.conversationContext.medicalRecord,
      labResults:
        context.labResults && context.labResults.length > 0 ? context.labResults : this.conversationContext.labResults,
      doctorRecommendations:
        context.doctorRecommendations && context.doctorRecommendations.length > 0
          ? context.doctorRecommendations
          : this.conversationContext.doctorRecommendations,
      symptoms: context.symptoms ?? this.conversationContext.symptoms,
      allergies:
        context.allergies && context.allergies.length > 0 ? context.allergies : this.conversationContext.allergies,
      prescriptions:
        context.prescriptions && context.prescriptions.length > 0
          ? context.prescriptions
          : this.conversationContext.prescriptions,
      visitNotes:
        context.visitNotes && context.visitNotes.length > 0 ? context.visitNotes : this.conversationContext.visitNotes,
      importedPatientDocument: this.patientPdfImport ?? this.conversationContext.importedPatientDocument
    };
  }

  /**
   * Traite les messages : uniquement **Gemini** + texte du **PDF importé** (pas de réponses statiques).
   */
  processUserMessage(userMessage: string): Observable<ChatMessage> {
    this.hydrateContextFromLocalStorage();

    const userMsg: ChatMessage = {
      id: this.generateMessageId(),
      sender: 'user',
      text: userMessage.trim(),
      timestamp: new Date()
    };

    const currentHistory = this.messageHistory.value;
    this.messageHistory.next([...currentHistory, userMsg]);

    const apiKey = environment.geminiApiKey?.trim();
    const pdfText = this.patientPdfImport?.text?.trim();

    const pushBot = (msg: ChatMessage) => {
      this.messageHistory.next([...this.messageHistory.value, msg]);
      return msg;
    };

    if (!apiKey) {
      return of(
        pushBot(
          this.createBotMessage(
            '**Configuration requise**\n\nAjoutez `geminiApiKey` dans `src/environments/environment.ts`, puis importez un PDF pour poser des questions sur ce fichier uniquement.',
            'warning'
          )
        )
      );
    }

    if (!pdfText) {
      return of(
        pushBot(
          this.createBotMessage(
            '**Importez un PDF d’abord**\n\nToutes les réponses sont basées **uniquement** sur le document que vous téléchargez (export dossier, courrier, rapport). Utilisez **Import PDF (patient data)**.',
            'warning'
          )
        )
      );
    }

    return this.requestGeminiChatReply(apiKey).pipe(
      map((text) => pushBot(this.createBotMessage(text, 'text'))),
      catchError((error: unknown) => {
        console.error('Gemini chat error:', error);
        const detail = this.formatGeminiRequestError(error);
        return of(
          pushBot(
            this.createBotMessage(
              `**Impossible d’obtenir une réponse**\n\n${detail}`,
              'warning'
            )
          )
        );
      })
    );
  }

  private createBotMessage(text: string, type: ChatMessage['type'] = 'text'): ChatMessage {
    return { sender: 'bot', text, timestamp: new Date(), type };
  }

  /** User-facing text; never echo full URLs (they contain the API key as query param). */
  private formatGeminiRequestError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 429) {
        return (
          '**Quota ou limite atteinte (HTTP 429)**\n\n' +
          'Google Gemini refuse temporairement les requêtes : trop d’appels ou quota du projet dépassé. ' +
          'Attendez quelques minutes, vérifiez facturation et quotas dans Google AI Studio / Google Cloud, ou utilisez une autre clé API.'
        );
      }
      if (error.status === 401 || error.status === 403) {
        return '**Clé API refusée**\n\nVérifiez que la clé est valide et que l’API Generative Language est activée pour ce projet.';
      }
      const body = error.error as { error?: { message?: string } } | null;
      const apiMsg = body?.error?.message?.trim();
      if (apiMsg) {
        return apiMsg;
      }
      return `Erreur HTTP ${error.status}. Vérifiez la clé, le modèle, et votre connexion.`;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      let m = String((error as Error).message);
      m = m.replace(/key=[^&\s?#]+/gi, 'key=***');
      return m || 'Vérifiez la clé API, le modèle, et votre connexion.';
    }
    return 'Vérifiez la clé API, le modèle, et votre connexion.';
  }

  /**
   * Calls Google Gemini with **PDF-only** context (no dossier / labs mixed in).
   */
  private requestGeminiChatReply(apiKey: string): Observable<string> {
    const model = environment.geminiModel?.trim() || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const systemText = this.buildGeminiSystemInstruction();
    const threadText = this.buildConversationThreadForGemini();
    const combinedUserText =
      threadText +
      `\n\n---\n**Answer the user’s latest message (above) precisely, using CONTEXT and thread only.**`;

    const body = {
      systemInstruction: {
        parts: [{ text: systemText }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: combinedUserText }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 4096,
        topP: 0.9
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    };

    return this.http
      .post<GeminiGenerateContentResponse>(url, body, {
        params: { key: apiKey }
      })
      .pipe(
        map((res) => {
          const text = this.extractGeminiText(res);
          if (!text.trim()) {
            throw new Error('Empty Gemini response');
          }
          return text;
        })
      );
  }

  private buildGeminiSystemInstruction(): string {
    const ctx = this.buildGeminiContextBlock();
    return (
      `You are a **documentation assistant** for the imported PDF below.\n\n` +
      `Strict rules:\n` +
      `- Use **only** the DOCUMENT text and the conversation thread. Do **not** use outside medical knowledge, generic advice, or the on-screen EHR unless that text also appears inside the PDF.\n` +
      `- If the answer is not supported by the PDF, say clearly that it is not in the document.\n` +
      `- Quote or paraphrase the PDF; stay concise (headings + bullets where useful).\n` +
      `- Match the user’s language (French / English) when they wrote in that language.\n` +
      `- Not a substitute for a clinician; no prescribing or definitive diagnosis.\n\n` +
      `--- DOCUMENT ---\n${ctx}`
    );
  }

  private buildGeminiContextBlock(): string {
    const pdf = this.patientPdfImport;
    if (!pdf?.text?.trim()) {
      return '(No PDF text — caller should have blocked this request.)';
    }
    const maxChars = 24000;
    const body =
      pdf.text.length > maxChars
        ? `${pdf.text.slice(0, maxChars)}\n\n[Truncated for model input — full text was longer.]`
        : pdf.text;
    return `File name: ${pdf.fileName}\nPages (extract): ${pdf.pageCount}\nCharacters: ${pdf.text.length}\n\n${body}`;
  }

  /** Recent dialogue as plain text (includes the latest user message as the current turn). */
  private buildConversationThreadForGemini(): string {
    const msgs = this.messageHistory.value.slice(-14);
    if (msgs.length === 0) {
      return '*(No messages.)*';
    }
    const lines = msgs.map((m) => {
      const role = m.sender === 'user' ? 'User' : 'Assistant';
      const t = (m.text || '').replace(/\s+/g, ' ').trim().slice(0, 3500);
      return `${role}: ${t}`;
    });
    return `**Conversation so far:**\n${lines.join('\n\n')}`;
  }

  private extractGeminiText(res: GeminiGenerateContentResponse): string {
    if (res.error?.message) {
      return `**Assistant unavailable**\n\n${res.error.message}`;
    }
    const reason = res.candidates?.[0]?.finishReason;
    if (reason === 'SAFETY' || reason === 'BLOCKLIST') {
      return '**Réponse filtrée par sécurité.** Reformulez en vous limitant au texte du PDF.';
    }
    const parts = res.candidates?.[0]?.content?.parts;
    const text = parts?.map((p) => p.text || '').join('') || '';
    return text.trim() || '**No text returned.** Try rephrasing or check your API key and model name in environment.';
  }

  /**
   * Réinitialise la conversation
   */
  resetConversation(): void {
    this.chatSessionId = this.generateSessionId();
    const preserved = { ...this.conversationContext };
    const pdf = this.patientPdfImport;
    this.conversationContext = {};
    this.initializeWelcomeMessage();
    this.setMedicalContext(preserved);
    if (pdf) {
      this.attachPatientPdf(pdf);
    }
  }

  /**
   * Récupère l'historique des messages
   */
  getMessageHistory(): ChatMessage[] {
    return this.messageHistory.value;
  }

  /**
   * Exporte la conversation
   */
  exportConversation(): string {
    const messages = this.messageHistory.value;
    return messages
      .map(msg => `[${msg.sender.toUpperCase()}] ${msg.text}`)
      .join('\n\n---\n\n');
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureLocalAssistantData(): void {
    this.ensureLocalMedicalRecord();
    this.ensureLocalLabResults();
    this.ensureLocalDoctors();
  }

  private ensureLocalMedicalRecord(): void {
    try {
      const raw = localStorage.getItem(this.localMedicalRecordsKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return;
      }

      const seed: MedicalRecordDTO[] = [
        {
          id: 1,
          patientId: 1,
          bloodType: 'O+',
          emergencyContactName: 'Sarah Connor',
          emergencyContactPhone: '+216 55 000 111',
          status: 'ACTIVE',
          medicalHistories: [
            { id: 1, type: 'HISTORY', condition: 'Hypertension', occurredAt: new Date().toISOString() }
          ]
        }
      ];

      localStorage.setItem(this.localMedicalRecordsKey, JSON.stringify(seed));
    } catch {
      // no-op
    }
  }

  private ensureLocalLabResults(): void {
    try {
      const raw = localStorage.getItem(this.localLabResultsKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return;
      }

      const seed: LabResultDTO[] = [
        { id: 1, medicalRecordId: 1, testName: 'blood_test', result: '13.8', unit: 'g/dL', referenceRange: '12.0-16.0', resultDate: new Date().toISOString() },
        { id: 2, medicalRecordId: 1, testName: 'ecg', result: 'Normal sinus rhythm', unit: '', referenceRange: 'Normal', resultDate: new Date().toISOString() }
      ];

      localStorage.setItem(this.localLabResultsKey, JSON.stringify(seed));
    } catch {
      // no-op
    }
  }

  private ensureLocalDoctors(): void {
    try {
      const raw = localStorage.getItem(this.localUsersKey);
      const parsed = raw ? JSON.parse(raw) : null;
      const existing = Array.isArray(parsed) ? parsed : [];
      const hasDoctor = existing.some((u) => (u?.role || '').toUpperCase() === 'DOCTOR');
      if (hasDoctor) {
        return;
      }

      const seedDoctors: User[] = [
        { id: 101, email: 'emma.carter@medicareai.com', role: 'DOCTOR', fullName: 'Emma Carter', premium: true },
        { id: 102, email: 'liam.novak@medicareai.com', role: 'DOCTOR', fullName: 'Liam Novak', premium: false }
      ];

      localStorage.setItem(this.localUsersKey, JSON.stringify([...existing, ...seedDoctors]));
    } catch {
      // no-op
    }
  }

  private hydrateContextFromLocalStorage(): void {
    const localRecord = this.getLocalMedicalRecord();
    const localLabs = this.getLocalLabResults();
    const localDoctors = this.getLocalDoctors();
    const existing = this.conversationContext;

    this.conversationContext = {
      medicalRecord:
        existing.medicalRecord && (existing.medicalRecord.id || existing.medicalRecord.patientId)
          ? existing.medicalRecord
          : localRecord || existing.medicalRecord,
      labResults:
        existing.labResults && existing.labResults.length > 0
          ? existing.labResults
          : localLabs.length > 0
            ? localLabs
            : existing.labResults,
      doctorRecommendations:
        existing.doctorRecommendations && existing.doctorRecommendations.length > 0
          ? existing.doctorRecommendations
          : localDoctors.length > 0
            ? localDoctors
            : existing.doctorRecommendations,
      symptoms: existing.symptoms || [],
      allergies: existing.allergies,
      prescriptions: existing.prescriptions,
      visitNotes: existing.visitNotes,
      importedPatientDocument: this.patientPdfImport ?? existing.importedPatientDocument
    };
  }

  private getLocalMedicalRecord(): MedicalRecordDTO | undefined {
    try {
      const raw = localStorage.getItem(this.localMedicalRecordsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] as MedicalRecordDTO : undefined;
    } catch {
      return undefined;
    }
  }

  private getLocalLabResults(): LabResultDTO[] {
    try {
      const raw = localStorage.getItem(this.localLabResultsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as LabResultDTO[]) : [];
    } catch {
      return [];
    }
  }

  private getLocalDoctors(): User[] {
    try {
      const raw = localStorage.getItem(this.localUsersKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((u: any) => (u?.role || '').toUpperCase() === 'DOCTOR')
        .map((u: any) => ({
          id: u.id,
          email: u.email,
          role: 'DOCTOR' as const,
          fullName: u.fullName,
          firstName: u.firstName,
          lastName: u.lastName,
          premium: u.premium === true
        }));
    } catch {
      return [];
    }
  }
}
