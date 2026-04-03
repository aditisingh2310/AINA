const Queue = require('bull');
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const aiAnalysisQueue = new Queue('ai-analysis', redisUrl);

aiAnalysisQueue.process(async (job) => {
  const { text, incidentId } = job.data;
  const { analyzeIncidentText } = require('./aiService');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const analysis = await analyzeIncidentText(text);

  if (incidentId) {
    await prisma.incident.update({
      where: { id: incidentId },
      data: { aiResult: analysis },
    });
  }

  return analysis;
});

module.exports = { aiAnalysisQueue };
