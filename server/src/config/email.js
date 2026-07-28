'use strict';

const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NODE_ENV } = require('./env');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Lazily initialise the mail transporter.
 * In development with no SMTP config, falls back to Ethereal (fake inbox).
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    // Production / real SMTP
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    logger.info('Email transporter: Production SMTP configured');
  } else {
    // Development: use Ethereal auto-account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info(`Email transporter: Ethereal dev account — ${testAccount.user}`);
    logger.info(`Preview emails at: https://ethereal.email/login  (user: ${testAccount.user} / pass: ${testAccount.pass})`);
  }

  return transporter;
};

module.exports = { getTransporter };
