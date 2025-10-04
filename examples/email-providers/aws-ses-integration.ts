/**
 * AWS SES Email Integration Example
 * 
 * This shows how to integrate the monitoring plugin with AWS SES email service
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize AWS SES
const sesClient = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Email sending function using AWS SES
const sendEmail = async (notification: any) => {
  try {
    const command = new SendEmailCommand({
      Source: 'security@yourapp.com',
      Destination: {
        ToAddresses: [notification.to],
      },
      Message: {
        Subject: {
          Data: notification.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Security Alert</h2>
                <p>Hello ${notification.data.userName},</p>
                <p>${notification.data.reason}</p>
                <p><strong>IP Address:</strong> ${notification.data.ip}</p>
                <p><strong>Time:</strong> ${notification.data.timestamp}</p>
              </div>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `Security Alert\n\nHello ${notification.data.userName},\n\n${notification.data.reason}\n\nIP: ${notification.data.ip}\nTime: ${notification.data.timestamp}`,
            Charset: 'UTF-8',
          },
        },
      },
    });
    
    const result = await sesClient.send(command);
    console.log('📧 Email sent successfully via AWS SES:', result.MessageId);
    return result;
  } catch (error) {
    console.error('📧 Failed to send email via AWS SES:', error);
    throw error;
  }
};

// Better Auth configuration with AWS SES integration
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
        sendEmail: sendEmail, // Use AWS SES integration
      }
    })
  ]
});
