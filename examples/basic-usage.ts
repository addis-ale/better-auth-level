/**
 * Basic Usage Example
 * 
 * This example shows how to integrate the Better Auth Monitor plugin
 * with a basic Better Auth setup.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Server-side configuration
export const auth = betterAuth({
  database: {
    // Your database configuration
  },
  plugins: [
    betterAuthMonitor({
      // Customize monitoring thresholds
      failedLoginThreshold: 3,     // Alert after 3 failed attempts
      failedLoginWindow: 5,         // Within 5 minutes
      botDetectionThreshold: 15,    // Alert after 15 requests
      botDetectionWindow: 5,        // Within 5 seconds
      
      // Custom logger for security events
      logger: (event) => {
        console.log(`🚨 Security Alert: ${event.type}`, event);
        
        // You can integrate with external services here
        // Example: Send to monitoring service
        // sendToMonitoringService(event);
      }
    })
  ]
});
