# Real Usage Scenarios - Better Auth Monitor

## 🔐 **Scenario 1: Failed Login Attack**

**What happens in real usage:**

```typescript
// User tries to login with wrong password
POST /api/auth/sign-in
{
  "email": "user@example.com",
  "password": "wrongpassword"
}

// Better Auth returns 401 Unauthorized
// Plugin automatically tracks this attempt
```

**After 5 failed attempts in 10 minutes:**
```json
🚨 SECURITY ALERT: FAILED_LOGIN
{
  "type": "failed_login",
  "userId": "user@example.com",
  "timestamp": "2025-01-04T12:30:00Z",
  "ip": "192.168.1.100",
  "attempts": 5
}
```

## 🤖 **Scenario 2: Bot Attack**

**What happens in real usage:**

```typescript
// Bot makes rapid requests
for (let i = 0; i < 25; i++) {
  fetch('/api/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@test.com', password: 'fake' })
  });
}
```

**After 20 requests in 30 seconds:**
```json
🚨 SECURITY ALERT: BOT_ACTIVITY
{
  "type": "bot_activity",
  "timestamp": "2025-01-04T12:30:00Z",
  "ip": "192.168.1.100",
  "requestRate": "25 attempts/30s"
}
```

## 🌍 **Scenario 3: Unusual Location**

**What happens in real usage:**

```typescript
// User normally logs in from New York
// Suddenly logs in from Germany
POST /api/auth/sign-in
{
  "email": "user@example.com",
  "password": "correctpassword"
}
// Login succeeds, but location is different
```

**Location change detected:**
```json
🚨 SECURITY ALERT: UNUSUAL_LOCATION
{
  "type": "unusual_location",
  "userId": "user@example.com",
  "timestamp": "2025-01-04T12:30:00Z",
  "ip": "178.88.33.9",
  "previousCountry": "United States",
  "currentCountry": "Germany"
}
```

## 🛡️ **Real Integration Benefits**

### **Automatic Detection**
- ✅ **Zero configuration** - Works out of the box
- ✅ **Non-intrusive** - Doesn't block legitimate users
- ✅ **Real-time** - Alerts immediately when thresholds exceeded

### **Production Ready**
- ✅ **Scalable** - In-memory storage for high performance
- ✅ **Configurable** - Adjust thresholds per environment
- ✅ **Extensible** - Easy to add custom logging/webhooks

### **Security Monitoring**
- ✅ **Failed Login Tracking** - Prevents brute force attacks
- ✅ **Bot Detection** - Identifies automated attacks
- ✅ **Location Monitoring** - Detects account compromise

## 📊 **Monitoring Dashboard Integration**

```typescript
// Get security events via API
const response = await fetch('/api/auth/monitor/events');
const { events } = await response.json();

// Display in your admin dashboard
events.forEach(event => {
  console.log(`${event.type}: ${event.userId} from ${event.ip}`);
});
```

## 🔧 **Custom Alerting**

```typescript
// Send to Slack
logger: (event) => {
  if (event.type === 'failed_login') {
    slack.send({
      channel: '#security',
      text: `🚨 Failed login alert: ${event.userId} (${event.attempts} attempts)`
    });
  }
}

// Send to monitoring service
logger: (event) => {
  datadog.increment('security.failed_login', 1, {
    user: event.userId,
    ip: event.ip
  });
}
```

The plugin works **automatically** in the background - you just add it to your Better Auth configuration and it starts monitoring immediately!
