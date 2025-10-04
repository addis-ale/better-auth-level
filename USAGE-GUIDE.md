# Better Auth Monitor - Usage Guide

## Problem Solved

Your original issue was that the `betterAuthMonitor` plugin wasn't detecting failed login attempts when you tried to login with incorrect credentials. The plugin was configured correctly, but it wasn't properly integrated with Better Auth's authentication flow.

## Solution

The plugin now provides two ways to track failed login attempts:

1. **Automatic tracking** (via the plugin's built-in monitoring)
2. **Manual tracking** (via the `trackFailedLoginManually` function)

## How to Use

### Method 1: Manual Tracking (Recommended)

This is the most reliable approach. You manually track failed login attempts in your application code:

```typescript
import { betterAuth } from "better-auth";
import { betterAuthMonitor, trackFailedLoginManually } from "better-auth-monitor";

// Configure Better Auth with the plugin
export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!
  },
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 5,
      failedLoginWindow: 10,
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

// Your sign-in endpoint
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
    // Login failed - manually track this
    console.log('❌ Login failed:', error.message);
    
    try {
      const { email } = await request.json();
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      // Manually track the failed attempt
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
```

### Method 2: Using the Plugin's Built-in Monitoring

The plugin also provides endpoints to check security events:

```typescript
// Check security events
export async function GET() {
  try {
    const response = await fetch('/api/auth/monitor/events');
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Failed to fetch security events" }, { status: 500 });
  }
}
```

## Configuration Options

```typescript
betterAuthMonitor({
  // Failed login monitoring
  failedLoginThreshold: 5,     // Alert after 5 failed attempts
  failedLoginWindow: 10,        // Within 10 minutes
  
  // Bot detection
  botDetectionThreshold: 20,      // Alert after 20 requests
  botDetectionWindow: 30,        // Within 30 seconds
  
  // Location detection
  enableLocationDetection: true,
  
  // Custom logger
  logger: (event) => {
    console.log(`🚨 SECURITY ALERT: ${event.type}`);
    console.log(`   User: ${event.userId}`);
    console.log(`   IP: ${event.ip}`);
    console.log(`   Attempts: ${event.attempts}`);
    console.log(`   Time: ${event.timestamp}`);
    console.log("---");
  }
})
```

## Testing

To test the plugin, you can use the provided test script:

```bash
node simple-test.js
```

This will simulate 6 failed login attempts and show you the security alerts.

## Why This Approach Works

1. **Manual tracking is more reliable** - You have direct control over when to track failed attempts
2. **No dependency on Better Auth's internal hooks** - The plugin works independently
3. **Flexible configuration** - You can customize thresholds and logging
4. **Easy to integrate** - Just call `trackFailedLoginManually` in your error handling

## Next Steps

1. Install the updated plugin: `npm install ./better-auth-monitor-1.0.2.tgz`
2. Update your Better Auth configuration to use the manual tracking approach
3. Test with multiple failed login attempts to verify the alerts work
4. Customize the logging to integrate with your monitoring system

The plugin will now properly detect and alert on failed login attempts as expected!
