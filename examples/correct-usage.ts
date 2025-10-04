/**
 * Correct Usage Example for Better Auth Monitor
 * 
 * This shows the proper way to integrate the monitoring plugin
 * with your Better Auth application.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor, trackFailedLoginManually } from "../src/plugin";

// Step 1: Configure Better Auth with the monitoring plugin
export const auth = betterAuth({
  database: {
    provider: "postgresql", // or your database
    url: process.env.DATABASE_URL!
  },
  
  emailAndPassword: {
    enabled: true
  },
  
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 5,     // Alert after 5 failed attempts
      failedLoginWindow: 10,       // Within 10 minutes
      botDetectionThreshold: 20,   // Alert after 20 requests
      botDetectionWindow: 30,      // Within 30 seconds
      
      logger: (event) => {
        console.log(`🚨 SECURITY ALERT: ${event.type}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Attempts: ${event.attempts}`);
        console.log(`   Time: ${event.timestamp}`);
        console.log("---");
      },
    })
  ]
});

// Step 2: Create a custom sign-in handler that uses the monitoring
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Attempt to sign in
    const result = await auth.api.signInEmail({
      body: { email, password }
    });
    
    // If we get here, login was successful
    console.log('✅ Successful login for:', email);
    return Response.json({ success: true, user: result.user });
    
  } catch (error: any) {
    // Login failed - manually track this with the monitoring plugin
    console.log('❌ Login failed:', error.message);
    
    try {
      const { email } = await request.json();
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      // Manually track the failed attempt using the utility function
      const attemptCount = trackFailedLoginManually(email, ip, {
        failedLoginThreshold: 5,
        failedLoginWindow: 10,
        logger: (event) => {
          console.log(`🚨 SECURITY ALERT: ${event.type}`);
          console.log(`   User: ${event.userId}`);
          console.log(`   IP: ${event.ip}`);
          console.log(`   Attempts: ${event.attempts}`);
          console.log(`   Time: ${event.timestamp}`);
          console.log("---");
        }
      });
      console.log(`🔍 Tracked failed login attempt #${attemptCount} for ${email}`);
    } catch (trackingError) {
      console.error('Failed to track login attempt:', trackingError);
    }
    
    return Response.json({ 
      error: "Invalid credentials" 
    }, { status: 401 });
  }
}

// Step 3: Optional - Create an endpoint to check security events
export async function GET() {
  try {
    // This would call the monitoring endpoint
    const response = await fetch('/api/auth/monitor/events');
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Failed to fetch security events" }, { status: 500 });
  }
}
