/**
 * Location Detection Example
 * 
 * This example shows how to use the complete unusual location detection system
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Basic setup with location detection
export const auth = betterAuth({
  database: {
    provider: "postgresql", // or your preferred database
    url: process.env.DATABASE_URL!
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  plugins: [
    betterAuthMonitor({
      // Failed login monitoring
      failedLoginThreshold: 5,
      failedLoginWindow: 10,
      
      // Bot detection
      botDetectionThreshold: 20,
      botDetectionWindow: 30,
      
      // === LOCATION DETECTION CONFIGURATION ===
      
      // Core location settings
      enableLocationDetection: true,
      maxNormalDistance: 1000,           // 1000km normal travel distance
      locationAnomalyWindow: 24,         // 24 hours for anomaly detection
      minLocationHistory: 3,             // Need 3 previous locations for comparison
      
      // VPN/Proxy/Tor Detection
      enableVpnDetection: true,
      enableTorDetection: true,
      
      // Suspicious Country Detection
      enableSuspiciousCountryDetection: true,
      suspiciousCountries: [
        'KP', // North Korea
        'IR', // Iran
        'SY', // Syria
        'CU', // Cuba
        'VE', // Venezuela
        'MM', // Myanmar
        'BY', // Belarus
        'RU', // Russia
        'CN'  // China
      ],
      
      // Travel Analysis
      enableImpossibleTravelDetection: true,
      maxTravelSpeed: 900,               // 900 km/h (commercial aircraft speed)
      
      // New Location Detection
      enableNewCountryDetection: true,
      enableNewCityDetection: false,     // Disable for less noise
      
      // Timezone Analysis
      enableTimezoneAnomalyDetection: true,
      
      // Custom security logging
      logger: (event) => {
        console.log(`🚨 SECURITY ALERT: ${event.type}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Time: ${event.timestamp}`);
        
        // Location-specific logging
        if (event.locationData) {
          console.log(`   Location: ${event.locationData.city}, ${event.locationData.country}`);
          console.log(`   Coordinates: ${event.locationData.latitude}, ${event.locationData.longitude}`);
          console.log(`   ISP: ${event.locationData.isp}`);
          console.log(`   Risk Score: ${event.riskScore || 'N/A'}`);
          
          if (event.locationData.isVpn) console.log(`   ⚠️  VPN Detected`);
          if (event.locationData.isTor) console.log(`   ⚠️  Tor Network Detected`);
          if (event.locationData.isProxy) console.log(`   ⚠️  Proxy Detected`);
        }
        
        // Anomaly-specific information
        if (event.anomalyType) {
          console.log(`   Anomaly Type: ${event.anomalyType}`);
          console.log(`   Description: ${event.metadata?.description || 'N/A'}`);
          console.log(`   Severity: ${event.metadata?.severity || 'N/A'}`);
        }
        
        // Travel analysis
        if (event.distance) {
          console.log(`   Distance: ${event.distance.toFixed(1)} km`);
          console.log(`   Travel Time: ${event.travelTime?.toFixed(1) || 'N/A'} hours`);
          console.log(`   Travel Speed: ${event.travelSpeed?.toFixed(1) || 'N/A'} km/h`);
        }
        
        console.log('---');
        
        // Send to external monitoring service
        if (process.env.MONITORING_WEBHOOK_URL) {
          fetch(process.env.MONITORING_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...event,
              service: 'better-auth-monitor',
              environment: process.env.NODE_ENV,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.error('Failed to send alert:', err));
        }
      }
    })
  ]
});

// Example API route that triggers location monitoring
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // This will automatically trigger location detection on successful login
    const result = await auth.api.signInEmail({
      body: { email, password }
    });
    
    return Response.json({ 
      success: true, 
      user: result.user,
      message: "Login successful - location monitoring active"
    });
  } catch (error) {
    // Failed login - monitoring plugin tracks this automatically
    console.log('Login failed - monitoring plugin will track this');
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

// Example of different types of location anomalies that will be detected:

/*
1. IMPOSSIBLE TRAVEL
   - User logs in from New York at 9:00 AM
   - User logs in from Tokyo at 9:30 AM (impossible - 10,000+ km in 30 minutes)
   - Risk Score: 95, Severity: Critical

2. NEW COUNTRY
   - User has only logged in from USA, Canada, Mexico
   - User logs in from Germany for the first time
   - Risk Score: 60, Severity: Medium

3. VPN DETECTION
   - User logs in with IP from known VPN provider (NordVPN, ExpressVPN, etc.)
   - Risk Score: 70, Severity: Medium

4. TOR NETWORK
   - User logs in through Tor exit node
   - Risk Score: 85, Severity: High

5. SUSPICIOUS COUNTRY
   - User logs in from North Korea, Iran, Syria, etc.
   - Risk Score: 80, Severity: High

6. TIMEZONE ANOMALY
   - User logs in from timezone that doesn't match travel time
   - Risk Score: 50, Severity: Medium

7. NEW CITY
   - User logs in from a new city within the same country
   - Risk Score: 30, Severity: Low
*/
