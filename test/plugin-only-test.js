/**
 * Plugin-Only Test
 * 
 * This test only tests the plugin without Better Auth integration
 */

console.log('🧪 Testing Plugin Only (No Better Auth)...\n');

// Test 1: Check if we can require the plugin
console.log('Test 1: Plugin Import');
try {
  const { betterAuthMonitor } = require("../dist/plugin");
  console.log('✅ Plugin imported successfully');
  console.log('   Plugin function type:', typeof betterAuthMonitor);
} catch (error) {
  console.log('❌ Plugin import failed:', error.message);
  console.log('   Error details:', error);
  process.exit(1);
}

// Test 2: Plugin instantiation
console.log('\nTest 2: Plugin Instantiation');
try {
  const { betterAuthMonitor } = require("../dist/plugin");
  
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
  console.log('   Plugin type:', typeof plugin);
  console.log('   Has endpoints:', !!plugin.endpoints);
  console.log('   Has hooks:', !!plugin.hooks);
  
  if (plugin.hooks) {
    console.log('   Has before hooks:', !!(plugin.hooks.before));
    console.log('   Has after hooks:', !!(plugin.hooks.after));
    console.log('   Before hooks count:', (plugin.hooks.before || []).length);
    console.log('   After hooks count:', (plugin.hooks.after || []).length);
  }
  
} catch (error) {
  console.log('❌ Plugin instantiation failed:', error.message);
  console.log('   Error details:', error);
}

// Test 3: Test hook matchers
console.log('\nTest 3: Hook Matchers');
try {
  const { betterAuthMonitor } = require("../dist/plugin");
  
  const plugin = betterAuthMonitor();
  const beforeHooks = plugin.hooks?.before || [];
  const afterHooks = plugin.hooks?.after || [];
  
  console.log('✅ Hooks found');
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
      try {
        const matches = hook.matcher({ path });
        console.log(`     ${path}: ${matches ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`     ${path}: ❌ Error - ${error.message}`);
      }
    });
  });
  
  afterHooks.forEach((hook, index) => {
    console.log(`   After hook ${index + 1}:`);
    testPaths.forEach(path => {
      try {
        const matches = hook.matcher({ path });
        console.log(`     ${path}: ${matches ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`     ${path}: ❌ Error - ${error.message}`);
      }
    });
  });
  
} catch (error) {
  console.log('❌ Hook matcher testing failed:', error.message);
  console.log('   Error details:', error);
}

// Test 4: Test endpoints
console.log('\nTest 4: Endpoints');
try {
  const { betterAuthMonitor } = require("../dist/plugin");
  
  const plugin = betterAuthMonitor();
  const endpoints = plugin.endpoints || {};
  
  console.log('✅ Endpoints found');
  console.log('   Available endpoints:', Object.keys(endpoints));
  
  Object.entries(endpoints).forEach(([name, endpoint]) => {
    console.log(`   ${name}: ${endpoint.method || 'GET'} ${endpoint.path || 'unknown'}`);
  });
  
} catch (error) {
  console.log('❌ Endpoint testing failed:', error.message);
  console.log('   Error details:', error);
}

console.log('\n🎉 Plugin-only test completed!');
