const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');
const { getRealtimeService } = require('../services/realtimeService');
const { analyzeIncidentPatterns } = require('../services/aiService');

const prisma = new PrismaClient();

// Get real-time dashboard stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalIncidents,
    todayIncidents,
    weekIncidents,
    monthIncidents,
    severityBreakdown,
    categoryBreakdown,
    recentIncidents,
    activeSOS
  ] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({ where: { createdAt: { gte: today } } }),
    prisma.incident.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.incident.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.incident.groupBy({
      by: ['aiSeverity'],
      _count: { id: true },
      where: { createdAt: { gte: weekAgo } }
    }),
    prisma.incident.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { createdAt: { gte: weekAgo } }
    }),
    prisma.incident.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        aiInsights: { take: 1, orderBy: { createdAt: 'desc' } }
      }
    }),
    prisma.sOSLog.count({
      where: {
        createdAt: { gte: weekAgo },
        alertStatus: { not: 'failed' }
      }
    })
  ]);

  // Calculate severity levels
  const severityLevels = {
    low: severityBreakdown.filter(s => (s.aiSeverity || 0) <= 3).reduce((sum, s) => sum + s._count.id, 0),
    medium: severityBreakdown.filter(s => (s.aiSeverity || 0) > 3 && (s.aiSeverity || 0) <= 7).reduce((sum, s) => sum + s._count.id, 0),
    high: severityBreakdown.filter(s => (s.aiSeverity || 0) > 7 && (s.aiSeverity || 0) <= 9).reduce((sum, s) => sum + s._count.id, 0),
    critical: severityBreakdown.filter(s => (s.aiSeverity || 0) === 10).reduce((sum, s) => sum + s._count.id, 0)
  };

  res.json({
    summary: {
      totalIncidents,
      todayIncidents,
      weekIncidents,
      monthIncidents,
      activeSOS
    },
    severityBreakdown: severityLevels,
    categoryBreakdown,
    recentIncidents: recentIncidents.map(inc => ({
      id: inc.id,
      category: inc.category,
      severity: inc.aiInsights?.[0]?.riskLevel || 'low',
      location: inc.location,
      timestamp: inc.createdAt,
      user: inc.user
    })),
    timestamp: now
  });
});

// Get all incidents for admin map view
exports.getAllIncidents = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const incidents = await prisma.incident.findMany({
    where: {
      createdAt: { gte: since },
      latitude: { not: null },
      longitude: { not: null }
    },
    include: {
      user: { select: { id: true, name: true } },
      aiInsights: { take: 1, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const mapData = incidents.map(inc => ({
    id: inc.id,
    lat: inc.latitude,
    lng: inc.longitude,
    category: inc.category,
    severity: inc.aiInsights?.[0]?.riskLevel || 'low',
    riskTags: inc.aiInsights?.[0]?.riskTags || [],
    timestamp: inc.createdAt,
    user: inc.user
  }));

  res.json(mapData);
});

// Get incident patterns and trends
exports.getIncidentPatterns = asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentIncidents = await prisma.incident.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: {
      description: true,
      category: true,
      aiSeverity: true,
      location: true,
      createdAt: true,
      aiInsights: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { riskLevel: true }
      }
    }
  });

  const incidentData = recentIncidents.map(inc => ({
    description: inc.description,
    category: inc.category,
    severity: inc.aiInsights?.[0]?.riskLevel || 'low',
    location: inc.location,
    timestamp: inc.createdAt
  }));

  const patterns = await analyzeIncidentPatterns(incidentData);

  // Get location hotspots
  const locationClusters = recentIncidents.reduce((acc, inc) => {
    if (inc.location) {
      const key = inc.location;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const hotspots = Object.entries(locationClusters)
    .filter(([, count]) => count >= 3)
    .map(([location, count]) => ({ location, incidentCount: count }))
    .sort((a, b) => b.incidentCount - a.incidentCount)
    .slice(0, 10);

  res.json({
    patterns,
    hotspots,
    totalAnalyzed: recentIncidents.length
  });
});

// Get SOS alerts for admin
exports.getSOSAlerts = asyncHandler(async (req, res) => {
  const recent = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

  const sosLogs = await prisma.sOSLog.findMany({
    where: { createdAt: { gte: recent } },
    include: {
      user: { select: { id: true, name: true } },
      incident: {
        select: {
          id: true,
          category: true,
          aiSeverity: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const alerts = sosLogs.map(log => ({
    id: log.id,
    user: log.user,
    location: log.location,
    timestamp: log.createdAt,
    alertStatus: log.alertStatus,
    contactsNotified: log.contactsNotified,
    incidentId: log.incident?.id,
    audioAvailable: !!log.encryptedAudioUrl
  }));

  res.json(alerts);
});

// Force refresh of real-time stats
exports.refreshStats = asyncHandler(async (req, res) => {
  const realtimeService = getRealtimeService();
  if (realtimeService) {
    await realtimeService.broadcastStatsUpdate();
    res.json({ message: 'Stats refresh triggered' });
  } else {
    res.status(503).json({ message: 'Realtime service not available' });
  }
});

module.exports = {
  getDashboardStats,
  getAllIncidents,
  getIncidentPatterns,
  getSOSAlerts,
  refreshStats
};