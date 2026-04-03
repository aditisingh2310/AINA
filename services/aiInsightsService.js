const { PrismaClient } = require('@prisma/client');
const { analyzeIncidentText, generateStructuredReport, analyzeIncidentPatterns } = require('./aiService');

const prisma = new PrismaClient();

function riskFromSignals({ severity = 1, escalation = false, repeatedOffender = false }) {
  if (severity >= 8 || escalation) return 'high';
  if (severity >= 5 || repeatedOffender) return 'medium';
  return 'low';
}

async function buildAndStoreInsight({ userId, incidentId, text, priorIncidents = [] }) {
  const ai = await analyzeIncidentText(text);
  const repeatedOffender = priorIncidents.some((i) => i.aiWho && i.aiWho === ai.who);
  const escalation = priorIncidents.slice(-3).some((i) => (i.aiSeverity || 0) < ai.severityScore);
  const riskLevel = riskFromSignals({
    severity: ai.severityScore,
    escalation,
    repeatedOffender,
  });

  const legalSummary = `Incident categorized as ${ai.type} with severity ${ai.severityScore}/10. Reported actor: ${ai.who}. Time context: ${ai.when}. Risk level assessed as ${riskLevel}.`;

  const insight = await prisma.aIInsight.create({
    data: {
      userId,
      incidentId,
      riskLevel,
      legalSummary,
      repeatedOffender: repeatedOffender ? ai.who : null,
      escalation,
      confidenceScore: 0.72,
    },
  });

  return { ai, insight };
}

async function generateIncidentReport(incidentId) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { user: true, aiInsights: true }
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  const incidentData = {
    description: incident.description,
    location: incident.location,
    category: incident.category,
    severity: incident.aiInsights?.[0]?.riskLevel || 'unknown',
    timestamp: incident.createdAt,
    userId: incident.userId
  };

  const structuredReport = await generateStructuredReport(incidentData);

  // Store the structured report in the database if needed
  // For now, return it directly
  return {
    incidentId,
    ...structuredReport,
    severityLevel: incident.aiInsights?.[0]?.riskLevel || 'low',
    riskTags: incident.aiInsights?.[0]?.riskTags || []
  };
}

async function analyzeUserPatterns(userId) {
  const incidents = await prisma.incident.findMany({
    where: { userId },
    include: { aiInsights: true },
    orderBy: { createdAt: 'desc' },
    take: 20 // Analyze last 20 incidents for patterns
  });

  const incidentData = incidents.map(inc => ({
    description: inc.description,
    category: inc.category,
    severity: inc.aiInsights?.[0]?.riskLevel || 'low',
    location: inc.location,
    timestamp: inc.createdAt
  }));

  const patternAnalysis = await analyzeIncidentPatterns(incidentData);

  return {
    userId,
    totalIncidents: incidents.length,
    ...patternAnalysis,
    recentIncidents: incidentData.slice(0, 5)
  };
}

async function getSafetyRecommendations(userId) {
  const patterns = await analyzeUserPatterns(userId);

  const baseRecommendations = [
    'Keep detailed records of all incidents',
    'Share location with trusted contacts',
    'Consider involving local authorities for severe incidents',
    'Use safety apps and emergency contacts'
  ];

  if (patterns.riskLevel === 'high') {
    baseRecommendations.unshift(
      'URGENT: Contact law enforcement immediately',
      'Consider safety planning and protective measures'
    );
  } else if (patterns.riskLevel === 'medium') {
    baseRecommendations.unshift(
      'Monitor situation closely',
      'Document all communications and interactions'
    );
  }

  return {
    riskLevel: patterns.riskLevel,
    recommendations: baseRecommendations,
    patterns: patterns.patterns
  };
}

module.exports = {
  buildAndStoreInsight,
  riskFromSignals,
  generateIncidentReport,
  analyzeUserPatterns,
  getSafetyRecommendations
};
