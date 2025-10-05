/**
 * Location Detection Usage Examples
 * 
 * This file shows how to use the Better Auth Location Detection plugin
 * in various scenarios.
 */

import { betterAuth } from "better-auth";
import { betterAuthLocationDetection } from "../src/location-plugin";

// Example 1: Basic Configuration
export const auth = betterAuth({
  database: {
    // Your database configuration
  },
  plugins: [
    betterAuthLocationDetection({
      enabled: true,
      distanceThreshold: 1000, // Alert if login is more than 1000km from last location
      newCountryThreshold: 0.8, // High confidence for new country detection
      verificationEmailEnabled: true,
      geolocationProvider: 'geoip-lite', // Free offline provider
      
      // Custom hooks
      onLocationAnomalyDetected: async (event) => {
        console.log('🚨 Suspicious location detected:', event);
        // You can integrate with external monitoring services here
        // await sendToSlack(event);
        // await logToDatabase(event);
      },
      
      onLocationVerified: async (userId, location) => {
        console.log(`✅ Location verified for user ${userId}:`, location);
        // You can update user preferences, send notifications, etc.
      },
      
      onLocationRejected: async (userId, location) => {
        console.log(`❌ Location rejected for user ${userId}:`, location);
        // You can trigger additional security measures here
        // await revokeAllUserSessions(userId);
        // await notifySecurityTeam(userId, location);
      }
    })
  ]
});

// Example 2: Advanced Configuration with Paid Geolocation Service
export const authAdvanced = betterAuth({
  database: {
    // Your database configuration
  },
  plugins: [
    betterAuthLocationDetection({
      enabled: true,
      distanceThreshold: 500, // More sensitive - 500km threshold
      newCountryThreshold: 0.9, // Very high confidence for new countries
      maxHistoryLocations: 100, // Keep more location history
      verificationEmailEnabled: true,
      autoBlockSuspicious: true, // Automatically block highly suspicious logins
      trustedLocationGracePeriod: 7, // Trust locations for 7 days
      geolocationProvider: 'ipdata', // Paid service with higher accuracy
      apiKey: process.env.IPDATA_API_KEY,
      
      onLocationAnomalyDetected: async (event) => {
        // Send to multiple monitoring services
        await Promise.allSettled([
          sendToSlack(event),
          logToSecurityDatabase(event),
          notifyAdminTeam(event)
        ]);
      }
    })
  ]
});

// Example 3: Next.js API Route Integration
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // The location detection will automatically run when Better Auth
    // processes the login request
    const result = await auth.api.signInEmail({
      body: { email, password }
    });
    
    // Check if location verification is required
    if (result.error === 'LOCATION_VERIFICATION_REQUIRED') {
      return Response.json({
        success: false,
        requiresLocationVerification: true,
        message: 'Please check your email to verify this login location'
      });
    }
    
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: "Login failed" }, 
      { status: 401 }
    );
  }
}

// Example 4: Manual Location Detection
import { detectSuspiciousLocation } from "../src/location-plugin";

export async function checkLocationManually(userId: string, ip: string, userAgent: string) {
  const result = await detectSuspiciousLocation(userId, ip, userAgent, {
    distanceThreshold: 2000, // 2000km threshold
    verificationEmailEnabled: false, // Disable email for manual checks
    onLocationAnomalyDetected: async (event) => {
      // Custom handling for manual detection
      console.log('Manual location check detected anomaly:', event);
    }
  });
  
  return result;
}

// Example 5: Admin Dashboard Integration
export async function getLocationDashboard() {
  // Get all suspicious events
  const response = await fetch('/api/auth/location/suspicious');
  const { events } = await response.json();
  
  // Get user location statistics
  const userStats = await fetch('/api/auth/location/stats/user@example.com');
  const { stats } = await userStats.json();
  
  return {
    suspiciousEvents: events,
    userStats: stats
  };
}

// Example 6: Location Verification Handler
export async function handleLocationVerification(token: string, action: 'verify' | 'reject', userId: string) {
  const endpoint = action === 'verify' ? '/api/auth/location/verify' : '/api/auth/location/reject';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, userId })
  });
  
  const result = await response.json();
  return result;
}

// Example 7: Trusted IP Management
export async function manageTrustedIPs(userId: string) {
  // Get current trusted IPs
  const response = await fetch(`/api/auth/location/trusted-ips/${userId}`);
  const { ips } = await response.json();
  
  // Add new trusted IP
  await fetch('/api/auth/location/trusted-ip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ip: '192.168.1.100' })
  });
  
  // Remove trusted IP
  await fetch('/api/auth/location/trusted-ip', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ip: '192.168.1.100' })
  });
  
  return ips;
}

// Example 8: GDPR Compliance - Clear User Data
export async function clearUserLocationData(userId: string) {
  const response = await fetch(`/api/auth/location/clear/${userId}`, {
    method: 'DELETE'
  });
  
  const result = await response.json();
  return result;
}

// Helper functions for examples
async function sendToSlack(event: any) {
  // Implementation for Slack notification
  console.log('Sending to Slack:', event);
}

async function logToSecurityDatabase(event: any) {
  // Implementation for security database logging
  console.log('Logging to security database:', event);
}

async function notifyAdminTeam(event: any) {
  // Implementation for admin team notification
  console.log('Notifying admin team:', event);
}

async function sendToSlack(event: any) {
  // Implementation for Slack notification
  console.log('Sending to Slack:', event);
}

async function logToSecurityDatabase(event: any) {
  // Implementation for security database logging
  console.log('Logging to security database:', event);
}

async function notifyAdminTeam(event: any) {
  // Implementation for admin team notification
  console.log('Notifying admin team:', event);
}
