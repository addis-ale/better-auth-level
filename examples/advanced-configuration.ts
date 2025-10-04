/**
 * Advanced Configuration Example
 * 
 * This example shows advanced configuration options for the Better Auth Monitor plugin
 * including custom logging, webhook integration, and database persistence.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "better-auth-monitor";

// Custom logger that integrates with external services
const customLogger = (event: any) => {
  // Log to console
  console.log(`[SECURITY] ${event.type.toUpperCase()}:`, event);
  
  // Send to external monitoring service
  fetch('https://your-monitoring-service.com/api/security-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
    },
    body: JSON.stringify({
      ...event,
      service: 'better-auth',
      environment: process.env.NODE_ENV
    })
  }).catch(err => {
    console.error('Failed to send security event to monitoring service:', err);
  });

  // Send to Slack webhook (optional)
  if (process.env.SLACK_WEBHOOK_URL) {
    fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Security Alert: ${event.type}`,
        attachments: [{
          color: event.type === 'failed_login' ? 'warning' : 'danger',
          fields: [
            { title: 'Type', value: event.type, short: true },
            { title: 'IP', value: event.ip, short: true },
            { title: 'Timestamp', value: event.timestamp, short: true },
            ...(event.userId ? [{ title: 'User ID', value: event.userId, short: true }] : []),
            ...(event.attempts ? [{ title: 'Attempts', value: event.attempts.toString(), short: true }] : []),
            ...(event.requestRate ? [{ title: 'Request Rate', value: event.requestRate, short: true }] : [])
          ]
        }]
      })
    }).catch(err => {
      console.error('Failed to send Slack notification:', err);
    });
  }
};

// Advanced configuration
export const auth = betterAuth({
  database: {
    // Your database configuration
  },
  plugins: [
    betterAuthMonitor({
      // Failed login monitoring
      failedLoginThreshold: 3,      // Very sensitive - alert after 3 attempts
      failedLoginWindow: 5,          // Within 5 minutes
      
      // Bot detection
      botDetectionThreshold: 20,    // Higher threshold for production
      botDetectionWindow: 30,        // 30-second window
      
      // Location detection
      enableLocationDetection: true,
      
      // Custom logging
      logger: customLogger,
      
      // Disable certain features in development
      enableFailedLoginMonitoring: process.env.NODE_ENV !== 'development',
      enableBotDetection: process.env.NODE_ENV !== 'development',
    })
  ]
});

// Example: Custom middleware for additional security
export const securityMiddleware = async (req: Request, res: Response, next: Function) => {
  // Add custom security headers
  res.setHeader('X-Security-Monitor', 'enabled');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
};

// Example: Database integration for persistent logging
export const logToDatabase = async (event: any) => {
  // Example: Log to your database
  // await db.securityEvents.create({
  //   type: event.type,
  //   userId: event.userId,
  //   ip: event.ip,
  //   timestamp: new Date(event.timestamp),
  //   metadata: event.metadata || {}
  // });
};
