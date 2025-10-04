/**
 * Real-World Integration Example
 * 
 * This shows how to use the Better Auth Monitor plugin alongside
 * Better Auth's built-in 2FA and password reset features.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Email service integration (example with Resend)
const sendEmail = async (notification: any) => {
  // In a real app, integrate with your email service
  console.log(`📧 Sending ${notification.template} email to ${notification.to}`);
  console.log(`   Subject: ${notification.subject}`);
  
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'security@yourapp.com',
  //   to: notification.to,
  //   subject: notification.subject,
  //   html: generateEmailHTML(notification.template, notification.data),
  //   text: generateEmailText(notification.template, notification.data)
  // });
};

// Better Auth configuration with built-in features + monitoring
export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!
  },
  
  // Better Auth's built-in email/password authentication
  emailAndPassword: {
    enabled: true,
    // Better Auth's built-in password reset
    async sendResetPassword({ user, url, token }, request) {
      console.log(`🔐 Better Auth: Triggering password reset for ${user.email}`);
      
      // Send the reset email using your email service
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
  
  // Better Auth's built-in 2FA
  twoFactor: {
    // Better Auth's built-in 2FA setup
    async sendTwoFactorSetupEmail({ user, totpURI, backupCodes }, request) {
      console.log(`🔒 Better Auth: Triggering 2FA setup for ${user.email}`);
      
      // Send the 2FA setup email using your email service
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
  
  // Add the monitoring plugin
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
        sendEmail: sendEmail,              // Use the same email function
        
        // Custom email templates
        twoFactorEmailTemplate: (data) => ({
          subject: `Security Alert: Enable Two-Factor Authentication`,
          html: `
            <h2>Security Alert</h2>
            <p>Hello ${data.userName},</p>
            <p>We detected suspicious activity on your account and recommend enabling two-factor authentication for enhanced security.</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
            <p><strong>IP Address:</strong> ${data.ip}</p>
            <p><strong>Time:</strong> ${data.timestamp}</p>
            <p>Please log in to your account and enable 2FA in your security settings.</p>
            <a href="https://yourapp.com/settings/security">Enable 2FA</a>
          `,
          text: `Security Alert: Enable 2FA\n\nHello ${data.userName},\n\nWe detected suspicious activity. Please enable 2FA.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}\n\nEnable 2FA: https://yourapp.com/settings/security`
        }),
        
        passwordResetEmailTemplate: (data) => ({
          subject: `Security Alert: Reset Your Password`,
          html: `
            <h2>Security Alert</h2>
            <p>Hello ${data.userName},</p>
            <p>We detected suspicious activity on your account and recommend resetting your password immediately.</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
            <p><strong>IP Address:</strong> ${data.ip}</p>
            <p><strong>Time:</strong> ${data.timestamp}</p>
            <p>Please click the link below to reset your password:</p>
            <a href="https://yourapp.com/reset-password">Reset Password</a>
          `,
          text: `Security Alert: Reset Password\n\nHello ${data.userName},\n\nWe detected suspicious activity. Please reset your password.\n\nReason: ${data.reason}\nIP: ${data.ip}\nTime: ${data.timestamp}\n\nReset: https://yourapp.com/reset-password`
        })
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
        
        // In production, you might want to send this to a logging service
        // await sendToLoggingService(event);
      }
    })
  ]
});

// Example usage in your application
export const securityActions = {
  // When you detect suspicious activity, trigger security actions
  async handleSuspiciousActivity(userId: string, ip: string, reason: string) {
    console.log(`🚨 Handling suspicious activity for ${userId}`);
    
    try {
      // Trigger 2FA enforcement via the monitoring plugin
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
      
      const result = await response.json();
      console.log('2FA enforcement result:', result);
      
      // Also trigger password reset
      const resetResponse = await fetch('/api/auth/monitor/trigger-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          actionType: 'reset_password',
          reason,
          ip
        })
      });
      
      const resetResult = await resetResponse.json();
      console.log('Password reset result:', resetResult);
      
    } catch (error) {
      console.error('Failed to trigger security actions:', error);
    }
  },
  
  // Get security statistics
  async getSecurityStats() {
    try {
      const response = await fetch('/api/auth/monitor/stats');
      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('Failed to get security stats:', error);
      return null;
    }
  },
  
  // Get user's security actions
  async getUserSecurityActions(userId: string) {
    try {
      const response = await fetch(`/api/auth/monitor/user-actions?userId=${userId}`);
      const actions = await response.json();
      return actions;
    } catch (error) {
      console.error('Failed to get user security actions:', error);
      return null;
    }
  }
};

// Example: How to use Better Auth's built-in features
export const betterAuthFeatures = {
  // Enable 2FA for a user (using Better Auth's built-in feature)
  async enable2FA(userId: string, password: string) {
    try {
      const result = await auth.api.enableTwoFactor({
        body: { password }
      });
      return result;
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  },
  
  // Request password reset (using Better Auth's built-in feature)
  async requestPasswordReset(email: string) {
    try {
      const result = await auth.api.requestPasswordReset({
        body: { email }
      });
      return result;
    } catch (error) {
      console.error('Failed to request password reset:', error);
      throw error;
    }
  },
  
  // Reset password (using Better Auth's built-in feature)
  async resetPassword(token: string, newPassword: string) {
    try {
      const result = await auth.api.resetPassword({
        body: { token, newPassword }
      });
      return result;
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  }
};
