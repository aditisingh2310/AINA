const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { register, login, refreshToken, logout } = require('../controllers/authController');

jest.mock('@prisma/client', () => {
  const data = { users: [], refreshTokens: [] };

  class PrismaClient {
    constructor() {
      this.user = {
        findUnique: jest.fn(async ({ where }) => data.users.find((u) => u.email === where.email)),
        create: jest.fn(async ({ data: body }) => {
          const user = { id: crypto.randomUUID(), ...body, createdAt: new Date() };
          data.users.push(user);
          return user;
        }),
      };
      this.refreshToken = {
        create: jest.fn(async ({ data: body }) => {
          const token = { id: crypto.randomUUID(), ...body };
          data.refreshTokens.push(token);
          return token;
        }),
        findUnique: jest.fn(async ({ where }) =>
          data.refreshTokens.find((t) => t.tokenHash === where.tokenHash)
        ),
        update: jest.fn(async ({ where, data: body }) => {
          const token = data.refreshTokens.find((t) => t.id === where.id);
          Object.assign(token, body);
          return token;
        }),
        updateMany: jest.fn(async ({ where, data: body }) => {
          const found = data.refreshTokens.filter((t) => t.tokenHash === where.tokenHash);
          found.forEach((token) => Object.assign(token, body));
          return { count: found.length };
        }),
      };
    }
  }

  return { PrismaClient };
});

describe('Auth controller', () => {
  const req = { body: {} };
  const res = {
    status: jest.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function (body) {
      this.body = body;
      return this;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req.body = {};
    res.statusCode = 200;
    res.body = undefined;
  });

  it('registers a new user and returns tokens', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };
    await register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('logs in existing user and returns tokens', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };
    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('refreshes token with valid refresh token', async () => {
    req.body = {
      refreshToken:
        'dummy-refresh-token-000000000000000000000000000000000000000000000000000000000000',
    };

    // base64-style; produce hashed token to match storage
    const hash = crypto.createHash('sha256').update(req.body.refreshToken).digest('hex');
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    await db.refreshToken.create({
      data: { userId: 'x', tokenHash: hash, expiresAt: new Date(Date.now() + 10000000) },
    });

    await refreshToken(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('logs out and revokes token', async () => {
    req.body = {
      refreshToken: 'logout-refresh-token-000000000000000000000000000000000000000000000000000000',
    };
    const hash = crypto.createHash('sha256').update(req.body.refreshToken).digest('hex');
    const db = new (require('@prisma/client').PrismaClient)();
    await db.refreshToken.create({
      data: { userId: 'x', tokenHash: hash, expiresAt: new Date(Date.now() + 10000000) },
    });

    await logout(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Logged out');
  });
});
