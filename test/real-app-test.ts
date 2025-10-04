/**
 * Real Application Testing Guide
 * 
 * This shows how to test Better Auth Monitor in your actual application
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Step 1: Add monitoring to your existing Better Auth config
export const auth = betterAuth({
  // Your existing database config
  database: {
    provider: "postgresql", // or your database
    url: process.env.DATABASE_URL!
  },
  
  // Your existing auth config
  emailAndPassword: {
    enabled: true
  },
  
  // Add the monitoring plugin
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,     // Lower for testing
      failedLoginWindow: 2,        // 2 minutes for quick testing
      enableFailedLoginMonitoring: true,
      
      // Custom logger to see alerts in console
      logger: (event) => {
        console.log(`🚨 SECURITY ALERT: ${event.type}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Time: ${event.timestamp}`);
        if (event.attempts) console.log(`   Attempts: ${event.attempts}`);
        console.log('---');
      }
    })
  ]
});

// Step 2: Test with your existing login endpoint
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // This will trigger monitoring hooks automatically
    const result = await auth.api.signInEmail({
      body: { email, password }
    });
    
    return Response.json({ success: true, user: result.user });
  } catch (error) {
    // Failed login - monitoring plugin tracks this automatically
    console.log('Login failed - monitoring plugin will track this');
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
