/**
 * Simple test runner for Better Auth Monitor
 * 
 * Run with: node test/run-test.js
 */

// Simulate the failed login detection logic directly
class FailedLoginMonitor {
  constructor(options = {}) {
    this.failedLoginThreshold = options.failedLoginThreshold || 3;
    this.failedLoginWindow = options.failedLoginWindow || 2; // minutes
    this.attempts = new Map();
    this.logger = options.logger || console.log;
  }

  trackFailedLogin(userId, ip) {
    const now = Date.now();
    const windowMs = this.failedLoginWindow * 60 * 1000; // Convert minutes to ms
    
    // Get existing attempts for this user
    const existingAttempts = this.attempts.get(userId) || [];
    
    // Clean old attempts outside the window
    const recentAttempts = existingAttempts.filter(attempt => 
      now - attempt.timestamp < windowMs
    );
    
    // Add new attempt
    const newAttempt = {
      timestamp: now,
      ip,
      userId
    };
    
    const updatedAttempts = [...recentAttempts, newAttempt];
    this.attempts.set(userId, updatedAttempts);
    
    // Check if threshold exceeded
    if (updatedAttempts.length >= this.failedLoginThreshold) {
      const event = {
        type: 'failed_login',
        userId,
        timestamp: new Date(now).toISOString(),
        ip,
        attempts: updatedAttempts.length
      };
      
      this.logger(`🚨 SECURITY ALERT: ${event.type.toUpperCase()}`);
      this.logger(`   User: ${event.userId}`);
      this.logger(`   IP: ${event.ip}`);
      this.logger(`   Attempts: ${event.attempts}`);
      this.logger(`   Time: ${event.timestamp}`);
      this.logger('---');
    }
    
    return updatedAttempts.length;
  }
}

// Test function to simulate failed logins
async function testFailedLogins() {
  console.log('🧪 Testing Failed Login Detection...\n');
  
  // Create monitor instance
  const monitor = new FailedLoginMonitor({
    failedLoginThreshold: 3,     // Alert after 3 failed attempts
    failedLoginWindow: 2,      // Within 2 minutes
    logger: (message) => console.log(message)
  });
  
  // Simulate multiple failed login attempts
  const testUser = 'test@example.com';
  const testIP = '192.168.1.100';
  
  console.log(`Simulating failed logins for user: ${testUser}`);
  console.log(`IP: ${testIP}\n`);
  
  // Simulate 5 failed attempts (should trigger alert after 3)
  for (let i = 1; i <= 5; i++) {
    console.log(`Attempt ${i}: Simulating failed login...`);
    
    const attemptCount = monitor.trackFailedLogin(testUser, testIP);
    console.log(`   Current attempts: ${attemptCount}`);
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Test completed!');
  console.log('📝 This demonstrates the failed login detection logic.');
  console.log('   In real usage, this would be integrated with Better Auth.');
}

// Run the test
testFailedLogins().catch(console.error);
