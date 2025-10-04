/**
 * Real Usage Example - Better Auth Monitor
 * 
 * This shows how the plugin works in a real Better Auth application
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Real Better Auth setup with monitoring
export const auth = betterAuth({
  database: {
    provider: "postgresql", // or mysql, sqlite, etc.
    url: process.env.DATABASE_URL!
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },
  plugins: [
    betterAuthMonitor({
      // Failed login monitoring
      failedLoginThreshold: 5,     // Alert after 5 failed attempts
      failedLoginWindow: 10,       // Within 10 minutes
      
      // Bot detection
      botDetectionThreshold: 20,   // Alert after 20 requests
      botDetectionWindow: 30,      // Within 30 seconds
      
      // Location detection
      enableLocationDetection: true,
      
      // Custom security logging
      logger: (event) => {
        // Log to your monitoring service
        console.log(`🚨 SECURITY ALERT: ${event.type}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Time: ${event.timestamp}`);
        
        // Send to external monitoring service
        if (process.env.MONITORING_WEBHOOK_URL) {
          fetch(process.env.MONITORING_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...event,
              service: 'better-auth',
              environment: process.env.NODE_ENV
            })
          }).catch(err => console.error('Failed to send alert:', err));
        }
      }
    })
  ]
});

// Your API routes (Next.js example)
export async function POST(request: Request) {
  try {
    // This will trigger the monitoring hooks automatically
    const result = await auth.api.signInEmail({
      body: await request.json()
    });
    
    return Response.json(result);
  } catch (error) {
    // Failed login attempt - monitoring plugin will track this
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
