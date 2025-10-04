/**
 * Console Logging Email Integration (Development)
 * 
 * This shows how to use console logging for development/testing
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Simple console logging for development
const sendEmail = async (notification: any) => {
  console.log('📧 EMAIL NOTIFICATION:');
  console.log('   To:', notification.to);
  console.log('   Subject:', notification.subject);
  console.log('   Template:', notification.template);
  console.log('   Data:', JSON.stringify(notification.data, null, 2));
  console.log('   ---');
  
  // In development, you might want to save to a file or database
  // await saveEmailToFile(notification);
  // await saveEmailToDatabase(notification);
};

// Better Auth configuration with console logging
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
        sendEmail: sendEmail, // Use console logging for development
      }
    })
  ]
});
