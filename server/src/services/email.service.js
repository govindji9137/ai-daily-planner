'use strict';

const { getTransporter } = require('../config/email');
const { EMAIL_FROM, CLIENT_URL, NODE_ENV, BREVO_API_KEY } = require('../config/env');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

/**
 * Send an email. Uses Brevo HTTP API if BREVO_API_KEY is present, else falls back to Nodemailer.
 */
const sendMail = async ({ to, subject, html }) => {
  // Use native Brevo API if key is present
  if (BREVO_API_KEY) {
    try {
      // Extract just the email if EMAIL_FROM is formatted like "Name <email@domain.com>"
      const emailMatch = EMAIL_FROM.match(/<([^>]+)>/);
      const senderEmail = emailMatch ? emailMatch[1] : EMAIL_FROM;
      const senderName = EMAIL_FROM.split('<')[0].trim().replace(/"/g, '') || 'AI Planner';

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      logger.info(`📧 Email sent to ${to} via Brevo API`);
      return await response.json();
    } catch (err) {
      logger.error(`❌ Brevo API Email Error: ${err.message}`);
      throw err;
    }
  }

  // Fallback to existing Nodemailer setup (Ethereal or SMTP)
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (NODE_ENV !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`📧 Email preview URL: ${previewUrl}`);
    }
  }

  return info;
};

/**
 * Send the email verification email.
 */
const sendVerificationEmail = async ({ name, email, token }) => {
  const link = `${CLIENT_URL}/verify-email?token=${token}`;
  return sendMail({
    to: email,
    subject: 'Verify your AI Planner account',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0f0f13;color:#fff;border-radius:16px;padding:40px;">
        <h1 style="color:#8a2be2;margin-bottom:8px;">AI Planner</h1>
        <h2>Welcome, ${name}! 👋</h2>
        <p style="color:#a0a0b0;">Click the button below to verify your email address, or enter the 6-digit code if you are on another device.</p>
        
        <div style="margin:24px 0;padding:16px;background:rgba(255,255,255,0.05);border:1px dashed #8a2be2;border-radius:8px;text-align:center;">
          <p style="color:#8a2be2;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Your Verification Code</p>
          <h2 style="color:#fff;font-size:36px;letter-spacing:8px;margin:0;">${token}</h2>
        </div>

        <a href="${link}" style="display:inline-block;margin:12px 0 24px 0;padding:14px 28px;background:linear-gradient(135deg,#8a2be2,#6a1b9a);color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Verify Email Automatically
        </a>
        <p style="color:#a0a0b0;font-size:13px;">This code expires in 24 hours. If you did not create an account, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send the password reset email.
 */
const sendPasswordResetEmail = async ({ name, email, token }) => {
  const link = `${CLIENT_URL}/reset-password?token=${token}`;
  return sendMail({
    to: email,
    subject: 'Reset your AI Planner password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0f0f13;color:#fff;border-radius:16px;padding:40px;">
        <h1 style="color:#8a2be2;margin-bottom:8px;">AI Planner</h1>
        <h2>Password Reset Request</h2>
        <p style="color:#a0a0b0;">Hi ${name}, we received a request to reset your password.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:linear-gradient(135deg,#8a2be2,#6a1b9a);color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Reset Password
        </a>
        <p style="color:#a0a0b0;font-size:13px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
        <hr style="border-color:#222;margin:30px 0;">
        <p style="color:#555;font-size:12px;">Or copy this link: ${link}</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
