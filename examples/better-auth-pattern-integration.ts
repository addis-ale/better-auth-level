/**
 * Better Auth Pattern Integration Example
 * 
 * This shows how to integrate the monitoring plugin following Better Auth's pattern
 * where the developer provides their own email function.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Developer's email service (using their preferred provider)
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
  // This could be Resend, SendGrid, AWS SES, Nodemailer, etc.
  console.log(`📧 Sending email to ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Description: ${meta.description}`);
  if (meta.link) console.log(`   Link: ${meta.link}`);
  if (meta.reason) console.log(`   Reason: ${meta.reason}`);
  if (meta.ip) console.log(`   IP: ${meta.ip}`);
  if (meta.timestamp) console.log(`   Time: ${meta.timestamp}`);
  
  // In a real implementation, you would call your email service:
  // await resend.emails.send({ to, subject, html: generateHTML(meta) });
  // await sgMail.send({ to, subject, html: generateHTML(meta) });
  // await sesClient.send(new SendEmailCommand({ ... }));
};

// Better Auth configuration following Better Auth's pattern
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
  
  // Add the monitoring plugin with the same email function
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

// Example usage in your application
export const exampleUsage = {
  // When you want to manually trigger security actions
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
  }
};
