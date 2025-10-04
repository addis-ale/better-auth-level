/**
 * Complete Implementation - How to Fix Your Issue
 * 
 * You need to add manual tracking to your sign-in endpoint
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor, trackFailedLoginManually } from "better-auth-monitor";

// Step 1: Configure Better Auth with the plugin (this is what you already have)
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

// Step 2: Create your sign-in endpoint with manual tracking
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
    // Login failed - THIS IS WHERE YOU ADD THE MANUAL TRACKING
    console.log('❌ Login failed:', error.message);
    
    try {
      // Extract email from the request
      const { email } = await request.json();
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      // THIS IS THE KEY PART - Manually track the failed attempt
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
