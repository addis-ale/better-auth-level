# Better Auth Location Detection Plugin

A comprehensive location-based security plugin for Better Auth that detects unusual login locations and provides verification mechanisms.

## Features

- 🌍 **IP Geolocation**: Support for multiple geolocation providers (geoip-lite, IPData, IPInfo, IP-API)
- 📍 **Distance Calculation**: Haversine formula for accurate distance calculations
- 🚨 **Suspicious Detection**: Detects new countries, unusual distances, and suspicious patterns
- 📧 **Email Verification**: "Is this you?" emails with Yes/No verification
- 🔒 **Trusted Locations**: IP and device whitelisting for trusted locations
- 📊 **Analytics**: Comprehensive location statistics and suspicious event tracking
- 🛡️ **Security Actions**: Automatic blocking, session revocation, and admin notifications
- 🔄 **Redis Storage**: Persistent storage with automatic cleanup
- 📱 **Device Fingerprinting**: Track and trust specific devices
- 🌐 **GDPR Compliance**: Data deletion and privacy controls

## Installation

```bash
npm install better-auth-monitor
```

## Quick Start

```typescript
import { betterAuth } from "better-auth";
import { betterAuthLocationDetection } from "better-auth-monitor";

export const auth = betterAuth({
  database: {
    // Your database configuration
  },
  plugins: [
    betterAuthLocationDetection({
      enabled: true,
      distanceThreshold: 1000, // km
      verificationEmailEnabled: true,
      geolocationProvider: 'geoip-lite'
    })
  ]
});
```

## Configuration Options

### Basic Configuration

```typescript
betterAuthLocationDetection({
  enabled: true,                    // Enable/disable the plugin
  distanceThreshold: 1000,          // Distance threshold in kilometers
  newCountryThreshold: 0.8,         // Confidence level for new country detection
  maxHistoryLocations: 50,          // Maximum locations to store per user
  verificationEmailEnabled: true,    // Send verification emails
  autoBlockSuspicious: false,       // Automatically block suspicious logins
  trustedLocationGracePeriod: 30,   // Days to trust a location
  geolocationProvider: 'geoip-lite', // Geolocation service provider
  apiKey: 'your-api-key'            // API key for paid services
})
```

### Geolocation Providers

#### 1. GeoIP Lite (Free, Offline)
```typescript
geolocationProvider: 'geoip-lite'
// No API key required
// Install: npm install geoip-lite @types/geoip-lite
```

#### 2. IPData (Paid, High Accuracy)
```typescript
geolocationProvider: 'ipdata',
apiKey: process.env.IPDATA_API_KEY
```

#### 3. IPInfo (Paid, Good Accuracy)
```typescript
geolocationProvider: 'ipinfo',
apiKey: process.env.IPINFO_API_KEY
```

#### 4. IP-API (Free with Rate Limits)
```typescript
geolocationProvider: 'ipapi'
// No API key required
```

### Custom Hooks

```typescript
betterAuthLocationDetection({
  // ... other config
  onLocationAnomalyDetected: async (event) => {
    console.log('Suspicious location detected:', event);
    // Send to Slack, log to database, etc.
  },
  
  onLocationVerified: async (userId, location) => {
    console.log('Location verified:', userId, location);
    // Update user preferences, send notifications
  },
  
  onLocationRejected: async (userId, location) => {
    console.log('Location rejected:', userId, location);
    // Revoke sessions, notify security team
  }
})
```

## API Endpoints

The plugin provides several API endpoints for location management:

### Verify Suspicious Location
```typescript
POST /api/auth/location/verify
{
  "token": "verification-token",
  "userId": "user-id"
}
```

### Reject Suspicious Location
```typescript
POST /api/auth/location/reject
{
  "token": "verification-token", 
  "userId": "user-id"
}
```

### Get User Location Statistics
```typescript
GET /api/auth/location/stats/:userId
```

### Get Suspicious Events
```typescript
GET /api/auth/location/suspicious/:userId?limit=20
```

### Manage Trusted IPs
```typescript
// Add trusted IP
POST /api/auth/location/trusted-ip
{
  "userId": "user-id",
  "ip": "192.168.1.100"
}

// Remove trusted IP
DELETE /api/auth/location/trusted-ip
{
  "userId": "user-id", 
  "ip": "192.168.1.100"
}

// Get trusted IPs
GET /api/auth/location/trusted-ips/:userId
```

### Clear User Data (GDPR)
```typescript
DELETE /api/auth/location/clear/:userId
```

## Usage Examples

### 1. Basic Integration

```typescript
import { betterAuth } from "better-auth";
import { betterAuthLocationDetection } from "better-auth-monitor";

export const auth = betterAuth({
  database: { /* your config */ },
  plugins: [
    betterAuthLocationDetection({
      distanceThreshold: 1000,
      verificationEmailEnabled: true
    })
  ]
});
```

