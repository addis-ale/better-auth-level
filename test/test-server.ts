/**
 * Test Server for Better Auth Monitor
 * 
 * This creates a simple test server to verify the monitoring functionality
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";

// Create auth instance with monitoring
export const auth = betterAuth({
  database: {
    // In-memory database for testing
    provider: "sqlite",
    url: ":memory:"
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,     // Alert after 3 failed attempts
      failedLoginWindow: 2,        // Within 2 minutes
      enableFailedLoginMonitoring: true,
      
      // Custom logger for testing
      logger: (event) => {
        console.log(`🚨 SECURITY ALERT: ${event.type.toUpperCase()}`);
        console.log(`   User: ${event.userId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Attempts: ${event.attempts}`);
        console.log(`   Time: ${event.timestamp}`);
        console.log('---');
      }
    })
  ]
});

// Test function to simulate failed logins
export const testFailedLogins = async () => {
  console.log('🧪 Testing Failed Login Detection...\n');
  
  // Simulate multiple failed login attempts
  const testUser = 'test@example.com';
  const testIP = '192.168.1.100';
  
  console.log(`Simulating failed logins for user: ${testUser}`);
  console.log(`IP: ${testIP}\n`);
  
  // Simulate 5 failed attempts (should trigger alert after 3)
  for (let i = 1; i <= 5; i++) {
    console.log(`Attempt ${i}: Simulating failed login...`);
    
    // This would normally be called by Better Auth's hook system
    // For testing, we'll call the tracking function directly
    const plugin = auth.plugins.find(p => p.id === 'better-auth-monitor');
    if (plugin && 'trackFailedLogin' in plugin) {
      // @ts-ignore - accessing internal function for testing
      plugin.trackFailedLogin(testUser, testIP);
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✅ Test completed! Check the alerts above.');
};

// Run test if this file is executed directly
if (require.main === module) {
  testFailedLogins().catch(console.error);
}
