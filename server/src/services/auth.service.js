'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const tokenService = require('./token.service');
const emailService = require('./email.service');

const BCRYPT_ROUNDS = 12;
const VERIFY_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

// ─── Helpers ───────────────────────────────────────────────────────────────

// Generate a 6-digit numeric OTP (easy to type across devices)
const generateToken = () => Math.floor(100000 + Math.random() * 900000).toString();

const addHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

// ─── Service Functions ─────────────────────────────────────────────────────

/**
 * Register a new user.
 * Throws if email already exists.
 */
const signup = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const rawToken = generateToken();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      verificationTokens: {
        create: {
          tokenHash,
          expiresAt: addHours(VERIFY_TOKEN_EXPIRY_HOURS),
        }
      }
    },
  });

  await emailService.sendVerificationEmail({ name: user.name, email: user.email, token: rawToken });

  return { id: user.id, name: user.name, email: user.email };
};

/**
 * Verify email using the token from the email link.
 */
const verifyEmail = async (rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!verificationToken || verificationToken.usedAt) {
    const err = new Error('Invalid or already used verification token.');
    err.status = 400;
    throw err;
  }

  const { user } = verificationToken;

  if (user.isVerified) {
    const err = new Error('Email is already verified.');
    err.status = 400;
    throw err;
  }

  if (verificationToken.expiresAt < new Date()) {
    const err = new Error('Verification token has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    })
  ]);

  return { message: 'Email verified successfully.' };
};

/**
 * Resend verification email.
 */
const resendVerification = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Return success even if not found to prevent email enumeration
    return { message: 'If that email is registered and unverified, a new link was sent.' };
  }

  if (user.isVerified) {
    const err = new Error('Email is already verified.');
    err.status = 400;
    throw err;
  }

  const rawToken = generateToken();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: addHours(VERIFY_TOKEN_EXPIRY_HOURS),
    }
  });

  await emailService.sendVerificationEmail({ name: user.name, email: user.email, token: rawToken });

  return { message: 'If that email is registered and unverified, a new link was sent.' };
};

/**
 * Login with email + password.
 * Returns access token and sets refresh token in httpOnly cookie.
 */
const login = async (email, password, meta) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use constant-time compare to prevent timing attacks
  const dummyHash = '$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const hash = user ? user.password : dummyHash;
  const isValid = await bcrypt.compare(password, hash);

  if (!user || !isValid) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  if (!user.isVerified) {
    const err = new Error('Please verify your email before logging in.');
    err.status = 403;
    throw err;
  }

  // Issue tokens
  const accessToken = tokenService.signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = tokenService.signRefreshToken();
  await tokenService.createSession(user.id, refreshToken, meta);

  // Update login stats
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Refresh access token using a valid refresh token.
 * Rotates the refresh token on every use.
 */
const refresh = async (refreshToken, meta) => {
  // Verify signature first
  try {
    tokenService.verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token.');
    err.status = 401;
    throw err;
  }

  const session = await tokenService.findSession(refreshToken);
  if (!session) {
    const err = new Error('Session not found or expired. Please log in again.');
    err.status = 401;
    throw err;
  }

  const { user } = session;
  const newRefreshToken = await tokenService.rotateRefreshToken(refreshToken, user.id, meta);
  const accessToken = tokenService.signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Logout: delete the session.
 */
const logout = async (refreshToken) => {
  if (refreshToken) {
    await tokenService.deleteSession(refreshToken);
  }
};

/**
 * Request a password reset email.
 */
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return;

  const resetToken = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry: addHours(RESET_TOKEN_EXPIRY_HOURS) },
  });

  await emailService.sendPasswordResetEmail({ name: user.name, email: user.email, token: resetToken });
};

/**
 * Reset password using the token from the email link.
 */
const resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findFirst({ where: { resetToken: token } });

  if (!user) {
    const err = new Error('Invalid or expired password reset link.');
    err.status = 400;
    throw err;
  }

  if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
    const err = new Error('Password reset link has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  // Invalidate all existing sessions for security
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return { message: 'Password reset successfully. Please log in with your new password.' };
};

module.exports = {
  signup,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
