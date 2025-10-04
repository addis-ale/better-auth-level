/**
 * Better Auth Integration Test
 * 
 * This test verifies that the plugin works correctly with the actual Better Auth system
 */

const { betterAuth } = require("better-auth");
const { betterAuthMonitor } = require("../dist/plugin");

console.log('🧪 Testing Better Auth Monitor Integration...\n');

// Create auth instance with monitoring plugin
const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: ":memory:"
  },
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 2, // 2 minutes for quick testing
      enableFailedLoginMonitoring: true,
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
async function testFailedLoginDetection() {
  console.log('🔍 Testing Failed Login Detection...\n');
  
  const testUser = 'test@example.com';
  const testIP = '192.168.1.100';
  
  console.log(`Simulating failed logins for user: ${testUser}`);
  console.log(`IP: ${testIP}\n`);
  
  // Simulate multiple failed login attempts
  for (let i = 1; i <= 5; i++) {
    console.log(`Attempt ${i}: Simulating failed login...`);
    
    try {
      // This should trigger the monitoring hooks
      await auth.api.signInEmail({
        body: { 
          email: testUser, 
          password: 'wrongpassword' 
        }
      });
    } catch (error) {
      // Expected to fail - this should trigger monitoring
      console.log(`   Login failed as expected: ${error.message}`);
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✅ Failed login test completed!');
}

// Test function to check plugin endpoints
async function testPluginEndpoints() {
  console.log('\n🔍 Testing Plugin Endpoints...\n');
  
  try {
    // Test the security events endpoint
    const response = await auth.api.getSecurityEvents();
    console.log('Security events endpoint response:', response);
    console.log('✅ Security events endpoint working');
  } catch (error) {
    console.log('❌ Security events endpoint failed:', error.message);
  }
}

// Test function to verify plugin is loaded
function testPluginLoading() {
  console.log('🔍 Testing Plugin Loading...\n');
  
  // Check if plugin is loaded
  const plugins = auth.plugins || [];
  console.log('Loaded plugins:', plugins.map(p => p.id));
  
  const monitorPlugin = plugins.find(p => p.id === 'better-auth-monitor');
  if (monitorPlugin) {
    console.log('✅ Monitor plugin found');
    console.log('✅ Plugin endpoints:', Object.keys(monitorPlugin.endpoints || {}));
    console.log('✅ Plugin hooks:', Object.keys(monitorPlugin.hooks || {}));
  } else {
    console.log('❌ Monitor plugin not found!');
  }
}

// Run all tests
async function runTests() {
  try {
    testPluginLoading();
    await testPluginEndpoints();
    await testFailedLoginDetection();
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { auth, testFailedLoginDetection, testPluginEndpoints, testPluginLoading };
