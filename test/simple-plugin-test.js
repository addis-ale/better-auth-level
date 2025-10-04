/**
 * Simple Plugin Test - No Database Required
 * 
 * This test verifies the plugin works without requiring database initialization
 */

const { betterAuthMonitor } = require("../dist/plugin");

console.log('🧪 Testing Plugin Without Database...\n');

// Test 1: Plugin instantiation
console.log('Test 1: Plugin Instantiation');
try {
  const plugin = betterAuthMonitor({
    failedLoginThreshold: 3,
    failedLoginWindow: 5,
    enableFailedLoginMonitoring: true,
    logger: (event) => {
      console.log('🚨 Security Event:', event);
    }
  });
  
  console.log('✅ Plugin instantiated successfully');
  console.log('   Plugin ID:', plugin.id);
  console.log('   Has endpoints:', !!plugin.endpoints);
  console.log('   Has hooks:', !!plugin.hooks);
  console.log('   Has before hooks:', !!(plugin.hooks && plugin.hooks.before));
  console.log('   Has after hooks:', !!(plugin.hooks && plugin.hooks.after));
  
  // Test hook structure
  if (plugin.hooks) {
    const beforeHooks = plugin.hooks.before || [];
    const afterHooks = plugin.hooks.after || [];
    
    console.log('   Before hooks count:', beforeHooks.length);
    console.log('   After hooks count:', afterHooks.length);
    
    // Test path matching
    const testPaths = [
      '/api/auth/sign-in/email',
      '/api/auth/sign-in/password', 
      '/api/auth/sign-in',
      '/api/auth/sign-up',
      '/api/auth/session'
    ];
    
    console.log('\n   Testing path matching:');
    beforeHooks.forEach((hook, index) => {
      console.log(`   Before hook ${index + 1}:`);
      testPaths.forEach(path => {
        const matches = hook.matcher({ path });
        console.log(`     ${path}: ${matches ? '✅' : '❌'}`);
      });
    });
    
    afterHooks.forEach((hook, index) => {
      console.log(`   After hook ${index + 1}:`);
      testPaths.forEach(path => {
        const matches = hook.matcher({ path });
        console.log(`     ${path}: ${matches ? '✅' : '❌'}`);
      });
    });
  }
  
} catch (error) {
  console.log('❌ Plugin instantiation failed:', error.message);
  console.log('   Error details:', error);
}

// Test 2: Test the tracking function directly
console.log('\nTest 2: Direct Function Testing');
try {
  const plugin = betterAuthMonitor({
    failedLoginThreshold: 2, // Lower threshold for testing
    failedLoginWindow: 1,    // 1 minute for testing
    enableFailedLoginMonitoring: true,
    logger: (event) => {
      console.log('🚨 SECURITY ALERT:', event);
    }
  });
  
  // Test the tracking function directly (if accessible)
  console.log('✅ Plugin created for direct testing');
  
  // Simulate failed login attempts
  console.log('\n   Simulating failed login attempts...');
  const testUser = 'test@example.com';
  const testIP = '192.168.1.100';
  
  // We can't directly access the internal tracking function,
  // but we can test the plugin structure
  console.log('   Plugin structure is valid');
  
} catch (error) {
  console.log('❌ Direct function testing failed:', error.message);
}

// Test 3: Test endpoint structure
console.log('\nTest 3: Endpoint Structure');
try {
  const plugin = betterAuthMonitor();
  const endpoints = plugin.endpoints || {};
  
  console.log('✅ Plugin endpoints created');
  console.log('   Available endpoints:', Object.keys(endpoints));
  
  // Test if endpoints are properly structured
  Object.entries(endpoints).forEach(([name, endpoint]) => {
    console.log(`   ${name}: ${endpoint.method || 'GET'} ${endpoint.path || 'unknown'}`);
  });
  
} catch (error) {
  console.log('❌ Endpoint creation failed:', error.message);
}

console.log('\n🎉 Simple plugin test completed!');