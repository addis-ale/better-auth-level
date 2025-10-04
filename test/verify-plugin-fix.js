/**
 * Plugin Fix Verification Test
 * 
 * This test verifies that the plugin fixes work correctly
 */

const { betterAuth } = require("better-auth");
const { betterAuthMonitor } = require("../dist/plugin");

console.log('🔧 Verifying Plugin Fixes...\n');

// Test 1: Check if plugin can be instantiated
console.log('Test 1: Plugin Instantiation');
try {
  const plugin = betterAuthMonitor({
    failedLoginThreshold: 3,
    failedLoginWindow: 5,
    enableFailedLoginMonitoring: true
  });
  
  console.log('✅ Plugin instantiated successfully');
  console.log('   Plugin ID:', plugin.id);
  console.log('   Has endpoints:', !!plugin.endpoints);
  console.log('   Has hooks:', !!plugin.hooks);
  console.log('   Has before hooks:', !!(plugin.hooks && plugin.hooks.before));
  console.log('   Has after hooks:', !!(plugin.hooks && plugin.hooks.after));
} catch (error) {
  console.log('❌ Plugin instantiation failed:', error.message);
}

// Test 2: Check if plugin can be added to Better Auth
console.log('\nTest 2: Better Auth Integration');
try {
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
        failedLoginWindow: 5,
        enableFailedLoginMonitoring: true
      })
    ]
  });
  
  console.log('✅ Better Auth instance created with plugin');
  
  // Check if plugin is loaded
  const plugins = auth.plugins || [];
  const monitorPlugin = plugins.find(p => p.id === 'better-auth-monitor');
  
  if (monitorPlugin) {
    console.log('✅ Monitor plugin loaded in Better Auth');
    
    // Test hook matchers
    const beforeHooks = monitorPlugin.hooks?.before || [];
    const afterHooks = monitorPlugin.hooks?.after || [];
    
    console.log('   Before hooks:', beforeHooks.length);
    console.log('   After hooks:', afterHooks.length);
    
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
    
  } else {
    console.log('❌ Monitor plugin not found in Better Auth');
  }
  
} catch (error) {
  console.log('❌ Better Auth integration failed:', error.message);
}

// Test 3: Check endpoint creation
console.log('\nTest 3: Endpoint Creation');
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

console.log('\n🎉 Plugin fix verification completed!');
