/**
 * Resend Email Integration Example
 * 
 * This shows how to integrate the monitoring plugin with Resend email service
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const emailTemplates = {
  twoFactorEmailTemplate: (data: any) => ({
    subject: `Security Alert: Enable Two-Factor Authentication`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🔒 Security Alert</h2>
        <p>Hello ${data.userName},</p>
        <p>We detected suspicious activity on your account and recommend enabling two-factor authentication for enhanced security.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Security Details:</h3>
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p><strong>IP Address:</strong> ${data.ip}</p>
          <p><strong>Time:</strong> ${data.timestamp}</p>
        </div>
        
        <p>Please log in to your account and enable 2FA in your security settings:</p>
        <a href="https://yourapp.com/settings/security" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Enable Two-Factor Authentication
        </a>
        
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          If you didn't perform this action, please contact our support team immediately.
        </p>
      </div>
    `,
    text: `Security Alert: Enable 2FA\n\nHello ${data.userName},\n\nWe detected suspicious activity. Please enable 2FA.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}\n\nEnable 2FA: https://yourapp.com/settings/security`
  }),

  passwordResetEmailTemplate: (data: any) => ({
    subject: `Security Alert: Reset Your Password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🔐 Security Alert</h2>
        <p>Hello ${data.userName},</p>
        <p>We detected suspicious activity on your account and recommend resetting your password immediately.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Security Details:</h3>
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p><strong>IP Address:</strong> ${data.ip}</p>
          <p><strong>Time:</strong> ${data.timestamp}</p>
        </div>
        
        <p>Please click the link below to reset your password:</p>
        <a href="https://yourapp.com/reset-password" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Your Password
        </a>
        
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          If you didn't perform this action, please contact our support team immediately.
        </p>
      </div>
    `,
    text: `Security Alert: Reset Password\n\nHello ${data.userName},\n\nWe detected suspicious activity. Please reset your password.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}\n\nReset: https://yourapp.com/reset-password`
  }),

  securityAlertEmailTemplate: (data: any) => ({
    subject: `Security Alert: Suspicious Activity Detected`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Security Alert</h2>
        <p>Hello ${data.userName},</p>
        <p>We detected suspicious activity on your account.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Activity Details:</h3>
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p><strong>IP Address:</strong> ${data.ip}</p>
          <p><strong>Time:</strong> ${data.timestamp}</p>
        </div>
        
        <p>If this wasn't you, please secure your account immediately by:</p>
        <ul>
          <li>Changing your password</li>
          <li>Enabling two-factor authentication</li>
          <li>Reviewing your account activity</li>
        </ul>
        
        <a href="https://yourapp.com/settings/security" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Secure Your Account
        </a>
      </div>
    `,
    text: `Security Alert\n\nHello ${data.userName},\n\nSuspicious activity detected.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}\n\nSecure your account: https://yourapp.com/settings/security`
  })
};

// Email sending function using Resend
const sendEmail = async (notification: any) => {
  try {
    const template = emailTemplates[notification.template as keyof typeof emailTemplates];
    const emailContent = template(notification.data);
    
    const result = await resend.emails.send({
      from: 'Security Alerts <security@yourapp.com>',
      to: [notification.to],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
    
    console.log('📧 Email sent successfully:', result.data?.id);
    return result;
  } catch (error) {
    console.error('📧 Failed to send email:', error);
    throw error;
  }
};

// Better Auth configuration with Resend integration
export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!
  },
  emailAndPassword: {
    enabled: true,
    // Better Auth's built-in password reset
    async sendResetPassword({ user, url, token }, request) {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        template: 'password_reset',
        data: {
          userName: user.name || user.email,
          resetUrl: url,
          reason: 'Password reset requested',
          ip: request?.headers.get('x-forwarded-for') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    }
  },
  twoFactor: {
    // Better Auth's built-in 2FA
    async sendTwoFactorSetupEmail({ user, totpURI, backupCodes }, request) {
      await sendEmail({
        to: user.email,
        subject: 'Set Up Two-Factor Authentication',
        template: '2fa_setup',
        data: {
          userName: user.name || user.email,
          totpUri: totpURI,
          backupCodes: backupCodes,
          reason: '2FA setup requested',
          ip: request?.headers.get('x-forwarded-for') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    }
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 5,
      enableFailedLoginMonitoring: true,
      securityActions: {
        enable2FAEnforcement: true,
        enablePasswordResetEnforcement: true,
        sendEmail: sendEmail, // Use Resend integration
        twoFactorEmailTemplate: emailTemplates.twoFactorEmailTemplate,
        passwordResetEmailTemplate: emailTemplates.passwordResetEmailTemplate,
        securityAlertEmailTemplate: emailTemplates.securityAlertEmailTemplate,
      },
      logger: (event) => {
        console.log(`🚨 SECURITY EVENT: ${event.type} for ${event.userId}`);
      }
    })
  ]
});
