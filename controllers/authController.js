const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

function buildAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: process.env.JWT_ISSUER || 'aina-api',
    audience: process.env.JWT_AUDIENCE || 'aina-mobile',
  });
}

function getMsFromDuration(duration) {
  if (!duration) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(duration, 10);
  if (Number.isNaN(value)) return 7 * 24 * 60 * 60 * 1000;

  if (duration.endsWith('d')) return value * 24 * 60 * 60 * 1000;
  if (duration.endsWith('h')) return value * 60 * 60 * 1000;
  if (duration.endsWith('m')) return value * 60 * 1000;
  return value;
}

function buildRefreshToken(userId) {
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expirationMs = getMsFromDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
  const expiresAt = new Date(Date.now() + expirationMs);
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  return { refreshToken, hash, expiresAt };
}

function buildToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'aina-api',
    audience: process.env.JWT_AUDIENCE || 'aina-mobile',
  });
}

exports.register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409);
    throw new Error('User already exists');
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, password: hash } });

  const accessToken = buildAccessToken(user.id);
  const { refreshToken, hash: refreshHash, expiresAt } = buildRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: refreshHash, expiresAt },
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    token: accessToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshToken,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const accessToken = buildAccessToken(user.id);
  const { refreshToken, hash, expiresAt } = buildRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    },
  });

  res.json({
    token: accessToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshToken,
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400);
    throw new Error('refreshToken is required');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const tokenRecord = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!tokenRecord || tokenRecord.revoked || new Date(tokenRecord.expiresAt) < new Date()) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }

  await prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revoked: true } });
  const newAccessToken = buildAccessToken(tokenRecord.userId);
  const newRefresh = buildRefreshToken(tokenRecord.userId);

  await prisma.refreshToken.create({
    data: {
      userId: tokenRecord.userId,
      tokenHash: newRefresh.hash,
      expiresAt: newRefresh.expiresAt,
    },
  });

  res.json({
    token: newAccessToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshToken: newRefresh.refreshToken,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'refreshToken required' });
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });

  res.json({ message: 'Logged out' });
});
