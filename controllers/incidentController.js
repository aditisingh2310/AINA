const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { analyzeIncidentText } = require('../services/aiService');
const { uploadEncryptedFile } = require('../services/storageService');
const { buildAndStoreInsight } = require('../services/aiInsightsService');
const { getRealtimeService } = require('../services/realtimeService');
const { aiAnalysisQueue } = require('../services/queueService');
const redisClient = require('../services/redisClient');

const prisma = new PrismaClient();

exports.analyzeIncident = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const analysis = await analyzeIncidentText(text);
  res.json({ analysis });
});

exports.createIncident = asyncHandler(async (req, res) => {
  const {
    type,
    encryptedText,
    encryptedFileBase64,
    evidenceHash,
    evidenceMimeType,
    encryptionMeta,
    timestamp,
    aiResult,
    aiInputText,
    latitude,
    longitude,
  } = req.body;

  let computedHash = evidenceHash;
  if (encryptedText) {
    computedHash = crypto.createHash('sha256').update(encryptedText).digest('hex');
  } else if (encryptedFileBase64) {
    computedHash = crypto.createHash('sha256').update(encryptedFileBase64).digest('hex');
  }

  if (computedHash !== evidenceHash) {
    res.status(400);
    throw new Error('Evidence hash mismatch');
  }

  const encryptedFileUrl = await uploadEncryptedFile(encryptedFileBase64, 'incident-evidence');

  const priorIncidents = await prisma.incident.findMany({
    where: { userId: req.user.id },
    orderBy: { timestamp: 'asc' },
    take: 20,
  });

  const analysis = aiResult || (aiInputText ? await analyzeIncidentText(aiInputText) : null);

  const incident = await prisma.incident.create({
    data: {
      userId: req.user.id,
      type: type || analysis?.type || 'verbal',
      encryptedText,
      encryptedFileUrl,
      evidenceHash,
      evidenceMimeType,
      encryptionMeta,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      aiCategory: analysis?.category,
      aiWho: analysis?.who,
      aiWhen: analysis?.when,
      aiType: analysis?.type,
      aiSeverity: analysis?.severityScore,
      aiRaw: analysis?.raw || analysis || undefined,
      latitude,
      longitude,
    },
  });

  if (!analysis && aiInputText) {
    await aiAnalysisQueue.add(
      { text: aiInputText, incidentId: incident.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );
  }

  // invalidate cache
  await redisClient.del(`incidents:${req.user.id}`);

  const insightText = aiInputText || '[Encrypted evidence submitted by user]';
  const { insight } = await buildAndStoreInsight({
    userId: req.user.id,
    incidentId: incident.id,
    text: insightText,
    priorIncidents,
  });

  // Broadcast new incident via WebSocket
  const realtimeService = getRealtimeService();
  if (realtimeService) {
    await realtimeService.broadcastNewIncident(incident.id);
  }

  res.status(201).json({ incident, insight, queuedAnalysis: !analysis && !!aiInputText });
});

exports.getIncidents = asyncHandler(async (req, res) => {
  const cacheKey = `incidents:${req.user.id}`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const incidents = await prisma.incident.findMany({
    where: { userId: req.user.id },
    orderBy: { timestamp: 'desc' },
    include: {
      aiInsights: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  await redisClient.set(cacheKey, JSON.stringify(incidents), 'EX', 60);
  res.json(incidents);
});

exports.getIncidentById = asyncHandler(async (req, res) => {
  const incident = await prisma.incident.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { aiInsights: true },
  });

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  res.json(incident);
});

exports.getNearbyIncidents = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;
  const lat = Number(latitude);
  const lng = Number(longitude);

  let incidents = await prisma.incident.findMany({
    where: {
      userId: req.user.id,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    incidents = incidents.filter((incident) => {
      const dLat = (incident.latitude || 0) - lat;
      const dLng = (incident.longitude || 0) - lng;
      return Math.sqrt(dLat * dLat + dLng * dLng) <= 0.3;
    });
  }

  res.json({ incidents });
});
