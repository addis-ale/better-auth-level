/**
 * Complete Location Monitoring Example
 * 
 * This example demonstrates the full integration of all unusual location
 * detection concepts with Better Auth Monitor.
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor, betterAuthMonitorClient } from "../src";
import { createAuthClient } from "better-auth/client";

// Complete Better Auth setup with comprehensive location monitoring
export const auth = betterAuth({
  database: {
    provider: "postgresql",
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
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    }
  },
  plugins: [
    betterAuthMonitor({
      // Failed login monitoring
      failedLoginThreshold: 5,
      failedLoginWindow: 10,
      
      // Bot detection
      botDetectionThreshold: 20,
      botDetectionWindow: 30,
      
      // === COMPREHENSIVE LOCATION DETECTION ===
      
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
        'CN', // China
        'AF', // Afghanistan
        'SO'  // Somalia
      ],
      
      // Travel Analysis
      enableImpossibleTravelDetection: true,
      maxTravelSpeed: 900,               // 900 km/h (commercial aircraft speed)
      
      // New Location Detection
      enableNewCountryDetection: true,
      enableNewCityDetection: true,      // Enable for comprehensive monitoring
      
      // Timezone Analysis
      enableTimezoneAnomalyDetection: true,
      
      // Advanced security logging
      logger: (event) => {
        const timestamp = new Date().toISOString();
        const severity = event.metadata?.severity || 'unknown';
        const riskScore = event.riskScore || 0;
        
        // Color-coded logging based on severity
        const severityColors = {
          'low': '🟢',
          'medium': '🟡', 
          'high': '🟠',
          'critical': '🔴'
        };
        
        const color = severityColors[severity as keyof typeof severityColors] || '⚪';
        
        console.log(`\n${color} [${timestamp}] SECURITY ALERT: ${event.type.toUpperCase()}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Risk Score: ${riskScore}/100`);
        console.log(`   Severity: ${severity.toUpperCase()}`);
        
        // Location-specific information
        if (event.locationData) {
          const loc = event.locationData;
          console.log(`   📍 Location: ${loc.city}, ${loc.country} (${loc.countryCode})`);
          console.log(`   🌐 Coordinates: ${loc.latitude}, ${loc.longitude}`);
          console.log(`   🏢 ISP: ${loc.isp}`);
          console.log(`   🏛️  Organization: ${loc.org}`);
          console.log(`   🕐 Timezone: ${loc.timezone}`);
          
          // Network analysis indicators
          if (loc.isVpn) console.log(`   ⚠️  VPN DETECTED`);
          if (loc.isTor) console.log(`   ⚠️  TOR NETWORK DETECTED`);
          if (loc.isProxy) console.log(`   ⚠️  PROXY DETECTED`);
        }
        
        // Anomaly-specific details
        if (event.anomalyType) {
          console.log(`   🔍 Anomaly Type: ${event.anomalyType}`);
          console.log(`   📝 Description: ${event.metadata?.description || 'N/A'}`);
          console.log(`   🎯 Confidence: ${Math.round((event.metadata?.confidence || 0) * 100)}%`);
        }
        
        // Travel analysis
        if (event.distance) {
          console.log(`   📏 Distance: ${event.distance.toFixed(1)} km`);
          console.log(`   ⏱️  Travel Time: ${event.travelTime?.toFixed(1) || 'N/A'} hours`);
          console.log(`   🚀 Travel Speed: ${event.travelSpeed?.toFixed(1) || 'N/A'} km/h`);
        }
        
        // Previous location context
        if (event.previousLocation) {
          const prev = event.previousLocation;
          console.log(`   📍 Previous: ${prev.city}, ${prev.country}`);
          console.log(`   🕐 Previous Time: ${new Date(prev.timestamp).toISOString()}`);
        }
        
        console.log('   ' + '─'.repeat(50));
        
        // Send to external monitoring systems
        sendToMonitoringSystems(event);
      }
    })
  ]
});

// Client setup with monitoring capabilities
export const authClient = createAuthClient({
  plugins: [betterAuthMonitorClient()]
});

// External monitoring system integration
async function sendToMonitoringSystems(event: any) {
  try {
    // Send to Slack (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendToSlack(event);
    }
    
    // Send to Discord (if configured)
    if (process.env.DISCORD_WEBHOOK_URL) {
      await sendToDiscord(event);
    }
    
    // Send to custom monitoring service
    if (process.env.MONITORING_SERVICE_URL) {
      await sendToCustomService(event);
    }
    
    // Store in database for analysis
    await storeSecurityEvent(event);
    
  } catch (error) {
    console.error('Failed to send to monitoring systems:', error);
  }
}

// Slack integration
async function sendToSlack(event: any) {
  const severity = event.metadata?.severity || 'unknown';
  const color = {
    'low': '#36a64f',
    'medium': '#ffcc02',
    'high': '#ff8c00',
    'critical': '#ff0000'
  }[severity] || '#808080';
  
  const payload = {
    text: `🚨 Security Alert: ${event.type.toUpperCase()}`,
    attachments: [{
      color,
      fields: [
        { title: 'User', value: event.userId, short: true },
        { title: 'IP Address', value: event.ip, short: true },
        { title: 'Risk Score', value: `${event.riskScore || 0}/100`, short: true },
        { title: 'Severity', value: severity.toUpperCase(), short: true },
        { title: 'Location', value: event.locationData ? `${event.locationData.city}, ${event.locationData.country}` : 'Unknown', short: true },
        { title: 'ISP', value: event.locationData?.isp || 'Unknown', short: true },
        { title: 'Description', value: event.metadata?.description || 'N/A', short: false }
      ],
      footer: 'Better Auth Monitor',
      ts: Math.floor(Date.now() / 1000)
    }]
  };
  
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// Discord integration
async function sendToDiscord(event: any) {
  const severity = event.metadata?.severity || 'unknown';
  const color = {
    'low': 0x36a64f,
    'medium': 0xffcc02,
    'high': 0xff8c00,
    'critical': 0xff0000
  }[severity] || 0x808080;
  
  const embed = {
    title: `🚨 Security Alert: ${event.type.toUpperCase()}`,
    color,
    fields: [
      { name: 'User', value: event.userId, inline: true },
      { name: 'IP Address', value: event.ip, inline: true },
      { name: 'Risk Score', value: `${event.riskScore || 0}/100`, inline: true },
      { name: 'Severity', value: severity.toUpperCase(), inline: true },
      { name: 'Location', value: event.locationData ? `${event.locationData.city}, ${event.locationData.country}` : 'Unknown', inline: true },
      { name: 'ISP', value: event.locationData?.isp || 'Unknown', inline: true },
      { name: 'Description', value: event.metadata?.description || 'N/A', inline: false }
    ],
    footer: { text: 'Better Auth Monitor' },
    timestamp: new Date().toISOString()
  };
  
  await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });
}

// Custom monitoring service
async function sendToCustomService(event: any) {
  await fetch(process.env.MONITORING_SERVICE_URL!, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
    },
    body: JSON.stringify({
      ...event,
      service: 'better-auth-monitor',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  });
}

// Database storage
async function storeSecurityEvent(event: any) {
  // This would integrate with your database
  // Example with Prisma:
  /*
  await prisma.securityEvent.create({
    data: {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      timestamp: new Date(event.timestamp),
      riskScore: event.riskScore,
      metadata: event.metadata,
      locationData: event.locationData
    }
  });
  */
}

