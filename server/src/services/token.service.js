'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../config/env');
const prisma = require('../config/database');

/**
 * Sign a short-lived access token (15m default).
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });

/**
 * Sign a long-lived refresh token (7d default).
 */
const signRefreshToken = () =>
  jwt.sign({ jti: uuidv4() }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

/**
 * Verify an access token. Throws if invalid or expired.
 */
const verifyAccessToken = (token) => jwt.verify(token, JWT_ACCESS_SECRET);

/**
 * Verify a refresh token. Throws if invalid or expired.
 */
const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

/**
 * Hash a token for storage.
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Persist a refresh token in the DB for rotation + revocation.
 */
const createSession = async (userId, refreshToken, { userAgent, ipAddress } = {}) => {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  return prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: new Date(Date.now() + SEVEN_DAYS),
      lastUsedAt: new Date(),
    },
  });
};

/**
 * Delete a session by refresh token (logout).
 */
const deleteSession = async (refreshToken) => {
  try {
    await prisma.session.delete({ where: { tokenHash: hashToken(refreshToken) } });
  } catch {
    // Already deleted — no-op
  }
};

/**
 * Find a valid (non-expired) session.
 */
const findSession = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  
  if (session) {
    // Update last used time asynchronously
    prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});
  }
  
  return session;
};

/**
 * Rotate refresh token: delete old, create new.
 */
const rotateRefreshToken = async (oldRefreshToken, userId, meta) => {
  await deleteSession(oldRefreshToken);
  const newRefreshToken = signRefreshToken();
  await createSession(userId, newRefreshToken, meta);
  return newRefreshToken;
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createSession,
  deleteSession,
  findSession,
  rotateRefreshToken,
};