### 2. Advanced Configuration

```typescript
betterAuthLocationDetection({
  enabled: true,
  distanceThreshold: 500,           // More sensitive
  newCountryThreshold: 0.9,          // Very high confidence
  maxHistoryLocations: 100,         // Keep more history
  verificationEmailEnabled: true,
  autoBlockSuspicious: true,        // Auto-block high confidence
  trustedLocationGracePeriod: 7,    // Trust for 7 days
  geolocationProvider: 'ipdata',    // Paid service
  apiKey: process.env.IPDATA_API_KEY,
  
  onLocationAnomalyDetected: async (event) => {
    // Send to monitoring services
    await Promise.allSettled([
      sendToSlack(event),
      logToSecurityDatabase(event),
      notifyAdminTeam(event)
    ]);
  }
})
```

### 3. Manual Location Detection

```typescript
import { detectSuspiciousLocation } from "better-auth-monitor";

const result = await detectSuspiciousLocation(
  userId,
  ip,
  userAgent,
  {
    distanceThreshold: 2000,
    verificationEmailEnabled: false
  }
);

if (result.suspicious) {
  console.log('Suspicious location detected:', result.event);
}
```

### 4. Next.js Integration

```typescript
// pages/api/auth/[...auth].ts
export const auth = betterAuth({
  plugins: [
    betterAuthLocationDetection({
      distanceThreshold: 1000,
      verificationEmailEnabled: true
    })
  ]
});

// pages/api/auth/sign-in.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  
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
}
```

### 5. Location Verification Handler

```typescript
// pages/api/verify-location.ts
export async function POST(request: Request) {
  const { token, action, userId } = await request.json();
  
  const endpoint = action === 'verify' 
    ? '/api/auth/location/verify' 
    : '/api/auth/location/reject';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, userId })
  });
  
  const result = await response.json();
  return Response.json(result);
}
```

## Email Templates

The plugin includes beautiful HTML email templates for:

- **Suspicious Location Detection**: "Is this you?" verification email
- **Location Verified**: Confirmation when user verifies location
- **Location Rejected**: Security alert when user rejects location
- **Admin Notifications**: Alerts for administrators

## Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=security@yourapp.com
ADMIN_EMAIL=admin@yourapp.com

# Geolocation API Keys (for paid services)
IPDATA_API_KEY=your_ipdata_key
IPINFO_API_KEY=your_ipinfo_key

# App Configuration
APP_URL=https://yourapp.com
```

## Security Considerations

### 1. IP Address Privacy
- Private IPs (192.168.x.x, 10.x.x.x) are automatically trusted
- IPv6 localhost addresses are trusted
- Consider VPN detection for enhanced security

### 2. Geolocation Accuracy
- Free services have lower accuracy (50-100km)
- Paid services provide higher accuracy (5-15km)
- Consider accuracy when setting distance thresholds

### 3. Rate Limiting
- Built-in rate limiting for API endpoints
- Consider implementing additional rate limiting for geolocation requests

### 4. Data Retention
- Location data expires after 30 days by default
- Suspicious events expire after 7 days
- Trusted IPs expire after 1 year

## GDPR Compliance

The plugin provides GDPR compliance features:

```typescript
// Clear all location data for a user
DELETE /api/auth/location/clear/:userId

// Get user's location data
GET /api/auth/location/stats/:userId

// Export user data (implement as needed)
GET /api/auth/location/export/:userId
```

## Monitoring and Analytics

### Location Statistics
```typescript
const stats = await fetch('/api/auth/location/stats/user@example.com');
const { stats } = await stats.json();

console.log({
  totalLocations: stats.totalLocations,
  uniqueCountries: stats.uniqueCountries,
  uniqueCities: stats.uniqueCities,
  suspiciousEvents: stats.suspiciousEvents,
  trustedIPs: stats.trustedIPs,
  trustedDevices: stats.trustedDevices
});
```

### Suspicious Events
```typescript
const events = await fetch('/api/auth/location/suspicious/user@example.com');
const { events } = await events.json();

events.forEach(event => {
  console.log({
    id: event.id,
    reason: event.reason,
    confidence: event.confidence,
    location: event.currentLocation,
    timestamp: event.timestamp
  });
});
```

## Troubleshooting

### Common Issues

1. **Geolocation fails**: Check API keys and network connectivity
2. **Emails not sending**: Verify SMTP configuration
3. **Redis connection**: Ensure Redis is running and accessible
4. **High false positives**: Adjust distance thresholds and confidence levels

### Debug Mode

Enable debug logging:

```typescript
betterAuthLocationDetection({
  // ... config
  onLocationAnomalyDetected: async (event) => {
    console.log('Location detection debug:', event);
  }
})
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the examples directory

