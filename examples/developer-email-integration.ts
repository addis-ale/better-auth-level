/**
 * Developer Email Integration Example
 * 
 * This shows how developers should integrate their email provider
 * following Better Auth's pattern.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// ========================================
// DEVELOPER'S EMAIL SERVICE SETUP
// ========================================

// Option 1: Using Resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Option 2: Using SendGrid
// import sgMail from '@sendgrid/mail';
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Option 3: Using AWS SES
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
// const sesClient = new SESClient({ region: process.env.AWS_REGION });

// Option 4: Using Nodemailer
// import nodemailer from 'nodemailer';
// const transporter = nodemailer.createTransporter({ /* your config */ });

// ========================================
// DEVELOPER'S EMAIL FUNCTION
// ========================================

// This is the function the developer provides - same pattern as Better Auth
const SendEmailAction = async ({ to, subject, meta }: {
  to: string;
  subject: string;
  meta: {
    description: string;
    link?: string;
    reason?: string;
    ip?: string;
    timestamp?: string;
  };
}) => {
  // Developer implements their email service here
  // This is where they use their preferred email provider
  
  try {
    // Example with Resend
    await resend.emails.send({
      from: 'Security Alerts <security@yourapp.com>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Security Alert</h2>
          <p>${meta.description}</p>
          ${meta.link ? `<p><a href="${meta.link}">Click here to take action</a></p>` : ''}
          ${meta.reason ? `<p><strong>Reason:</strong> ${meta.reason}</p>` : ''}
          ${meta.ip ? `<p><strong>IP Address:</strong> ${meta.ip}</p>` : ''}
          ${meta.timestamp ? `<p><strong>Time:</strong> ${meta.timestamp}</p>` : ''}
        </div>
      `,
      text: `${meta.description}${meta.link ? `\n\nLink: ${meta.link}` : ''}${meta.reason ? `\n\nReason: ${meta.reason}` : ''}`
    });
    
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('📧 Failed to send email:', error);
    throw error;
  }
};

// ========================================
// BETTER AUTH CONFIGURATION
// ========================================

export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!
  },
  
  // Better Auth's built-in email verification
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      const link = new URL(url);
      link.searchParams.set("callbackURL", "/auth/verify");

      await SendEmailAction({
        to: user.email,
        subject: "Verify Your Email",
        meta: {
          description: "Please verify your email to complete registration",
          link: String(link),
        },
      });
    },
  },
  
  // Better Auth's built-in password reset
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      await SendEmailAction({
        to: user.email,
        subject: "Reset Your Password",
        meta: {
          description: "Click the link below to reset your password",
          link: url,
        },
      });
    }
  },
  
  // Better Auth's built-in 2FA
  twoFactor: {
    sendTwoFactorSetupEmail: async ({ user, totpURI, backupCodes }) => {
      await SendEmailAction({
        to: user.email,
        subject: "Set Up Two-Factor Authentication",
        meta: {
          description: "Complete your 2FA setup for enhanced security",
          link: `data:image/svg+xml;base64,${Buffer.from(totpURI).toString('base64')}`,
        },
      });
    }
  },
  
  // Add the monitoring plugin with the SAME email function
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 5,
      enableFailedLoginMonitoring: true,
      securityActions: {
        enable2FAEnforcement: true,
        enablePasswordResetEnforcement: true,
        // Developer provides their email function - same as Better Auth's pattern
        sendEmail: async (notification) => {
          await SendEmailAction({
            to: notification.to,
            subject: notification.subject,
            meta: {
              description: notification.data.reason || 'Security notification',
              link: notification.data.resetUrl,
              reason: notification.data.reason,
              ip: notification.data.ip,
              timestamp: notification.data.timestamp,
            },
          });
        }
      }
    })
  ]
});

// ========================================
// USAGE EXAMPLES
// ========================================

export const usageExamples = {
  // Manual security action trigger
  async triggerSecurityAction(userId: string, actionType: string, reason: string) {
    const response = await fetch('/api/auth/monitor/trigger-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        actionType,
        reason,
        ip: '192.168.1.100'
      })
    });
    
    return response.json();
  },
  
  // Get monitoring statistics
  async getMonitoringStats() {
    const response = await fetch('/api/auth/monitor/stats');
    return response.json();
  },
  
  // Get user security actions
  async getUserSecurityActions(userId: string) {
    const response = await fetch(`/api/auth/monitor/user-actions?userId=${userId}`);
    return response.json();
  }
};

// ========================================
// ENVIRONMENT VARIABLES NEEDED
// ========================================

/*
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# For Resend
RESEND_API_KEY=re_xxxxxxxxx

# For SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxx

# For AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxx

# For SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
*/
