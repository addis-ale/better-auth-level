/**
 * Test Script for Real Application
 * 
 * Run this to test your Better Auth Monitor in a real app
 * 
 * Usage: node test/test-script.js
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE = 'http://localhost:3000/api/auth'; // Adjust to your app
const TEST_USER = 'test@example.com';
const TEST_PASSWORD = 'wrongpassword'; // Use wrong password to trigger failed logins

async function testFailedLogins() {
  console.log('🧪 Testing Failed Login Detection in Real App...\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test User: ${TEST_USER}`);
  console.log(`Using wrong password to trigger failed logins\n`);

  // Test 1: Multiple failed login attempts
  console.log('📝 Test 1: Simulating failed login attempts...');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`Attempt ${i}: Sending failed login request...`);
    
    try {
      const response = await fetch(`${API_BASE}/sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER,
          password: TEST_PASSWORD
        })
      });
      
      const data = await response.json();
      
      if (response.status === 401) {
        console.log(`   ✅ Failed login detected (401) - monitoring plugin should track this`);
      } else {
        console.log(`   ⚠️  Unexpected response: ${response.status}`);
      }
      
      // Wait 1 second between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n📊 Test 2: Checking security events...');
  
  try {
    const response = await fetch(`${API_BASE}/monitor/events`);
    const data = await response.json();
    
    if (data.events && data.events.length > 0) {
      console.log(`   ✅ Found ${data.events.length} security events:`);
      data.events.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.type}: ${event.userId} (${event.attempts} attempts)`);
      });
    } else {
      console.log('   ⚠️  No security events found - check your plugin configuration');
    }
  } catch (error) {
    console.log(`   ❌ Failed to fetch events: ${error.message}`);
  }
  
  console.log('\n✅ Test completed!');
  console.log('📝 Check your console/logs for security alerts from the monitoring plugin.');
}

// Run the test
testFailedLogins().catch(console.error);
