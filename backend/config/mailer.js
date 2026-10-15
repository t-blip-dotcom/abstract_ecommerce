const nodemailer = require('nodemailer');
const crypto = require('crypto');

const port = Number(process.env.MAIL_PORT) || 465;
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// The random token goes in the email. Only its scrambled copy (hash) is saved in the database.
function newToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.MAIL_USER, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email failed:', err.message);
    return false;
  }
}

function sendPasswordResetEmail({ to, name, token, kind }) {
  const link = `${APP_URL}/pages/reset-password.html?token=${token}&type=${kind}`;
  return sendMail(to, 'Reset your password', `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2>Abstract Cosmetics</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to choose a new password. It expires in 1 hour.</p>
      <p><a href="${link}">Reset my password</a></p>
      <p>If this wasn't you, ignore this email.</p>
    </div>`);
}

module.exports = { newToken, hashToken, sendPasswordResetEmail };