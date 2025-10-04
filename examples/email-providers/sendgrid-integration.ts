/**
 * SendGrid Email Integration Example
 * 
 * This shows how to integrate the monitoring plugin with SendGrid email service
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Email sending function using SendGrid
const sendEmail = async (notification: any) => {
  try {
    const msg = {
      to: notification.to,
      from: 'security@yourapp.com',
      subject: notification.subject,
      text: notification.data.reason,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Security Alert</h2>
          <p>Hello ${notification.data.userName},</p>
          <p>${notification.data.reason}</p>
          <p><strong>IP Address:</strong> ${notification.data.ip}</p>
          <p><strong>Time:</strong> ${notification.data.timestamp}</p>
        </div>
      `,
    };
    
    const result = await sgMail.send(msg);
    console.log('📧 Email sent successfully via SendGrid');
    return result;
  } catch (error) {
    console.error('📧 Failed to send email via SendGrid:', error);
    throw error;
  }
};

// Better Auth configuration with SendGrid integration
export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 5,
      enableFailedLoginMonitoring: true,
      securityActions: {
        enable2FAEnforcement: true,
        enablePasswordResetEnforcement: true,
        sendEmail: sendEmail, // Use SendGrid integration
      }
    })
  ]
});
