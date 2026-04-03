require('dotenv').config();
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const app = require('./app');
const { validateEnv } = require('./config/env');
const logger = require('./services/logger');
const { initializeRealtimeService } = require('./services/realtimeService');
const redisClient = require('./services/redisClient');

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

async function gracefulShutdown(server, realtimeService) {
  logger.info('graceful_shutdown_start');
  server.close(async () => {
    logger.info('express_server_closed');
    if (realtimeService) {
      // Close WebSocket connections gracefully
      const io = realtimeService.getIO();
      if (io) {
        io.close();
      }
    }
    await prisma.$disconnect();
    await redisClient.quit();
    logger.info('resources_disconnected');
    process.exit(0);
  });
}

try {
  validateEnv();

  const server = http.createServer(app);
  const realtimeService = initializeRealtimeService(server);

  server.listen(PORT, () => {
    logger.info('server_started', { port: PORT });
  });

  process.on('SIGINT', () => gracefulShutdown(server, realtimeService));
  process.on('SIGTERM', () => gracefulShutdown(server, realtimeService));
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', { reason });
  });
  process.on('uncaughtException', (err) => {
    logger.error('uncaught_exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
} catch (error) {
  logger.error('server_start_failed', { message: error.message });
  process.exit(1);
}
