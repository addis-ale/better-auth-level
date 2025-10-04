/**
 * Simple Plugin Test - Based on Better Auth Documentation
 * 
 * This tests if we can create a simple plugin that works
 */

const { betterAuth } = require("better-auth");
const { createAuthEndpoint } = require("better-auth/api");

// Create a simple test plugin based on the documentation
const testPlugin = () => {
  return {
    id: "test-plugin",
    endpoints: {
      getHelloWorld: createAuthEndpoint("/test/hello-world", {
        method: "GET",
      }, async (ctx) => {
        console.log('🔍 TEST: Hello World endpoint called!');
        return ctx.json({
          message: "Hello World"
        });
      })
    },
    hooks: {
      before: [{
        matcher: (context) => {
          console.log('🔍 TEST: Hook matcher called for path:', context.path);
          return context.path === "/api/auth/sign-in/email";
        },
        handler: async (ctx) => {
          console.log('🔍 TEST: Hook handler called!');
        }
      }]
    }
  };
};

console.log('🔍 Testing Simple Plugin...');

// Create auth instance with test plugin
const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: ":memory:"
  },
  plugins: [
    testPlugin()
  ]
});

// Check if plugin is loaded
console.log('🔍 Plugins loaded:', auth.plugins.map(p => p.id));

// Test the plugin
const plugin = auth.plugins.find(p => p.id === 'test-plugin');
if (plugin) {
  console.log('✅ Test plugin found:', plugin.id);
  console.log('✅ Plugin endpoints:', Object.keys(plugin.endpoints || {}));
  console.log('✅ Plugin hooks:', Object.keys(plugin.hooks || {}));
} else {
  console.log('❌ Test plugin not found!');
}

console.log('🔍 Simple plugin test completed!');
