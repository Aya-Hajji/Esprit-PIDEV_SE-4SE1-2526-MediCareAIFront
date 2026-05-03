/**
 * BACKEND ARCHITECTURE - Jitsi + IA PV Integration
 * Phases: 1-2 (Jitsi), 3-8 (IA PV Generation)
 */

// ============================================
// PHASE 1-2: JITSI INTEGRATION
// ============================================

/**
 * FILE: backend/routes/meetings.routes.js
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const meetingController = require('../controllers/meeting.controller');
const jitsiService = require('../services/jitsi.service');

// Create meeting
router.post('/', auth, meetingController.createMeeting);

// Get all meetings
router.get('/', auth, meetingController.getAllMeetings);

// Get meeting by ID
router.get('/:meetingId', auth, meetingController.getMeetingById);

// Update meeting
router.put('/:meetingId', auth, meetingController.updateMeeting);

// Delete meeting
router.delete('/:meetingId', auth, meetingController.deleteMeeting);

// ============================================
// JITSI ENDPOINTS (Phase 1-2)
// ============================================

// Start Jitsi meeting (generate room + update DB)
router.post('/:meetingId/jitsi/start', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { roomName } = req.body;

    // Update meeting status to 'live'
    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { status: 'live', jitsiRoomName: roomName },
      { new: true }
    );

    // Start recording (webhook from Jitsi)
    if (meeting.recorded) {
      // Jitsi will call webhook when recording ends
      console.log(`[Jitsi] Recording enabled for ${roomName}`);
    }

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End Jitsi meeting (save recording info)
router.post('/:meetingId/jitsi/end', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { recordingId } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      {
        status: 'ended',
        endTime: new Date(),
        'recording.recordingId': recordingId,
        'recording.status': 'processing'
      },
      { new: true }
    );

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jitsi Webhook - Recording finished
router.post('/webhook/recording-finished', async (req, res) => {
  try {
    const { event } = req.body; // Jitsi webhook payload

    if (event.action === 'recording_status') {
      const recordingId = event.data.id;
      const status = event.data.status;

      // Update meeting with recording URL
      const recording = await jitsiService.getRecordingInfo(recordingId);

      // Queue PV generation task
      await PVQueue.enqueue({
        type: 'GENERATE_PV',
        meetingId: recording.meetingId,
        recordingUrl: recording.url,
        recordingId: recordingId
      });

      console.log(`[Jitsi Webhook] Recording finished: ${recordingId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// ============================================
// PHASE 3-8: PV GENERATION ENDPOINTS
// ============================================

/**
 * FILE: backend/routes/pv.routes.js
 */