// API route for authentication
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // This will automatically trigger all monitoring including location detection
    const result = await auth.api.signInEmail({
      body: { email, password }
    });
    
    return Response.json({ 
      success: true, 
      user: result.user,
      message: "Login successful - comprehensive monitoring active"
    });
  } catch (error) {
    // Failed login - monitoring plugin tracks this automatically
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

// Dashboard API for monitoring data
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    switch (path) {
      case '/api/monitoring/dashboard':
        // Get comprehensive monitoring dashboard data
        const events = await authClient.getSecurityEvents({ limit: 100 });
        const locationStats = await authClient.getLocationStats();
        
        return Response.json({
          events: events.events,
          locationStats: locationStats.stats,
          timestamp: new Date().toISOString()
        });
        
      case '/api/monitoring/user/:userId':
        const userId = url.pathname.split('/').pop();
        const userHistory = await authClient.getUserLocationHistory(userId!);
        
        return Response.json({
          userHistory,
          timestamp: new Date().toISOString()
        });
        
      default:
        return Response.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Example usage scenarios that will trigger different alerts:

/*
SCENARIO 1: Corporate Account Compromise
- Employee logs in from North Korea (suspicious country)
- Risk Score: 80, Severity: High
- Action: Immediate security alert, account review

SCENARIO 2: Account Takeover with Impossible Travel
- User logs in from New York at 9:00 AM
- User logs in from Tokyo at 9:30 AM (impossible travel)
- Risk Score: 95, Severity: Critical
- Action: Critical alert, account lockout, user notification

SCENARIO 3: VPN Usage for Privacy
- User consistently uses NordVPN for privacy
- Risk Score: 70, Severity: Medium
- Action: Logged for review, may be legitimate

SCENARIO 4: Business Travel
- User logs in from new country during business trip
- Risk Score: 60, Severity: Medium
- Action: Medium priority alert, verify with user

SCENARIO 5: Tor Network Usage
- User logs in through Tor exit node
- Risk Score: 85, Severity: High
- Action: High priority alert, investigate further

SCENARIO 6: Timezone Anomaly
- User logs in from timezone that doesn't match travel time
- Risk Score: 50, Severity: Medium
- Action: Logged for analysis

SCENARIO 7: New City Detection
- User logs in from new city within same country
- Risk Score: 30, Severity: Low
- Action: Low priority alert, monitor patterns
*/
