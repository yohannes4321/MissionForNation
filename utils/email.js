const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send invitation email
const sendInvitationEmail = async (email, token, role, regionName) => {
  const transporter = createTransporter();
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const invitationUrl = `${baseUrl}/register?token=${token}`;
  
  const roleText = role === 'super_admin' ? 'Super Admin' : 'Regional Admin';
  const regionText = regionName ? ` for ${regionName}` : '';
  
  const mailOptions = {
    from: `"${process.env.SITE_NAME || 'Regional Admin System'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Invitation to join as ${roleText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're Invited!</h2>
        <p>You have been invited to join as a <strong>${roleText}</strong>${regionText}.</p>
        <p>Click the button below to complete your registration:</p>
        <a href="${invitationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Complete Registration
        </a>
        <p>Or copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
        <p style="color: #999; font-size: 12px;">This invitation will expire in 7 days.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send email verification
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"${process.env.SITE_NAME || 'Regional Admin System'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2196F3; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"${process.env.SITE_NAME || 'Regional Admin System'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #FF9800; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email
const sendNotificationEmail = async (email, subject, message) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.SITE_NAME || 'Regional Admin System'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subject}</h2>
        <p>${message}</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvitationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};