// Request PV generation
router.post('/:meetingId/generate-pv', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting || !meeting.recording?.recordingId) {
      return res.status(400).json({ error: 'No recording found' });
    }

    // Queue task: STT → NLP → LLM → PV
    const task = await PVQueue.enqueue({
      type: 'GENERATE_PV',
      meetingId: meetingId,
      recordingUrl: meeting.recording.fileUrl,
      recordingId: meeting.recording.recordingId,
      sessionId: meeting.sessionId
    });

    // Update meeting status
    await Meeting.findByIdAndUpdate(
      meetingId,
      { pvStatus: 'generating', pvTaskId: task.id }
    );

    res.json({ taskId: task.id, status: 'queued' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Poll PV generation progress
router.get('/:meetingId/pv-progress', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    const taskId = meeting.pvTaskId;

    const task = await PVQueue.getTask(taskId);
    const progress = task.metadata?.progress || 0;
    const stage = task.metadata?.stage || 'pending';

    res.json({
      meetingId,
      taskId,
      stage: stage, // 'initializing', 'transcribing', 'analyzing', 'generating'
      progress: progress, // 0-100
      message: `${stage}: ${progress}%`,
      status: task.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get PV document
router.get('/pv/:pvId', auth, async (req, res) => {
  try {
    const pv = await ProcesVerbal.findById(req.params.pvId);
    if (!pv) return res.status(404).json({ error: 'PV not found' });
    res.json(pv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update PV (review/approve/sign)
router.put('/pv/:pvId', auth, async (req, res) => {
  try {
    const pv = await ProcesVerbal.findByIdAndUpdate(
      req.params.pvId,
      req.body,
      { new: true }
    );
    res.json(pv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export PV to PDF
router.get('/pv/:pvId/pdf', auth, async (req, res) => {
  try {
    const pv = await ProcesVerbal.findById(req.params.pvId);
    const pdf = await pdfService.generatePVPDF(pv);
    res.contentType('application/pdf');
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send PV email
router.post('/pv/:pvId/send-email', auth, async (req, res) => {
  try {
    const { recipients } = req.body;
    const pv = await ProcesVerbal.findById(req.params.pvId);

    await emailService.sendPVEmail(pv, recipients);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sign PV
router.post('/pv/:pvId/sign', auth, async (req, res) => {
  try {
    const { signature } = req.body;
    const pv = await ProcesVerbal.findByIdAndUpdate(
      req.params.pvId,
      {
        status: 'signed',
        signatureData: {
          signedBy: req.user.id,
          signature: signature,
          timestamp: new Date()
        }
      },
      { new: true }
    );
    res.json(pv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// ============================================
// DATABASE SCHEMA
// ============================================

/**
 * FILE: backend/models/Meeting.js
 */

const meetingSchema = new Schema({
  sessionId: { type: ObjectId, ref: 'CollaborationSession' },
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },

  // Jitsi config
  jitsi: {
    roomName: String,
    roomUrl: String,
    jwtToken: String
  },

  // Recording
  recorded: Boolean,
  recording: {
    recordingId: String,
    status: { type: String, enum: ['recording', 'processing', 'ready', 'failed'] },
    fileUrl: String,
    duration: Number,
    uploadedAt: Date
  },

  // PV Link
  pvId: { type: ObjectId, ref: 'ProcesVerbal' },
  pvStatus: String,
  pvTaskId: String,

  organizer: {
    userId: ObjectId,
    name: String,
    email: String
  },

  participants: [{
    userId: ObjectId,
    name: String,
    email: String,
    status: String,
    joinedAt: Date,
    leftAt: Date,
    speakingTime: Number
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * FILE: backend/models/ProcesVerbal.js
 */

const pvSchema = new Schema({
  meetingId: { type: ObjectId, ref: 'Meeting' },
  sessionId: { type: ObjectId, ref: 'CollaborationSession' },
  documentId: { type: ObjectId, ref: 'SharedDocument' },

  // Generation
  generatedAt: Date,
  generatedBy: { type: String, enum: ['AI', 'MANUAL'] },
  status: { type: String, enum: ['draft', 'reviewed', 'approved', 'signed'] },
  confidenceScores: {
    transcript: Number,
    participantsExtraction: Number,
    diagnosisExtraction: Number,
    decisionsExtraction: Number,
    treatmentsExtraction: Number,
    overallQuality: Number
  },

  // Content structure
  content: {
    header: {
      meetingTitle: String,
      date: Date,
      startTime: String,
      endTime: String,
      durationMinutes: Number,
      location: String,
      roomLink: String
    },
    
    participants: [{
      name: String,
      specialization: String,
      status: String,
      speakingTime: String
    }],
    
    executiveSummary: String,
    discussionPoints: [String],
    
    diagnosis: {
      main: String,
      icd10: String,
      comorbidities: [String],
      severity: String,
      details: String
    },
    
    decisionsMade: [{
      decision: String,
      responsible: String,
      deadline: Date,
      status: String,
      priority: String
    }],
    
    actionItems: [{
      task: String,
      assignedTo: String,
      dueDate: Date,
      status: String
    }],
    
    treatmentsRecommended: [{
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
      indication: String,
      contraindications: [String],
      interactions: [String]
    }],
    
    importantNotes: String,
    nextMeeting: {
      date: Date,
      topic: String
    }
  },

  // Review
  reviewedBy: {
    userId: ObjectId,
    name: String,
    timestamp: Date
  },

  // Signature
  signatureData: {
    signedBy: ObjectId,
    signature: String,
    timestamp: Date
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = { meetingSchema, pvSchema };
