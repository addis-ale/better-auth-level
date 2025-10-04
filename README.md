# Better Auth Monitor

A real-time monitoring plugin for Better Auth that automatically detects and logs suspicious authentication activities with zero UI setup and no external dependencies.

## Features

🔍 **Failed Login Detection** - Tracks multiple failed login attempts per user  
🌍 **Unusual Location Detection** - Flags logins from different countries  
🤖 **Bot Detection** - Identifies high-frequency automated login attempts  

## Installation

```bash
npm install better-auth-monitor
```

## Quick Start

### Server Setup

```typescript
import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "better-auth-monitor";

export const auth = betterAuth({
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 5,    // Alert after 5 failed attempts
      failedLoginWindow: 10,      // Within 10 minutes
      botDetectionThreshold: 10,  // Alert after 10 requests
      botDetectionWindow: 10,     // Within 10 seconds
    })
  ]
});
```

### Client Setup

```typescript
import { createAuthClient } from "better-auth/client";
import { betterAuthMonitorClient } from "better-auth-monitor";

const authClient = createAuthClient({
  plugins: [
    betterAuthMonitorClient()
  ]
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `failedLoginThreshold` | number | 5 | Failed attempts before alerting |
| `failedLoginWindow` | number | 10 | Time window in minutes |
| `botDetectionThreshold` | number | 10 | Requests before bot detection |
| `botDetectionWindow` | number | 10 | Time window in seconds |
| `enableLocationDetection` | boolean | true | Enable location monitoring |
| `enableFailedLoginMonitoring` | boolean | true | Enable failed login tracking |
| `enableBotDetection` | boolean | true | Enable bot detection |
| `logger` | function | console.log | Custom logging function |

## Security Events

The plugin logs three types of security events:

### Failed Login Attempts
```json
{
  "type": "failed_login",
  "userId": "user_123",
  "timestamp": "2025-01-04T12:30:00Z",
  "ip": "102.123.44.1",
  "attempts": 6
}
```

### Unusual Location Detection
```json
{
  "type": "unusual_location",
  "userId": "user_123", 
  "timestamp": "2025-01-04T13:00:00Z",
  "ip": "178.88.33.9",
  "previousCountry": "Ethiopia",
  "currentCountry": "Germany"
}
```

### Bot Activity Detection
```json
{
  "type": "bot_activity",
  "timestamp": "2025-01-04T13:15:00Z",
  "ip": "102.123.44.1",
  "requestRate": "25 attempts/10s"
}
```

## Custom Logging

```typescript
import { betterAuthMonitor } from "better-auth-monitor";

const auth = betterAuth({
  plugins: [
    betterAuthMonitor({
      logger: (event) => {
        // Send to your monitoring service
        fetch('https://your-monitoring-service.com/events', {
          method: 'POST',
          body: JSON.stringify(event)
        });
      }
    })
  ]
});
```

## Client API

```typescript
// Get security events
const events = await authClient.getSecurityEvents({ 
  limit: 50, 
  type: 'failed_login' 
});

// Get monitoring statistics
const stats = await authClient.getMonitoringStats();
```

## Requirements

- Better Auth ^0.8.0
- Node.js ^18.0.0

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.
