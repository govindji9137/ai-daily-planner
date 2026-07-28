'use strict';

const authService = require('../services/auth.service');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const setRefreshCookie = (res, token) =>
  res.cookie('refreshToken', token, COOKIE_OPTS);

const clearRefreshCookie = (res) =>
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const user = await authService.signup(req.body);
    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const result = await authService.resendVerification(req.body.email);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    const { accessToken, refreshToken, user } = await authService.login(email, password, meta);

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { accessToken, user } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }
    const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken, meta);

    setRefreshCookie(res, newRefreshToken);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ success: true, data: { id, name, email, role } });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'If that email is registered, a reset link was sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, verifyEmail, resendVerification, login, refresh, logout, me, forgotPassword, resetPassword };
