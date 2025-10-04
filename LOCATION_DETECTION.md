# Complete Location Detection System

This document describes the comprehensive unusual location detection system integrated with Better Auth Monitor.

## 🎯 Overview

The location detection system implements **all definitions of unusual location concepts** to provide comprehensive security monitoring for authentication activities. It automatically detects and alerts on suspicious login patterns based on geographic, network, and behavioral analysis.

## 🔍 Detection Capabilities

### 1. **Impossible Travel Detection**
- **What it detects**: Logins from locations that are physically impossible to reach within the time frame
- **Algorithm**: Calculates distance between consecutive logins and compares with maximum possible travel speed
- **Threshold**: Configurable maximum travel speed (default: 900 km/h)
- **Example**: User logs in from New York at 9:00 AM, then from Tokyo at 9:30 AM
- **Risk Score**: 95 (Critical)

### 2. **VPN/Proxy Detection**
- **What it detects**: Logins through known VPN providers, proxy services, or hosting providers
- **Method**: ISP and organization name analysis against known VPN/proxy databases
- **Providers detected**: NordVPN, ExpressVPN, Surfshark, CyberGhost, Private Internet Access, etc.
- **Risk Score**: 70 (Medium-High)

### 3. **Tor Network Detection**
- **What it detects**: Logins through Tor exit nodes
- **Method**: IP address analysis against Tor exit node directories
- **Risk Score**: 85 (High)

### 4. **Suspicious Country Detection**
- **What it detects**: Logins from countries with high security risk
- **Default list**: North Korea, Iran, Syria, Cuba, Venezuela, Myanmar, Belarus, Russia, China
- **Configurable**: Custom list of suspicious country codes
- **Risk Score**: 80 (High)

### 5. **New Country Detection**
- **What it detects**: First-time logins from countries the user has never visited
- **Requirement**: Minimum location history (default: 3 previous locations)
- **Time window**: 24 hours for comparison
- **Risk Score**: 60 (Medium)

### 6. **New City Detection**
- **What it detects**: First-time logins from cities within the same country
- **Configurable**: Can be enabled/disabled based on security requirements
- **Risk Score**: 30 (Low)

### 7. **Timezone Anomaly Detection**
- **What it detects**: Timezone changes that don't match travel time
- **Method**: Compares timezone difference with actual travel time
- **Tolerance**: 2-hour difference threshold
- **Risk Score**: 50 (Medium)

## 🛠 Configuration Options

```typescript
betterAuthMonitor({
  // Location Detection Settings
  enableLocationDetection: true,
  maxNormalDistance: 1000,           // km
  locationAnomalyWindow: 24,         // hours
  minLocationHistory: 3,             // minimum locations for comparison
  
  // VPN/Proxy/Tor Detection
  enableVpnDetection: true,
  enableTorDetection: true,
  
  // Country Analysis
  enableSuspiciousCountryDetection: true,
  suspiciousCountries: ['KP', 'IR', 'SY', 'CU', 'VE', 'MM', 'BY', 'RU', 'CN'],
  
  // Travel Analysis
  enableImpossibleTravelDetection: true,
  maxTravelSpeed: 900,               // km/h
  
  // New Location Detection
  enableNewCountryDetection: true,
  enableNewCityDetection: false,     // optional
  enableTimezoneAnomalyDetection: true
})
```

## 📊 Security Events Generated

### Event Types
- `vpn_detected` - VPN usage detected
- `tor_detected` - Tor network detected
- `impossible_travel` - Impossible travel detected
- `new_country` - New country login
- `new_city` - New city login
- `timezone_anomaly` - Timezone inconsistency
- `suspicious_country` - Login from suspicious country

### Event Structure
```typescript
interface SecurityEvent {
  type: 'vpn_detected' | 'tor_detected' | 'impossible_travel' | 'new_country' | 'new_city' | 'timezone_anomaly' | 'suspicious_country';
  userId: string;
  timestamp: string;
  ip: string;
  locationData: LocationData;
  riskScore: number;
  anomalyType: string;
  metadata: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
    // Additional context based on anomaly type
  };
}
```

## 🌍 Geolocation Services

The system uses multiple geolocation services for accuracy and redundancy:

