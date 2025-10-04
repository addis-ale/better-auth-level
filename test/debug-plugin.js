/**
 * Debug Plugin Test
 * 
 * This tests if the Better Auth Monitor plugin is working
 */

const { betterAuth } = require("better-auth");
const { betterAuthMonitor } = require("../dist/plugin");

console.log('🔍 Testing Better Auth Monitor Plugin...');

// Create auth instance with monitoring
const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: ":memory:"
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 2,
      logger: (event) => {
        console.log(`🚨 SECURITY ALERT: ${event.type}`);
      }
    })
  ]
});

// Check if plugin is loaded
console.log('🔍 Plugins loaded:', auth.plugins.map(p => p.id));

// Test the plugin directly
const plugin = auth.plugins.find(p => p.id === 'better-auth-monitor');
if (plugin) {
  console.log('✅ Plugin found:', plugin.id);
  console.log('✅ Plugin hooks:', Object.keys(plugin.hooks || {}));
  console.log('✅ Plugin endpoints:', Object.keys(plugin.endpoints || {}));
} else {
  console.log('❌ Plugin not found!');
}

console.log('🔍 Test completed!');
