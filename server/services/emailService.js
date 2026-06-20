const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Zalnio'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed to ${to}: ${error.message}`);
    throw error;
  }
};

const sendOtpEmail = async (email, otp, purpose = 'verification') => {
  const subjects = {
    verification: 'Verify your email address',
    login: 'Login OTP',
    password_reset: 'Password reset OTP',
    seller_kyc: 'Seller KYC verification OTP',
    phone_verification: 'Phone number verification OTP',
  };

  const subject = subjects[purpose] || subjects.verification;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${process.env.APP_NAME || 'Zalnio'}</h2>
      <p>Your OTP for ${subject.toLowerCase()} is:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2563eb;">
        ${otp}
      </div>
      <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 10 minutes.</p>
      <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to ${process.env.APP_NAME || 'Zalnio'}!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully. Start exploring thousands of educational resources.</p>
      <a href="${process.env.CLIENT_URL}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Start Learning</a>
    </div>
  `;
  return sendEmail({ to: email, subject: `Welcome to ${process.env.APP_NAME || 'Zalnio'}!`, html });
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Reset your password</h2>
      <p>Click the link below to reset your password. This link is valid for 10 minutes.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Reset Password</a>
      <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Password Reset Request', html });
};

const sendSellerApprovalEmail = async (email, name, status, reason = '') => {
  const isApproved = status === 'approved';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'};">
        Seller ${isApproved ? 'Approved' : 'Update'}
      </h2>
      <p>Hi ${name},</p>
      <p>Your seller account has been <strong>${status}</strong>.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
      ${isApproved ? `<a href="${process.env.CLIENT_URL}/seller" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Go to Dashboard</a>` : ''}
    </div>
  `;
  return sendEmail({ to: email, subject: `Seller Account ${isApproved ? 'Approved' : 'Update'}`, html });
};

module.exports = { sendEmail, sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail, sendSellerApprovalEmail };
