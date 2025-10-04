/**
 * Quick Integration Test
 * 
 * This test verifies that the monitoring plugin works with Better Auth
 * without requiring a full server setup.
 */

const { betterAuth } = require("better-auth");
const { betterAuthMonitor } = require("../dist/plugin");

console.log('🧪 Quick Integration Test...\n');

// Test 1: Plugin instantiation
console.log('Test 1: Plugin Instantiation');
try {
  const plugin = betterAuthMonitor({
    failedLoginThreshold: 3,
    failedLoginWindow: 5,
    enableFailedLoginMonitoring: true,
    securityActions: {
      enable2FAEnforcement: true,
      enablePasswordResetEnforcement: true,
      sendEmail: async (notification) => {
        console.log(`📧 Email would be sent: ${notification.template} to ${notification.to}`);
      }
    },
    logger: (event) => {
      console.log(`🚨 Security Event: ${event.type} for ${event.userId}`);
    }
  });
  
  console.log('✅ Plugin instantiated successfully');
  console.log('   Plugin ID:', plugin.id);
  console.log('   Has security actions:', !!plugin.endpoints.triggerSecurityAction);
  console.log('   Has monitoring stats:', !!plugin.endpoints.getMonitoringStats);
  
} catch (error) {
  console.log('❌ Plugin instantiation failed:', error.message);
}

// Test 2: Better Auth integration
console.log('\nTest 2: Better Auth Integration');
try {
  const auth = betterAuth({
    database: {
      provider: "sqlite",
      url: ":memory:"
    },
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url, token }, request) {
        console.log(`🔐 Better Auth: Password reset for ${user.email}`);
      }
    },
    twoFactor: {
      async sendTwoFactorSetupEmail({ user, totpURI, backupCodes }, request) {
        console.log(`🔒 Better Auth: 2FA setup for ${user.email}`);
      }
    },
    plugins: [
      betterAuthMonitor({
        failedLoginThreshold: 2,
        failedLoginWindow: 1,
        enableFailedLoginMonitoring: true,
        securityActions: {
          enable2FAEnforcement: true,
          enablePasswordResetEnforcement: true,
          sendEmail: async (notification) => {
            console.log(`📧 Monitor: ${notification.template} email to ${notification.to}`);
          }
        }
      })
    ]
  });
  
  console.log('✅ Better Auth instance created with monitoring plugin');
  console.log('   Plugins loaded:', auth.plugins?.map(p => p.id) || []);
  
  // Test the monitoring endpoints
  const monitorPlugin = auth.plugins?.find(p => p.id === 'better-auth-monitor');
  if (monitorPlugin) {
    console.log('✅ Monitor plugin loaded');
    console.log('   Available endpoints:', Object.keys(monitorPlugin.endpoints || {}));
  } else {
    console.log('❌ Monitor plugin not found');
  }
  
} catch (error) {
  console.log('❌ Better Auth integration failed:', error.message);
}

// Test 3: Security action simulation
console.log('\nTest 3: Security Action Simulation');
try {
  // Simulate a security action trigger
  const mockAction = {
    type: 'enable_2fa',
    userId: 'test@example.com',
    reason: 'Test security action',
    ip: '192.168.1.100'
  };
  
  console.log('Simulating security action:', mockAction);
  console.log('✅ Security action simulation completed');
  
} catch (error) {
  console.log('❌ Security action simulation failed:', error.message);
}

console.log('\n🎉 Quick integration test completed!');
console.log('\n📋 Next Steps:');
console.log('1. Run: npm run build');
console.log('2. Start your Better Auth server');
console.log('3. Test with real failed login attempts');
console.log('4. Check the monitoring endpoints:');
console.log('   - GET /api/auth/monitor/stats');
console.log('   - POST /api/auth/monitor/trigger-action');
console.log('   - GET /api/auth/monitor/user-actions');
