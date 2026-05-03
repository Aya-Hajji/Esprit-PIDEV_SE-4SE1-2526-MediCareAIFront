import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MeetingService } from '../../services/meeting.service';
import { CollaborationService } from '../../services/collaboration.service';
import { MeetingExtended } from '../../models/collaboration.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

declare var JitsiMeetExternalAPI: any;

interface ChatMessage    { sender: string; text: string; time: string; isMe: boolean; }
interface TranscriptLine { speaker: string; text: string; time: string; isAI: boolean; }
interface PVStage        { pct: number; label: string; icon: string; }

@Component({
  selector: 'app-meeting-live',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-live.component.html',
  styleUrls: ['./meeting-live.component.css']
})
export class MeetingLiveComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('jitsiContainer') jitsiContainer!: ElementRef;

  // ── Meeting ────────────────────────────────────────────────────────────────
  meeting: MeetingExtended | null = null;
  meetingId: number | null = null;
  roomName = '';

  // ── UI ─────────────────────────────────────────────────────────────────────
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  hasLeft = false;
  meetingEnded = false;

  // ── Jitsi ──────────────────────────────────────────────────────────────────
  jitsiAPI: any = null;
  private jitsiInitialized = false;

  // ── Recording timer ────────────────────────────────────────────────────────
  isRecording = false;
  recordingSeconds = 0;
  private recordingTimer: any = null;

  // ── Participants ───────────────────────────────────────────────────────────
  participantCount = 1;
  participantList: string[] = [];

  // ── Chat ───────────────────────────────────────────────────────────────────
  showChat = false;
  chatMessages: ChatMessage[] = [];
  newChatMessage = '';
  unreadCount = 0;

  // ── AI Transcript (auto STT) ───────────────────────────────────────────────
  showTranscript = false;
  transcriptLines: TranscriptLine[] = [];

  // MediaRecorder for audio capture
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private sttChunkTimer: any = null;
  private readonly STT_CHUNK_INTERVAL_MS = 15000; // 15s chunks for Whisper

  // SpeechRecognition fallback (Chrome only, works on localhost)
  private recognition: any = null;
  sttActive = false;
  sttMode: 'browser' | 'mediarecorder' | 'none' = 'none';
  sttError = '';

  // ── PV ─────────────────────────────────────────────────────────────────────
  pvGenerating = false;
  pvProgress = 0;
  pvStage = '';
  pvReady = false;
  generatedPV: any = null;

  readonly PV_STAGES: PVStage[] = [
    { pct: 10,  icon: '🎙️', label: 'Analyse de l\'enregistrement audio' },
    { pct: 25,  icon: '📝', label: 'Transcription voix → texte (STT)' },
    { pct: 45,  icon: '🔍', label: 'Extraction entités médicales (NLP)' },
    { pct: 65,  icon: '🧠', label: 'Analyse IA de la discussion' },
    { pct: 80,  icon: '📋', label: 'Génération du résumé intelligent' },
    { pct: 95,  icon: '✍️', label: 'Rédaction du Procès-Verbal officiel' },
    { pct: 100, icon: '✅', label: 'Procès-Verbal prêt !' },
  ];

  // ── Invite ─────────────────────────────────────────────────────────────────
  showInvitePanel = false;
  inviteLink = '';

  // ── User ───────────────────────────────────────────────────────────────────
  readonly userName  = localStorage.getItem('userName')  || `Guest-${Math.floor(Math.random() * 1000)}`;
  readonly userEmail = localStorage.getItem('userEmail') || 'guest@medicare.app';

  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private destroy$ = new Subject<void>();

  constructor(
    private meetingService: MeetingService,
    private collaborationService: CollaborationService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.meetingId = +params['meetingId'];
      if (this.meetingId) {
        // Use configured appUrl or fall back to window.location.origin
        const base = environment.appUrl || window.location.origin;
        this.inviteLink = `${base}/collaboration/dashboard/meetings/${this.meetingId}/live`;
        this.loadMeeting();
      }
    });
  }

  ngAfterViewChecked() {
    if (
      !this.jitsiInitialized && !this.isLoading &&
      !this.hasLeft && !this.meetingEnded &&
      this.meeting && this.jitsiContainer?.nativeElement
    ) {
      this.jitsiInitialized = true;
      this.initializeJitsi();
    }
  }

  ngOnDestroy() {
    this.disposeJitsi();
    this.stopRecordingTimer();
    this.stopSTT();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load meeting ───────────────────────────────────────────────────────────

  private loadMeeting() {
    this.isLoading = true;
    this.meetingService.getMeetingById(this.meetingId!).subscribe({
      next: (m: any) => {
        if (m.isRecorded == null) m.isRecorded = m.recorded ?? false;
        this.meeting = m as MeetingExtended;
        this.roomName = this.meetingService.generateJitsiRoomName(this.meetingId!);
        this.isLoading = false;
        this.jitsiInitialized = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Guest / unauthenticated participant — create a minimal meeting object
        // so Jitsi can still start using the stable room name from localStorage
        console.warn('[MeetingLive] Could not load meeting from backend — starting as guest');
        this.meeting = {
          id: this.meetingId!,
          title: `Meeting #${this.meetingId}`,
          scheduledDate: '',
          scheduledTime: '',
          isRecorded: false
        } as MeetingExtended;
        this.roomName = this.meetingService.generateJitsiRoomName(this.meetingId!);
        this.isLoading = false;
        this.jitsiInitialized = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Jitsi ──────────────────────────────────────────────────────────────────

  private initializeJitsi() {
    if (!this.meeting || !this.jitsiContainer?.nativeElement) return;

    const options = {
      roomName: this.roomName,
      width: '100%',
      height: '100%',
      parentNode: this.jitsiContainer.nativeElement,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,   // camera ON
        prejoinPageEnabled: false,    // skip pre-join
        disableDeepLinking: true,
        requireDisplayName: false,
        enableLobbyChat: false,
        disableSelfView: false,
        enableInsecureRoomNameWarning: false,
        p2p: { enabled: true },
        // No forced resolution — avoids timeout on USB webcams
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'hangup', 'chat', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'tileview'
        ],
        HIDE_INVITE_MORE_HEADER: false,
        MOBILE_APP_PROMO: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
      },
      userInfo: { displayName: this.userName, email: this.userEmail }
    };

    if (typeof JitsiMeetExternalAPI === 'undefined') {
      this.loadJitsiScript(() => this.createJitsiInstance(options));
    } else {
      this.createJitsiInstance(options);
    }
  }

  private loadJitsiScript(cb: () => void) {
    if (document.querySelector('script[src*="meet.jit.si/external_api"]')) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://meet.jit.si/external_api.js';
    s.async = true;
    s.onload = cb;
    s.onerror = () => { this.errorMessage = 'Impossible de charger Jitsi.'; this.cdr.detectChanges(); };
    document.head.appendChild(s);
  }

  private createJitsiInstance(options: any) {
    try {
      this.jitsiAPI = new JitsiMeetExternalAPI('meet.jit.si', options);
      this.setupJitsiHandlers();
      // Notify backend that meeting has started
      this.meetingService.startMeeting(this.meetingId!).subscribe({
        next: () => console.log('[Meeting] ✅ Backend notified: started'),
        error: (e) => console.warn('[Meeting] start endpoint error (non-blocking):', e?.status)
      });
      console.log('[Jitsi] ✅ Room:', this.roomName);
    } catch (err) {
      console.error('[Jitsi] Init error:', err);
      this.errorMessage = 'Erreur lors du démarrage de Jitsi.';
      this.cdr.detectChanges();
    }
  }

  private setupJitsiHandlers() {
    if (!this.jitsiAPI) return;
    this.jitsiAPI.addEventListeners({

      videoConferenceJoined: (data: any) => {
        console.log('[Jitsi] Joined:', data);
        this.hasLeft = false;
        this.isRecording = true;
        this.startRecordingTimer();
        this.addTranscript('Système', 'Réunion démarrée — transcription IA active', false);
        // Start automatic STT as soon as we join
        this.startSTT();
        this.cdr.detectChanges();
      },

      videoConferenceLeft: () => {
        this.stopRecordingTimer();
        this.stopSTT();
      },

      readyToClose: () => {
        this.disposeJitsi();
        this.hasLeft = true;
        this.jitsiInitialized = false;
        this.cdr.detectChanges();
      },

      participantJoined: (p: any) => {
        const name = p?.displayName || p?.id || 'Participant';
        if (!this.participantList.includes(name)) this.participantList.push(name);
        this.participantCount = this.participantList.length + 1;
        this.addTranscript('Système', `${name} a rejoint la réunion`, false);
        this.cdr.detectChanges();
      },

      participantLeft: (p: any) => {
        const name = p?.displayName || p?.id || 'Participant';
        this.participantList = this.participantList.filter(n => n !== name);
        this.participantCount = this.participantList.length + 1;
        this.addTranscript('Système', `${name} a quitté la réunion`, false);
        this.cdr.detectChanges();
      },

      incomingMessage: (msg: any) => {
        const sender = msg?.nick || msg?.from || 'Participant';
        const text   = msg?.message || '';
        if (!text) return;
        this.chatMessages.push({ sender, text, time: this.nowTime(), isMe: false });
        if (!this.showChat) this.unreadCount++;
        // Chat messages also appear in transcript
        this.addTranscript(sender, text, false);
        this.cdr.detectChanges();
      },

      recordingStatusChanged: (data: any) => {
        this.isRecording = data?.on === true;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Leave / Re-join / End ──────────────────────────────────────────────────

  rejoinMeeting() {
    this.hasLeft = false;
    this.jitsiInitialized = false;
    this.cdr.detectChanges();
  }

  leaveMeeting() {
    if (this.jitsiAPI) {
      this.jitsiAPI.executeCommand('hangup');
    } else {
      this.hasLeft = true;
      this.jitsiInitialized = false;
      this.cdr.detectChanges();
    }
  }

  endMeetingForAll() {
    if (!confirm('Terminer la réunion pour tous les participants ?')) return;

    this.disposeJitsi();
    this.meetingEnded = true;
    this.hasLeft = false;
    this.stopRecordingTimer();
    this.stopSTT();

    // Send transcript as notes to backend, then end + generate PV
    const notesText = this.transcriptLines
      .filter(l => l.speaker !== 'Système')
      .map(l => `[${l.time}] ${l.speaker}: ${l.text}`)
      .join('\n');

    const proceed = () => {
      this.meetingService.endMeeting(this.meetingId!).subscribe({
        next: () => { console.log('[Meeting] ✅ ended'); this.triggerPVGeneration(); },
        error: (e) => { console.warn('[Meeting] end error:', e?.status); this.triggerPVGeneration(); }
      });
    };

    if (notesText) {
      this.meetingService.updateNotes(this.meetingId!, notesText)
        .subscribe({ next: () => proceed(), error: () => proceed() });
    } else {
      proceed();
    }
  }

  private disposeJitsi() {
    if (this.jitsiAPI) { try { this.jitsiAPI.dispose(); } catch (_) {} this.jitsiAPI = null; }
  }

  // ── Recording timer ────────────────────────────────────────────────────────

  private startRecordingTimer() {
    this.recordingSeconds = 0;
    this.recordingTimer = setInterval(() => { this.recordingSeconds++; this.cdr.detectChanges(); }, 1000);
  }

  private stopRecordingTimer() {
    if (this.recordingTimer) { clearInterval(this.recordingTimer); this.recordingTimer = null; }
  }

  get recordingDuration(): string {
    const h = Math.floor(this.recordingSeconds / 3600);
    const m = Math.floor((this.recordingSeconds % 3600) / 60);
    const s = this.recordingSeconds % 60;
    const p = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  }

  // ── Chat ───────────────────────────────────────────────────────────────────

  toggleChat() { this.showChat = !this.showChat; if (this.showChat) this.unreadCount = 0; }

  sendChatMessage() {
    const text = this.newChatMessage.trim();
    if (!text) return;
    if (this.jitsiAPI) this.jitsiAPI.executeCommand('sendChatMessage', text, '', false);
    this.chatMessages.push({ sender: this.userName, text, time: this.nowTime(), isMe: true });
    this.addTranscript(this.userName, text, false);
    this.newChatMessage = '';
    this.cdr.detectChanges();
  }

  // ── STT — OpenAI Whisper + Web Speech API fallback ────────────────────────
  //
  // Strategy 1 (primary):   MediaRecorder captures mic audio every 15s
  //                          → sends to OpenAI Whisper API directly
  //                          → real transcription of what is said
  //
  // Strategy 2 (fallback):  Web Speech API (Chrome only, localhost may fail)
  //
  // Why not use Jitsi's mic?
  //   Jitsi runs in an iframe and takes exclusive mic access.
  //   We open a SEPARATE mic stream via getUserMedia for recording only.
  //   Both streams can coexist — the user hears Jitsi, we record separately.

  toggleTranscript() { this.showTranscript = !this.showTranscript; }

  private startSTT() {
    this.sttError = '';

    // Always try MediaRecorder + Whisper first (most reliable)
    this.startMediaRecorderWhisper();

    // Also try Web Speech API as parallel fallback
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR && window.location.protocol === 'https:') {
      this.startBrowserSTT(SR);
    }
  }

  // ── Strategy 1: MediaRecorder → OpenAI Whisper ────────────────────────────
  private startMediaRecorderWhisper() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        this.mediaStream = stream;

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';

        this.mediaRecorder = new MediaRecorder(stream, { mimeType });
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        // Collect audio in 15-second chunks
        this.mediaRecorder.start(this.STT_CHUNK_INTERVAL_MS);

        this.sttMode = 'mediarecorder';
        this.sttActive = true;
        this.cdr.detectChanges();

        // Every 15s, transcribe the accumulated audio
        this.sttChunkTimer = setInterval(() => this.transcribeChunk(), this.STT_CHUNK_INTERVAL_MS);
        console.log('[STT] MediaRecorder started →', mimeType);
      })
      .catch(err => {
        console.warn('[STT] getUserMedia failed:', err.message);
        this.sttError = 'Microphone access denied. Enable mic permissions.';
        this.sttMode = 'none';
        this.cdr.detectChanges();
      });
  }

  /**
   * Transcribe the current audio chunk using OpenAI Whisper API.
   * Whisper supports: webm, mp4, mp3, wav, ogg, flac (max 25MB).
   */
  private transcribeChunk() {
    if (!this.audioChunks.length) return;

    const blob = new Blob(this.audioChunks, {
      type: this.mediaRecorder?.mimeType || 'audio/webm'
    });
    this.audioChunks = []; // reset for next chunk

    // Skip silence (< 5KB = likely no speech)
    if (blob.size < 5000) {
      console.log('[STT] Chunk too small (silence), skipping');
      return;
    }

    const apiKey = environment.openaiApiKey;

    if (apiKey) {
      // ── Use OpenAI Whisper API ─────────────────────────────────────────────
      this.transcribeWithWhisper(blob, apiKey);
    } else {
      // ── No API key: try backend STT endpoint ──────────────────────────────
      this.transcribeWithBackend(blob);
    }
  }

  private transcribeWithWhisper(blob: Blob, apiKey: string) {
    const formData = new FormData();
    // Whisper requires a filename with extension
    const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr'); // change to 'en' if meeting is in English
    formData.append('response_format', 'json');

    this.http.post<{ text: string }>(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      { headers: new HttpHeaders({ Authorization: `Bearer ${apiKey}` }) }
    ).subscribe({
      next: (res) => {
        const text = res?.text?.trim();
        if (text && text.length > 2) {
          this.addTranscript(this.userName, text, true);
          this.cdr.detectChanges();
          console.log('[Whisper] ✅ Transcribed:', text);
        }
      },
      error: (e) => {
        console.warn('[Whisper] Error:', e?.status, e?.error?.error?.message);
        if (e?.status === 401) {
          this.sttError = 'Invalid OpenAI API key. Check environment.ts → openaiApiKey.';
          this.cdr.detectChanges();
        }
      }
    });
  }

  private transcribeWithBackend(blob: Blob) {
    if (!this.meetingId) return;
    const formData = new FormData();
    const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';
    formData.append('audio', blob, `chunk_${Date.now()}.${ext}`);
    formData.append('meetingId', String(this.meetingId));
    formData.append('speaker', this.userName);
    formData.append('lang', 'fr');

    const token = localStorage.getItem('authToken');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    this.http.post<{ text: string; speaker?: string }>(
      `${this.baseUrl}/api/meetings/${this.meetingId}/stt`,
      formData,
      { headers }
    ).subscribe({
      next: (res) => {
        const text = res?.text?.trim();
        if (text && text.length > 2) {
          this.addTranscript(res?.speaker || this.userName, text, true);
          this.cdr.detectChanges();
          console.log('[STT Backend] ✅ Transcribed:', text);
        }
      },
      error: (e) => {
        console.warn('[STT Backend] Not available:', e?.status);
      }
    });
  }

  // ── Strategy 2: Browser Web Speech API (HTTPS only) ───────────────────────
  private startBrowserSTT(SR: any) {
    try {
      this.recognition = new SR();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'fr-FR';

      this.recognition.onstart = () => {
        if (this.sttMode === 'none') {
          this.sttMode = 'browser';
          this.sttActive = true;
          this.cdr.detectChanges();
        }
      };

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.trim();
            if (text.length > 2) {
              this.addTranscript(this.userName, text, true);
              this.cdr.detectChanges();
            }
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        console.warn('[STT Browser] Error:', e.error);
      };

      this.recognition.onend = () => {
        if (this.sttActive && !this.hasLeft && !this.meetingEnded) {
          try { this.recognition?.start(); } catch (_) {}
        }
      };

      this.recognition.start();
      console.log('[STT] Browser Speech Recognition started');
    } catch (err) {
      console.warn('[STT Browser] Could not start:', err);
    }
  }

  private stopSTT() {
    this.sttActive = false;

    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
      this.recognition = null;
    }

    if (this.sttChunkTimer) { clearInterval(this.sttChunkTimer); this.sttChunkTimer = null; }

    // Send final chunk before stopping
    if (this.audioChunks.length > 0) {
      this.transcribeChunk();
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (_) {}
    }
    this.mediaRecorder = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  private addTranscript(speaker: string, text: string, isAI: boolean) {
    this.transcriptLines.push({ speaker, text, time: this.nowTime(), isAI });
    if (this.transcriptLines.length > 500) this.transcriptLines.shift();
  }

  // ── PV Generation ──────────────────────────────────────────────────────────

  private pvAnimationStopped = false;

  private triggerPVGeneration() {
    this.pvGenerating = true;
    this.pvAnimationStopped = false;
    this.pvProgress = 0;
    this.pvStage = 'Démarrage de la génération IA…';
    this.cdr.detectChanges();

    this.animatePVProgress();

    // Try backend first: POST /api/meetings/{id}/pv/generate
    this.meetingService.generatePV(this.meetingId!).subscribe({
      next: (response: any) => {
        console.log('[PV] ✅ Generation triggered:', response);
        this.pollForPV();
      },
      error: (e) => {
        console.warn('[PV] generate endpoint error:', e?.status, '— using local NLP fallback');
        this.pvAnimationStopped = true;
        this.buildLocalPV();
      }
    });
  }

  private pollForPV(attempts = 0) {
    if (attempts > 20) {
      // After 80s of polling, fall back to local PV
      console.warn('[PV] Polling timeout — using local PV');
      this.buildLocalPV();
      return;
    }

    setTimeout(() => {
      this.meetingService.getPV(this.meetingId!).subscribe({
        next: (pv: any) => {
          console.log('[PV] Poll response:', pv);
          const status = pv?.status || pv?.pvStatus || '';
          if (status === 'ready' || status === 'READY' || pv?.content || pv?.executiveSummary || pv?.summary) {
            // PV is ready from backend
            this.pvProgress = 100;
            this.pvStage = '✅ Procès-Verbal généré par l\'IA !';
            this.pvGenerating = false;
            this.pvReady = true;
            this.generatedPV = this.mapBackendPV(pv);
            this.cdr.detectChanges();
          } else {
            // Still generating — poll again
            this.pollForPV(attempts + 1);
          }
        },
        error: () => this.pollForPV(attempts + 1)
      });
    }, 4000);
  }

  /**
   * Map backend PV response to display format.
   * Handles both the ProcesVerbal model and raw backend responses.
   */
  private mapBackendPV(pv: any): any {
    const now     = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Extract content from various possible backend response shapes
    const content = pv?.content || pv;
    const summary = content?.executiveSummary || content?.summary || pv?.summary || '';
    const participants = content?.participants?.map((p: any) => p?.name || p) ||
                         pv?.participants?.map((p: any) => p?.name || p) ||
                         [this.userName, ...this.participantList];
    const decisions  = content?.decisionsMade?.map((d: any) => d?.decision || d) ||
                       content?.decisions || pv?.decisions || [];
    const actions    = content?.actionItems?.map((a: any) => a?.task || a) ||
                       content?.actions || pv?.actions || [];
    const diagnoses  = content?.diagnosis ? [content.diagnosis?.main || content.diagnosis] : [];
    const treatments = content?.treatmentsRecommended?.map((t: any) =>
                         `${t?.medication || ''} ${t?.dosage || ''} — ${t?.indication || ''}`.trim()
                       ) || [];

    return {
      title:        this.meeting?.title || 'Réunion médicale',
      date:         dateStr,
      time:         timeStr,
      duration:     this.recordingDuration,
      meetingId:    this.meetingId,
      participants: participants.length ? participants : [this.userName],
      totalLines:   this.transcriptLines.filter(l => l.speaker !== 'Système').length,
      summary:      summary || this.buildLocalSummary(),
      decisions:    decisions.length  ? decisions  : null,
      actions:      actions.length    ? actions    : null,
      diagnoses:    diagnoses.length  ? diagnoses  : null,
      treatments:   treatments.length ? treatments : null,
      fullTranscript: this.transcriptLines.filter(l => l.speaker !== 'Système'),
      confidence:   pv?.confidenceScores?.overallQuality
                      ? Math.round(pv.confidenceScores.overallQuality * 100)
                      : 85,
      generatedBy:  'MediCareAI — IA Backend (Spring Boot + NLP)',
      fromBackend:  true,
    };
  }

  /**
   * Local fallback PV when backend is unavailable.
   * Uses NLP keyword extraction on the notes taken during the meeting.
   */
  private buildLocalPV() {
    this.pvProgress = 100;
    this.pvStage = '✅ PV generated';
    this.pvGenerating = false;
    this.pvReady = true;

    const real = this.transcriptLines.filter(l => l.speaker !== 'Système');
    const speakers = [...new Set(real.map(l => l.speaker))];
    if (!speakers.includes(this.userName)) speakers.unshift(this.userName);

    const apiKey = environment.openaiApiKey;

    if (apiKey && real.length > 0) {
      // ── Use GPT to generate a real intelligent PV ──────────────────────────
      this.generatePVWithGPT(real, speakers, apiKey);
    } else {
      // ── Local NLP fallback ─────────────────────────────────────────────────
      this.generatedPV = this.buildNLPPV(real, speakers);
      this.cdr.detectChanges();
    }
  }

  /**
   * Generate PV using OpenAI GPT-4o-mini from the real transcript.
   */
  private generatePVWithGPT(lines: TranscriptLine[], speakers: string[], apiKey: string) {
    const transcriptText = lines
      .map(l => `[${l.time}] ${l.speaker}: ${l.text}`)
      .join('\n');

    const prompt = `You are a medical secretary. Based on the following meeting transcript, generate a structured Meeting Minutes (Procès-Verbal) in English.

TRANSCRIPT:
${transcriptText}

Generate a JSON response with this exact structure:
{
  "summary": "2-3 sentence executive summary of the meeting",
  "decisions": ["decision 1", "decision 2"],
  "actions": ["action item 1", "action item 2"],
  "diagnoses": ["medical finding 1"],
  "treatments": ["treatment recommendation 1"],
  "nextSteps": ["next step 1", "next step 2"]
}

Only include fields that have actual content from the transcript. Return valid JSON only.`;

    this.pvStage = '🧠 GPT generating intelligent summary...';
    this.cdr.detectChanges();

    this.http.post<any>(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      },
      { headers: new HttpHeaders({
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        })
      }
    ).subscribe({
      next: (res: any) => {
        try {
          const content = res?.choices?.[0]?.message?.content || '{}';
          // Extract JSON from response (GPT sometimes wraps in markdown)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

          const now = new Date();
          this.generatedPV = {
            title:        this.meeting?.title || 'Medical Meeting',
            date:         now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time:         now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            duration:     this.recordingDuration,
            meetingId:    this.meetingId,
            participants: speakers,
            totalLines:   lines.length,
            aiLines:      lines.filter(l => l.isAI).length,
            summary:      parsed.summary || this.buildLocalSummary(),
            decisions:    parsed.decisions?.length  ? parsed.decisions  : null,
            actions:      parsed.actions?.length    ? parsed.actions    : null,
            diagnoses:    parsed.diagnoses?.length  ? parsed.diagnoses  : null,
            treatments:   parsed.treatments?.length ? parsed.treatments : null,
            nextSteps:    parsed.nextSteps?.length  ? parsed.nextSteps  : null,
            fullTranscript: lines,
            confidence:   95,
            generatedBy:  'MediCareAI — OpenAI GPT-4o-mini + Whisper STT',
            fromBackend:  false,
          };
          this.pvStage = '✅ PV generated by GPT!';
          this.cdr.detectChanges();
          console.log('[GPT PV] ✅ Generated successfully');
        } catch (e) {
          console.warn('[GPT PV] JSON parse error, using NLP fallback');
          this.generatedPV = this.buildNLPPV(lines, speakers);
          this.cdr.detectChanges();
        }
      },
      error: (e) => {
        console.warn('[GPT PV] Error:', e?.status, '— using NLP fallback');
        this.generatedPV = this.buildNLPPV(lines, speakers);
        this.cdr.detectChanges();
      }
    });
  }

  /** Local NLP-based PV when GPT is not available */
  private buildNLPPV(real: TranscriptLine[], speakers: string[]): any {
    const KW = {
      decision:  ['decide', 'decision', 'recommend', 'propose', 'prescribe', 'approve', 'agreed', 'décide', 'recommande', 'propose'],
      action:    ['schedule', 'plan', 'send', 'contact', 'check', 'add', 'update', 'note', 'programmer', 'planifier', 'envoyer'],
      diagnosis: ['diagnosis', 'disease', 'syndrome', 'insufficiency', 'diabetes', 'hypertension', 'infection', 'diagnostic', 'maladie'],
      treatment: ['treatment', 'medication', 'dose', 'mg', 'antibiotic', 'surgery', 'therapy', 'traitement', 'médicament'],
    };

    const decisions:  string[] = [];
    const actions:    string[] = [];
    const diagnoses:  string[] = [];
    const treatments: string[] = [];

    real.forEach(line => {
      const t = line.text.toLowerCase();
      if (KW.decision.some(k  => t.includes(k))) decisions.push(`${line.speaker}: ${line.text}`);
      if (KW.action.some(k    => t.includes(k))) actions.push(`${line.speaker}: ${line.text}`);
      if (KW.diagnosis.some(k => t.includes(k))) diagnoses.push(`${line.speaker}: ${line.text}`);
      if (KW.treatment.some(k => t.includes(k))) treatments.push(`${line.speaker}: ${line.text}`);
    });

    const now = new Date();
    return {
      title:        this.meeting?.title || 'Medical Meeting',
      date:         now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time:         now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      duration:     this.recordingDuration,
      meetingId:    this.meetingId,
      participants: speakers,
      totalLines:   real.length,
      aiLines:      real.filter(l => l.isAI).length,
      summary:      this.buildLocalSummary(),
      decisions:    decisions.length  ? decisions  : null,
      actions:      actions.length    ? actions    : null,
      diagnoses:    diagnoses.length  ? diagnoses  : null,
      treatments:   treatments.length ? treatments : null,
      nextSteps:    null,
      fullTranscript: real,
      confidence:   Math.min(90, 45 + real.filter(l => l.isAI).length * 5),
      generatedBy:  real.filter(l => l.isAI).length > 0
                      ? 'MediCareAI — Whisper STT + NLP'
                      : 'MediCareAI — NLP (no audio transcription)',
      fromBackend:  false,
    };
  }

  private buildLocalSummary(): string {
    const real = this.transcriptLines.filter(l => l.speaker !== 'Système' && l.isAI);
    const sentences = real.map(l => l.text).filter(t => t.length > 10);
    const base = sentences.slice(0, 4).join(' ');
    const now = new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return base.length > 20
      ? base
      : `Medical meeting "${this.meeting?.title || ''}" on ${now}. ${real.length} intervention(s) transcribed automatically.`;
  }

  /** Animate progress bar while backend processes — stops when pvAnimationStopped */
  private animatePVProgress() {
    let stageIdx = 0;
    const tick = () => {
      if (this.pvAnimationStopped || stageIdx >= this.PV_STAGES.length - 1) return;
      const stage = this.PV_STAGES[stageIdx++];
      this.pvProgress = stage.pct;
      this.pvStage = `${stage.icon} ${stage.label}`;
      this.cdr.detectChanges();
      setTimeout(tick, 2500);
    };
    setTimeout(tick, 500);
  }

  navigateToPV() {
    this.router.navigate(['/collaboration/dashboard/meetings', this.meetingId, 'pv']);
  }

  // ── Invite ─────────────────────────────────────────────────────────────────

  toggleInvitePanel() { this.showInvitePanel = !this.showInvitePanel; }

  copyRoomLink() {
    navigator.clipboard.writeText(this.inviteLink).then(() => {
      this.successMessage = '🔗 Lien copié ! Partagez-le avec vos participants.';
      setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 4000);
      this.cdr.detectChanges();
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private nowTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  goBack() { this.router.navigate(['/collaboration/dashboard']); }
}
