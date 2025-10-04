/**
 * Security Actions Example
 * 
 * This example shows how to use the enhanced Better Auth Monitor plugin
 * with 2FA enforcement and password reset functionality.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Email sending function (integrate with your email service)
const sendEmail = async (notification: any) => {
  console.log(`📧 Sending email to ${notification.to}`);
  console.log(`   Subject: ${notification.subject}`);
  console.log(`   Template: ${notification.template}`);
  console.log(`   Data:`, notification.data);
  
  // In a real implementation, you would integrate with:
  // - SendGrid, Resend, AWS SES, etc.
  // Example:
  // await emailService.send({
  //   to: notification.to,
  //   subject: notification.subject,
  //   html: generateEmailHTML(notification.template, notification.data),
  //   text: generateEmailText(notification.template, notification.data)
  // });
};

// Email templates
const emailTemplates = {
  twoFactorEmailTemplate: (data: any) => ({
    subject: `Security Alert: Enable Two-Factor Authentication`,
    html: `
      <h2>Security Alert</h2>
      <p>Hello ${data.userName},</p>
      <p>We detected suspicious activity on your account and recommend enabling two-factor authentication for enhanced security.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p><strong>IP Address:</strong> ${data.ip}</p>
      <p><strong>Time:</strong> ${data.timestamp}</p>
      <p>Please log in to your account and enable 2FA in your security settings.</p>
    `,
    text: `Security Alert: Enable 2FA\n\nHello ${data.userName},\n\nWe detected suspicious activity on your account. Please enable 2FA.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}`
  }),

  passwordResetEmailTemplate: (data: any) => ({
    subject: `Security Alert: Reset Your Password`,
    html: `
      <h2>Security Alert</h2>
      <p>Hello ${data.userName},</p>
      <p>We detected suspicious activity on your account and recommend resetting your password immediately.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p><strong>IP Address:</strong> ${data.ip}</p>
      <p><strong>Time:</strong> ${data.timestamp}</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${data.resetUrl || 'https://yourapp.com/reset-password'}">Reset Password</a>
    `,
    text: `Security Alert: Reset Password\n\nHello ${data.userName},\n\nWe detected suspicious activity. Please reset your password.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}\n\nReset: ${data.resetUrl || 'https://yourapp.com/reset-password'}`
  }),

  securityAlertEmailTemplate: (data: any) => ({
    subject: `Security Alert: Suspicious Activity Detected`,
    html: `
      <h2>Security Alert</h2>
      <p>Hello ${data.userName},</p>
      <p>We detected suspicious activity on your account.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p><strong>IP Address:</strong> ${data.ip}</p>
      <p><strong>Time:</strong> ${data.timestamp}</p>
      <p>If this wasn't you, please secure your account immediately.</p>
    `,
    text: `Security Alert\n\nHello ${data.userName},\n\nSuspicious activity detected.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}`
  })
};

// Better Auth configuration with enhanced monitoring
export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!
  },
  emailAndPassword: {
    enabled: true,
    // Configure Better Auth's built-in password reset
    async sendResetPassword({ user, url, token }, request) {
      await sendEmail({
        to: user.email,
        subject: "Reset Your Password",
        template: "password_reset",
        data: {
          userName: user.name || user.email,
          resetUrl: url,
          reason: "Password reset requested",
          ip: request?.headers.get('x-forwarded-for') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    }
  },
  twoFactor: {
    // Configure Better Auth's built-in 2FA
    async sendTwoFactorSetupEmail({ user, totpURI, backupCodes }, request) {
      await sendEmail({
        to: user.email,
        subject: "Set Up Two-Factor Authentication",
        template: "2fa_setup",
        data: {
          userName: user.name || user.email,
          totpUri: totpURI,
          backupCodes: backupCodes,
          reason: "2FA setup requested",
          ip: request?.headers.get('x-forwarded-for') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    }
  },
  plugins: [
    betterAuthMonitor({
      // Basic monitoring configuration
      failedLoginThreshold: 3,     // Alert after 3 failed attempts
      failedLoginWindow: 5,        // Within 5 minutes
      enableFailedLoginMonitoring: true,
      
      // Security actions configuration
      securityActions: {
        enable2FAEnforcement: true,        // Enable 2FA enforcement
        enablePasswordResetEnforcement: true, // Enable password reset enforcement
        sendEmail: sendEmail,              // Custom email function
        twoFactorEmailTemplate: emailTemplates.twoFactorEmailTemplate,
        passwordResetEmailTemplate: emailTemplates.passwordResetEmailTemplate,
        securityAlertEmailTemplate: emailTemplates.securityAlertEmailTemplate,
      },
      
      // Custom logger
      logger: (event) => {
        console.log(`🚨 SECURITY EVENT: ${event.type}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Time: ${event.timestamp}`);
        if (event.action) {
          console.log(`   Action: ${event.action.type}`);
          console.log(`   Reason: ${event.action.reason}`);
        }
      }
    })
  ]
});

// Example: Manual security action triggers (for developers)
export const triggerSecurityActions = {
  // Trigger 2FA enforcement for a user
  async enable2FA(userId: string, reason: string, ip: string = 'unknown') {
    const response = await fetch('/api/auth/monitor/trigger-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        actionType: 'enable_2fa',
        reason,
        ip
      })
    });
    return response.json();
  },

  // Trigger password reset for a user
  async resetPassword(userId: string, reason: string, ip: string = 'unknown') {
    const response = await fetch('/api/auth/monitor/trigger-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        actionType: 'reset_password',
        reason,
        ip
      })
    });
    return response.json();
  },

  // Send security alert
  async sendSecurityAlert(userId: string, reason: string, ip: string = 'unknown') {
    const response = await fetch('/api/auth/monitor/trigger-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        actionType: 'security_alert',
        reason,
        ip
      })
    });
    return response.json();
  },

  // Get user's security actions
  async getUserActions(userId: string) {
    const response = await fetch(`/api/auth/monitor/user-actions?userId=${userId}`);
    return response.json();
  },

  // Get monitoring statistics
  async getStats() {
    const response = await fetch('/api/auth/monitor/stats');
    return response.json();
  }
};

// Example usage in your application
export const exampleUsage = {
  // When you detect suspicious activity
  async handleSuspiciousActivity(userId: string, ip: string) {
    console.log('🚨 Suspicious activity detected, triggering security actions...');
    
    // Trigger 2FA enforcement
    await triggerSecurityActions.enable2FA(
      userId, 
      'Suspicious login pattern detected', 
      ip
    );
    
    // Send security alert
    await triggerSecurityActions.sendSecurityAlert(
      userId, 
      'Multiple failed login attempts from unusual location', 
      ip
    );
  },

  // When you want to force password reset
  async forcePasswordReset(userId: string, ip: string) {
    console.log('🔒 Forcing password reset for user...');
    
    await triggerSecurityActions.resetPassword(
      userId, 
      'Account security compromised - password reset required', 
      ip
    );
  }
};
