const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const { collectDefaultMetrics, register, Counter } = require('prom-client');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const swaggerSpec = require('./config/swagger');
const logger = require('./services/logger');
const sanitizeInput = require('./middleware/sanitizeInput');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.set('trust proxy', 1);

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

collectDefaultMetrics();

const requestCounter = new Counter({
  name: 'aina_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

app.use((req, res, next) => {
  res.on('finish', () => {
    requestCounter.labels(req.method, req.path, String(res.statusCode)).inc();
  });
  next();
});

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8081,http://localhost:19006')
  .split(',')
  .map((item) => item.trim());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use(helmet());
app.use(compression());
app.use(apiLimiter);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked for this origin'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// CSRF protection for state-changing requests only (skip for API tokens)
const csrfProtection = csrf({ cookie: false });
app.use((req, res, next) => {
  // Skip CSRF for API requests with JWT
  if (req.headers.authorization) {
    return next();
  }
  csrfProtection(req, res, next);
});

app.use((req, res, next) => {
  res.set('X-CSRF-Token', req.csrfToken ? req.csrfToken() : '');
  next();
});

app.use((req, res, next) => {
  logger.info('incoming_request', { method: req.method, url: req.originalUrl, ip: req.ip });
  next();
});

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'aina-api', uptime: process.uptime() })
);
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', require('./routes/authRoutes'));
app.use('/incident', require('./routes/incidentRoutes'));
app.use('/contacts', require('./routes/contactRoutes'));
app.use('/sos', require('./routes/sosRoutes'));
app.use('/report', require('./routes/reportRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/ai', require('./routes/aiRoutes'));
app.use('/incidents', require('./routes/incidentsRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

module.exports = app;
