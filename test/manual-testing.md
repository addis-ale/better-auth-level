# Manual Testing Guide - Better Auth Monitor

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Add Plugin to Your App**

```typescript
// In your existing Better Auth config
import { betterAuthMonitor } from "better-auth-monitor";

export const auth = betterAuth({
  // Your existing config...
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,     // Alert after 3 attempts
      failedLoginWindow: 2,         // Within 2 minutes
      logger: (event) => {
        console.log(`🚨 SECURITY ALERT: ${event.type}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Attempts: ${event.attempts}`);
      }
    })
  ]
});
```

### **Step 2: Test Failed Logins**

**Option A: Use your login form**
1. Go to your login page
2. Enter a **wrong password** 3+ times
3. Check your console/logs for security alerts

**Option B: Use the test script**
```bash
# Install node-fetch if needed
npm install node-fetch

# Run the test script
node test/test-script.js
```

**Option C: Manual API calls**
```bash
# Make failed login requests
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# Repeat 3+ times and check console for alerts
```

## 🔍 **What to Look For**

### **Console Output**
```
🚨 SECURITY ALERT: FAILED_LOGIN
   User: test@example.com
   IP: 192.168.1.100
   Attempts: 3
   Time: 2025-01-04T12:30:00Z
---
```

### **API Endpoint**
```bash
# Check security events
curl http://localhost:3000/api/auth/monitor/events
```

Response:
```json
{
  "events": [
    {
      "type": "failed_login",
      "userId": "test@example.com",
      "timestamp": "2025-01-04T12:30:00Z",
      "ip": "192.168.1.100",
      "attempts": 3
    }
  ]
}
```

## 🛠️ **Troubleshooting**

### **No Alerts Appearing?**
1. **Check plugin is loaded:**
   ```typescript
   console.log('Plugins:', auth.plugins.map(p => p.id));
   // Should show: ["better-auth-monitor"]
   ```

2. **Check endpoint paths:**
   - Make sure your login endpoint matches the plugin's matcher
   - Default paths: `/api/auth/sign-in`, `/api/auth/sign-in/email`

3. **Check console for errors:**
   - Look for any TypeScript/build errors
   - Check if the plugin is properly imported

### **Plugin Not Working?**
1. **Verify Better Auth version:**
   ```bash
   npm list better-auth
   # Should be ^0.8.0 or higher
   ```

2. **Check import path:**
   ```typescript
   // Make sure you're importing from the right place
   import { betterAuthMonitor } from "better-auth-monitor";
   // or
   import { betterAuthMonitor } from "./src/plugin";
   ```

## 📊 **Testing Different Scenarios**

### **Failed Login Attack**
```bash
# Simulate brute force attack
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"wrong"}'
  sleep 1
done
```

### **Bot Detection**
```bash
# Rapid requests (if bot detection is implemented)
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"fake"}' &
done
```

## ✅ **Success Indicators**

- ✅ **Console alerts** appear after threshold exceeded
- ✅ **API endpoint** returns security events
- ✅ **No impact** on normal login functionality
- ✅ **Real-time monitoring** works automatically

The plugin should work **immediately** after adding it to your Better Auth configuration!
