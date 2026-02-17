const nodemailer = require('nodemailer');

const config = require('../config/env');

const {
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USER,
  pass: SMTP_PASS,
} = config.email.smtp;

const EMAIL_FROM = config.email.from;
const APP_NAME = config.email.appName;
const API_BASE_URL = config.urls.apiBase;
const APP_BASE_URL = config.urls.appBase;

const port = Number(SMTP_PORT);
const secure = port === 465;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure,
  requireTLS: !secure,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const subject = `Verify your email - ${APP_NAME}`;
  const html = `
    <div style="font-family:Arial,sans-serif;">
      <h2>Verify your email for ${APP_NAME}</h2>
      <p>Click the link below to verify your email:</p>
      <p><a href="${verifyUrl}" style="color:#1a73e8;">${verifyUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;
  const text = `Verify your email for ${APP_NAME}\n\n${verifyUrl}\n\nThis link will expire in 24 hours.`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
};

const sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = `Reset your password - ${APP_NAME}`;
  const html = `
    <div style="font-family:Arial,sans-serif;">
      <h2>Reset your password</h2>
      <p>We received a request to reset your password for ${APP_NAME}.</p>
      <p>Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="color:#1a73e8;">${resetUrl}</a></p>
      <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Reset your password for ${APP_NAME}\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
