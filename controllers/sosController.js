const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { notifyTrustedContacts } = require('../services/notificationService');
const { uploadEncryptedFile } = require('../services/storageService');
const { getRealtimeService } = require('../services/realtimeService');
const { buildAndStoreInsight } = require('../services/aiInsightsService');

const prisma = new PrismaClient();

exports.triggerSOS = asyncHandler(async (req, res) => {
  const {
    latitude,
    longitude,
    encryptedAudioBase64,
    encryptionMeta,
    retryCount = 0,
    audioDuration = 30 // Default 30 seconds
  } = req.body;

  // Validate required location data
  if (!latitude || !longitude) {
    res.status(400);
    throw new Error('GPS location (latitude, longitude) is required for SOS');
  }

  const contacts = await prisma.contact.findMany({
    where: { userId: req.user.id, isEmergency: true },
    orderBy: { priority: 'asc' },
  });

  let alertStatus = 'simulated';
  let notifications = [];

  try {
    const notification = await notifyTrustedContacts({
      contacts,
      location: `${latitude},${longitude}`,
      userId: req.user.id,
      sos: true
    });
    alertStatus = notification.provider;
    notifications = notification.deliveredTo;
  } catch (error) {
    console.error('Failed to send SOS notifications:', error);
    alertStatus = 'fallback_sms';
    notifications = contacts.map((c) => ({
      contactId: c.id,
      status: 'queued_sms_fallback',
      error: error.message
    }));
  }

  // Upload encrypted audio if provided
  let encryptedAudioUrl = null;
  if (encryptedAudioBase64) {
    try {
      encryptedAudioUrl = await uploadEncryptedFile(encryptedAudioBase64, 'sos-audio');
    } catch (error) {
      console.error('Failed to upload SOS audio:', error);
    }
  }

  // Create SOS log
  const log = await prisma.sOSLog.create({
    data: {
      userId: req.user.id,
      location: `${latitude},${longitude}`,
      encryptedAudioUrl,
      encryptionMeta,
      alertStatus,
      contactsNotified: notifications.length,
      retryCount,
      audioDuration,
    },
  });

  // Auto-create emergency incident
  const emergencyDescription = `EMERGENCY SOS TRIGGERED - Location: ${latitude},${longitude}. Audio evidence ${encryptedAudioBase64 ? 'attached' : 'not provided'}. Contacts notified: ${notifications.length}`;

  const incident = await prisma.incident.create({
    data: {
      userId: req.user.id,
      type: 'threat',
      description: emergencyDescription,
      encryptedText: encryptedAudioBase64 || 'encrypted-sos-trigger',
      evidenceHash: crypto
        .createHash('sha256')
        .update(encryptedAudioBase64 || `${latitude},${longitude}`)
        .digest('hex'),
      encryptionMeta,
      aiCategory: 'threat',
      aiType: 'threat',
      aiSeverity: 10, // Maximum severity for SOS
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date(),
      category: 'emergency'
    },
  });

  // Generate AI insights for the emergency incident
  const { insight } = await buildAndStoreInsight({
    userId: req.user.id,
    incidentId: incident.id,
    text: emergencyDescription,
    priorIncidents: []
  });

  // Broadcast SOS event via WebSocket
  const realtimeService = getRealtimeService();
  if (realtimeService) {
    // Broadcast to admin dashboard
    realtimeService.getIO().to('admin').emit('sos_triggered', {
      id: log.id,
      incidentId: incident.id,
      location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
      timestamp: log.createdAt,
      contactsNotified: notifications.length,
      audioAvailable: !!encryptedAudioUrl
    });

    // Broadcast emergency alert to user's contacts (if connected)
    contacts.forEach(contact => {
      const socketId = realtimeService.connectedClients.get(contact.id.toString());
      if (socketId) {
        realtimeService.getIO().to(socketId).emit('emergency_sos', {
          userId: req.user.id,
          location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
          timestamp: log.createdAt,
          message: 'Emergency SOS triggered - immediate assistance may be needed'
        });
      }
    });
  }

  res.status(201).json({
    message: 'SOS triggered successfully',
    log,
    incident,
    notifications,
    emergencyContacts: contacts.length,
    audioRecorded: !!encryptedAudioUrl
  });
});

exports.getSOSHistory = asyncHandler(async (req, res) => {
  const logs = await prisma.sOSLog.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      incident: {
        select: {
          id: true,
          category: true,
          aiSeverity: true
        }
      }
    }
  });

  res.json(logs);
});

exports.getSOSStatus = asyncHandler(async (req, res) => {
  const latestLog = await prisma.sOSLog.findFirst({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });

  const emergencyContacts = await prisma.contact.count({
    where: { userId: req.user.id, isEmergency: true }
  });

  res.json({
    lastSOS: latestLog?.createdAt || null,
    emergencyContacts,
    sosEnabled: emergencyContacts > 0
  });
});
