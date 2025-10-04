/**
 * Simple test without Better Auth dependencies
 */

// Mock the manual tracking function
function trackFailedLoginManually(userId, ip, options = {}) {
  console.log('🔍 BETTER-AUTH-MONITOR: Manual tracking called for user:', userId);
  
  const now = Date.now();
  const windowMs = (options.failedLoginWindow || 10) * 60 * 1000;
  
  // Use a global storage for manual tracking
  if (!globalThis._manualFailedLogins) {
    globalThis._manualFailedLogins = new Map();
  }
  
  const existingAttempts = globalThis._manualFailedLogins.get(userId) || [];
  const recentAttempts = existingAttempts.filter((attempt) => 
    now - attempt.timestamp < windowMs
  );
  
  const newAttempt = { timestamp: now, ip, userId };
  const updatedAttempts = [...recentAttempts, newAttempt];
  globalThis._manualFailedLogins.set(userId, updatedAttempts);
  
  const threshold = options.failedLoginThreshold || 5;
  
  if (updatedAttempts.length >= threshold) {
    const event = {
      type: 'failed_login',
      userId,
      timestamp: new Date(now).toISOString(),
      ip,
      attempts: updatedAttempts.length
    };
    
    if (options.logger) {
      options.logger(event);
    } else {
      console.log(`[BETTER-AUTH-MONITOR] ${JSON.stringify(event)}`);
    }
  }
  
  return updatedAttempts.length;
}

console.log('🧪 Testing Manual Failed Login Tracking...\n');

// Test configuration
const testUser = 'test@example.com';
const testIP = '192.168.1.100';

// Test multiple failed attempts
async function testAttempts() {
  for (let i = 1; i <= 6; i++) {
    console.log(`Attempt ${i}: Simulating failed login for ${testUser}...`);
    
    const attemptCount = trackFailedLoginManually(testUser, testIP, {
      failedLoginThreshold: 5,
      failedLoginWindow: 10,
      logger: (event) => {
        console.log(`🚨 SECURITY ALERT: ${event.type}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Attempts: ${event.attempts}`);
        console.log(`   Time: ${event.timestamp}`);
        console.log('---');
      }
    });
    
    console.log(`   Current attempt count: ${attemptCount}`);
    console.log('');
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

testAttempts().then(() => {
  console.log('✅ Test completed! Check the alerts above.');
}).catch(console.error);
