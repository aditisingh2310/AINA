const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('aina-api'),
  JWT_AUDIENCE: z.string().default('aina-mobile'),
  CORS_ORIGIN: z.string().default('http://localhost:8081,http://localhost:19006'),
  SENTRY_DSN: z.string().optional().or(z.literal('')),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors
      .map((item) => `${item.path.join('.')} ${item.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  Object.assign(process.env, result.data);
}

module.exports = { validateEnv };
