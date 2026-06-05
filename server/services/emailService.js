const nodemailer = require('nodemailer');
const env = require('../config/environment');

let transporter = null;

/**
 * Initialize email transporter
 * Uses Ethereal for development (auto-creates test account)
 */
const initTransporter = async () => {
  if (transporter) return transporter;

  if (env.isDev && (!env.smtp.user || !env.smtp.pass)) {
    // Create Ethereal test account for development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('✅ Email: Using Ethereal test account');
      console.log(`   📧 Ethereal inbox: https://ethereal.email/login`);
      console.log(`   📧 User: ${testAccount.user}`);
    } catch (error) {
      // Fallback: log emails to console
      transporter = {
        sendMail: async (options) => {
          console.log('\n📧 ═══════════ EMAIL (Console Fallback) ═══════════');
          console.log(`   To: ${options.to}`);
          console.log(`   Subject: ${options.subject}`);
          console.log(`   Body: ${options.text || 'See HTML'}`);
          console.log('═══════════════════════════════════════════════════\n');
          return { messageId: `console-${Date.now()}` };
        },
      };
      console.log('✅ Email: Using console fallback (Ethereal unavailable)');
    }
  } else {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
    console.log('✅ Email: SMTP transport configured');
  }

  return transporter;
};

/**
 * Send an email
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transport = await initTransporter();

  const mailOptions = {
    from: `"CampusX Guardian" <${env.smtp.from}>`,
    to,
    subject,
    text,
    html,
  };

  const info = await transport.sendMail(mailOptions);

  // Log Ethereal preview URL in development
  if (env.isDev && info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`   📧 Preview: ${previewUrl}`);
    }
  }

  return info;
};

/**
 * Send OTP verification email
 */
const sendOTPEmail = async (email, otp, purpose = 'Email Verification') => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e27; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">🛡️ CampusX Guardian</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">${purpose}</p>
      </div>
      <div style="padding: 40px 30px; text-align: center;">
        <p style="color: #a0a0a0; font-size: 16px; margin-bottom: 30px;">Your verification code is:</p>
        <div style="background: rgba(102, 126, 234, 0.1); border: 2px solid rgba(102, 126, 234, 0.3); border-radius: 12px; padding: 25px; display: inline-block;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #808080; font-size: 13px; margin-top: 30px;">This code expires in <strong style="color: #667eea;">10 minutes</strong>.</p>
        <p style="color: #808080; font-size: 13px;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
        <p style="color: #505050; font-size: 11px; margin: 0;">© 2026 CampusX. Secured by Guardian AI.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[CampusX] Your ${purpose} Code: ${otp}`,
    text: `Your CampusX ${purpose} code is: ${otp}. This code expires in 10 minutes.`,
    html,
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e27; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">🔐 Password Reset</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">CampusX Guardian</p>
      </div>
      <div style="padding: 40px 30px; text-align: center;">
        <p style="color: #a0a0a0; font-size: 16px; margin-bottom: 30px;">Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">Reset Password</a>
        <p style="color: #808080; font-size: 13px; margin-top: 30px;">This link expires in <strong style="color: #f5576c;">15 minutes</strong>.</p>
        <p style="color: #606060; font-size: 12px; margin-top: 15px; word-break: break-all;">Or copy this link: ${resetUrl}</p>
        <p style="color: #808080; font-size: 13px;">If you didn't request this, your account is safe. No action needed.</p>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
        <p style="color: #505050; font-size: 11px; margin: 0;">© 2026 CampusX. Secured by Guardian AI.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '[CampusX] Password Reset Request',
    text: `Reset your CampusX password: ${resetUrl}. This link expires in 15 minutes.`,
    html,
  });
};

/**
 * Send security alert email
 */
const sendSecurityAlertEmail = async (email, alertType, details) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e27; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Security Alert</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">${alertType}</p>
      </div>
      <div style="padding: 40px 30px;">
        <p style="color: #a0a0a0; font-size: 16px;">${details}</p>
        <p style="color: #808080; font-size: 13px; margin-top: 20px;">If this wasn't you, please secure your account immediately by changing your password.</p>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
        <p style="color: #505050; font-size: 11px; margin: 0;">© 2026 CampusX. Secured by Guardian AI.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[CampusX] Security Alert: ${alertType}`,
    text: `Security Alert - ${alertType}: ${details}`,
    html,
  });
};

module.exports = {
  initTransporter,
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
};