1. **IP-API** (Primary)
2. **IPInfo** (Secondary)
3. **IPGeolocation** (Tertiary)

### Location Data Structure
```typescript
interface LocationData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
  timestamp: number;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
  riskScore?: number;
}
```

## 🔧 API Endpoints

### Server Endpoints
- `GET /monitor/events` - Get security events
- `GET /monitor/location-stats` - Get location monitoring statistics
- `GET /monitor/user-locations/:userId` - Get user's location history

### Client Actions
```typescript
// Get security events
const events = await authClient.getSecurityEvents({ limit: 50 });

// Get location statistics
const stats = await authClient.getLocationStats();

// Get user location history
const history = await authClient.getUserLocationHistory('user123');
```

## 📈 Risk Scoring System

The system uses a comprehensive risk scoring algorithm (0-100):

- **0-20**: Low risk (normal activity)
- **21-40**: Medium risk (suspicious but not critical)
- **41-70**: High risk (requires attention)
- **71-100**: Critical risk (immediate action required)

### Risk Factors
- **Suspicious Country**: +40 points
- **VPN Usage**: +30 points
- **Tor Network**: +50 points
- **Proxy Usage**: +20 points
- **Hosting Provider**: +15 points
- **Impossible Travel**: +95 points
- **New Country**: +60 points
- **Timezone Anomaly**: +50 points

## 🚀 Usage Examples

### Basic Setup
```typescript
import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "better-auth-monitor";

export const auth = betterAuth({
  plugins: [
    betterAuthMonitor({
      enableLocationDetection: true,
      logger: (event) => {
        console.log(`🚨 Security Alert: ${event.type}`, event);
        // Send to your monitoring service
      }
    })
  ]
});
```

### Advanced Configuration
```typescript
betterAuthMonitor({
  // Custom thresholds
  maxNormalDistance: 500,           // 500km normal travel
  maxTravelSpeed: 1200,             // 1200 km/h max speed
  
  // Custom suspicious countries
  suspiciousCountries: ['KP', 'IR', 'SY', 'CUSTOM_RISKY_COUNTRY'],
  
  // Disable certain detections
  enableNewCityDetection: false,    // Too noisy for your use case
  enableTimezoneAnomalyDetection: false,
  
  // Custom logging
  logger: (event) => {
    if (event.riskScore > 70) {
      // Send critical alerts to security team
      sendCriticalAlert(event);
    } else {
      // Log to monitoring system
      logToMonitoringSystem(event);
    }
  }
})
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm run test:location
```

The test suite covers:
- VPN detection
- Impossible travel scenarios
- New country detection
- Suspicious country detection
- Tor network detection
- Timezone anomaly detection

## 🔒 Security Considerations

1. **Privacy**: Location data is stored in-memory and not persisted
2. **Accuracy**: Uses multiple geolocation services for reliability
3. **Performance**: Asynchronous processing doesn't block authentication
4. **Configurability**: All thresholds and rules are configurable
5. **Logging**: Comprehensive logging for security analysis

## 📝 Integration Notes

- **Zero Dependencies**: No external services required (uses free APIs)
- **Better Auth Compatible**: Works with all Better Auth versions ^0.8.0
- **TypeScript Support**: Full type safety and IntelliSense
- **Production Ready**: Handles errors gracefully and doesn't break authentication flow

## 🎯 Real-World Scenarios

### Scenario 1: Corporate Account Compromise
- Employee account logs in from suspicious country
- Risk Score: 80 (Suspicious Country)
- Action: Immediate security alert, account review

### Scenario 2: Account Takeover
- User logs in from New York, then Tokyo 30 minutes later
- Risk Score: 95 (Impossible Travel)
- Action: Critical alert, account lockout, user notification

### Scenario 3: VPN Usage
- User consistently uses VPN for privacy
- Risk Score: 70 (VPN Detected)
- Action: Logged for review, may be legitimate

### Scenario 4: Business Travel
- User logs in from new country during business trip
- Risk Score: 60 (New Country)
- Action: Medium priority alert, verify with user

This comprehensive location detection system provides enterprise-grade security monitoring with minimal configuration and maximum protection against location-based threats.
