/**
 * Nodemailer SMTP Integration Example
 * 
 * This shows how to integrate the monitoring plugin with Nodemailer for SMTP email
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";
import nodemailer from 'nodemailer';

// Create SMTP transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

// Email sending function using Nodemailer
const sendEmail = async (notification: any) => {
  try {
    const mailOptions = {
      from: 'Security Alerts <security@yourapp.com>',
      to: notification.to,
      subject: notification.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Security Alert</h2>
          <p>Hello ${notification.data.userName},</p>
          <p>${notification.data.reason}</p>
          <p><strong>IP Address:</strong> ${notification.data.ip}</p>
          <p><strong>Time:</strong> ${notification.data.timestamp}</p>
        </div>
      `,
      text: `Security Alert\n\nHello ${notification.data.userName},\n\n${notification.data.reason}\n\nIP: ${notification.data.ip}\nTime: ${notification.data.timestamp}`,
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully via SMTP:', result.messageId);
    return result;
  } catch (error) {
    console.error('📧 Failed to send email via SMTP:', error);
    throw error;
  }
};

// Better Auth configuration with Nodemailer integration
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
        sendEmail: sendEmail, // Use Nodemailer integration
      }
    })
  ]
});
