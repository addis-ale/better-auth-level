/**
 * Simple Test Server for Better Auth Monitor
 * 
 * Run with: node test/simple-server.js
 * Then use curl commands to test
 */

const express = require('express');
const cors = require('cors');

// Mock Better Auth Monitor for testing
class MockBetterAuthMonitor {
  constructor() {
    this.attempts = new Map();
    this.threshold = 3;
    this.window = 2 * 60 * 1000; // 2 minutes
  }

  trackFailedLogin(userId, ip) {
    const now = Date.now();
    const existingAttempts = this.attempts.get(userId) || [];
    
    // Clean old attempts
    const recentAttempts = existingAttempts.filter(attempt => 
      now - attempt.timestamp < this.window
    );
    
    // Add new attempt
    const newAttempt = { timestamp: now, ip, userId };
    const updatedAttempts = [...recentAttempts, newAttempt];
    this.attempts.set(userId, updatedAttempts);
    
    // Check threshold
    if (updatedAttempts.length >= this.threshold) {
      console.log(`🚨 SECURITY ALERT: FAILED_LOGIN`);
      console.log(`   User: ${userId}`);
      console.log(`   IP: ${ip}`);
      console.log(`   Attempts: ${updatedAttempts.length}`);
      console.log(`   Time: ${new Date(now).toISOString()}`);
      console.log('---');
    }
    
    return updatedAttempts.length;
  }

  getEvents() {
    const events = [];
    for (const [userId, attempts] of this.attempts.entries()) {
      if (attempts.length >= this.threshold) {
        const latest = attempts[attempts.length - 1];
        events.push({
          type: 'failed_login',
          userId,
          timestamp: new Date(latest.timestamp).toISOString(),
          ip: latest.ip,
          attempts: attempts.length
        });
      }
    }
    return events;
  }
}

const app = express();
const monitor = new MockBetterAuthMonitor();

app.use(cors());
app.use(express.json());

// Mock login endpoint
app.post('/api/auth/sign-in', (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  console.log(`📝 Login attempt: ${email} from ${ip}`);
  
  // Simulate failed login (wrong password)
  if (password !== 'correctpassword') {
    const attempts = monitor.trackFailedLogin(email, ip);
    console.log(`   Failed login - attempt ${attempts}`);
    
    return res.status(401).json({ 
      error: "Invalid credentials",
      attempts: attempts
    });
  }
  
  // Successful login
  console.log(`   ✅ Successful login`);
  res.json({ success: true, user: { email } });
});

// Security events endpoint
app.get('/api/auth/monitor/events', (req, res) => {
  const events = monitor.getEvents();
  res.json({ events });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', monitor: 'active' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📝 Try these curl commands:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/auth/sign-in \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"email":"test@example.com","password":"wrongpassword"}'`);
  console.log(`\n   # Repeat 3+ times to trigger security alert`);
  console.log(`\n   # Check events: curl http://localhost:${PORT}/api/auth/monitor/events`);
});
