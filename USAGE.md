# Better Auth Monitor - Usage Guide

## 🚀 **Quick Start**

### **Installation**
```bash
npm install better-auth-monitor
```

### **Basic Setup**
```typescript
import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "better-auth-monitor";

export const auth = betterAuth({
  database: {
    // Your database configuration
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 5,     // Alert after 5 failed attempts
      failedLoginWindow: 10,       // Within 10 minutes
      botDetectionThreshold: 20,  // Alert after 20 requests
      botDetectionWindow: 30,      // Within 30 seconds
    })
  ]
});
```

### **Client Setup**
```typescript
import { createAuthClient } from "better-auth/client";
import { betterAuthMonitorClient } from "better-auth-monitor";

const authClient = createAuthClient({
  baseURL: "http://localhost:3000/api/auth",
  plugins: [
    betterAuthMonitorClient()
  ]
});
```

## 🔧 **Configuration Options**

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

## 📊 **Security Events**

### **Failed Login Detection**
```json
{
  "type": "failed_login",
  "userId": "user@example.com",
  "timestamp": "2025-01-04T12:30:00Z",
  "ip": "192.168.1.100",
  "attempts": 6
}
```

### **Bot Activity Detection**
```json
{
  "type": "bot_activity",
  "timestamp": "2025-01-04T12:30:00Z",
  "ip": "192.168.1.100",
  "requestRate": "25 attempts/10s"
}
```

### **Unusual Location Detection**
```json
{
  "type": "unusual_location",
  "userId": "user@example.com",
  "timestamp": "2025-01-04T12:30:00Z",
  "ip": "178.88.33.9",
  "previousCountry": "United States",
  "currentCountry": "Germany"
}
```

## 🛠️ **Advanced Usage**

### **Custom Logging**
```typescript
betterAuthMonitor({
  logger: (event) => {
    // Send to monitoring service
    fetch('https://your-monitoring-service.com/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
    
    // Send to Slack
    if (event.type === 'failed_login') {
      slack.send({
        channel: '#security',
        text: `🚨 Failed login alert: ${event.userId}`
      });
    }
  }
})
```

### **API Endpoints**
```typescript
// Get security events
const events = await fetch('/api/auth/monitor/events');
const { events } = await events.json();
```

## 🔍 **Testing**

### **Test Failed Logins**
```bash
# Make failed login requests
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# Repeat 3+ times to trigger alert
```

### **Check Security Events**
```bash
curl http://localhost:3000/api/auth/monitor/events
```

## 📈 **Production Tips**

1. **Set appropriate thresholds** for your use case
2. **Configure custom logging** to your monitoring service
3. **Monitor the `/monitor/events` endpoint** for security dashboard
4. **Test thoroughly** before deploying to production

## 🆘 **Troubleshooting**

### **No Alerts Appearing?**
- Check if the plugin is properly imported
- Verify Better Auth version compatibility
- Check console for any errors

### **Plugin Not Working?**
- Ensure Better Auth is properly configured
- Check if the plugin is in the plugins array
- Verify database connection

## 📚 **Resources**

- [Better Auth Documentation](https://www.better-auth.com)
- [GitHub Repository](https://github.com/yourusername/better-auth-monitor)
- [NPM Package](https://www.npmjs.com/package/better-auth-monitor)
- [Report Issues](https://github.com/yourusername/better-auth-monitor/issues)
