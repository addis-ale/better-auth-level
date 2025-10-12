/**
 * Location Detection Test
 * 
 * This test demonstrates the location detection functionality
 */

const { betterAuthLocationDetection, detectSuspiciousLocation } = require('../dist/location-plugin');

// Mock configuration
const config = {
  enabled: true,
  distanceThreshold: 1000, // 1000km
  newCountryThreshold: 0.8,
  maxHistoryLocations: 50,
  verificationEmailEnabled: false, // Disable for testing
  autoBlockSuspicious: false,
  trustedLocationGracePeriod: 30,
  geolocationProvider: 'geoip-lite',
  onLocationAnomalyDetected: async (event) => {
    console.log('🚨 Suspicious location detected:', {
      userId: event.userId,
      reason: event.reason,
      confidence: event.confidence,
      currentLocation: event.currentLocation,
      previousLocation: event.previousLocation
    });
  }
};

// Test function
async function testLocationDetection() {
  console.log('🧪 Testing Location Detection Plugin...\n');

  try {
    // Test 1: Normal location (should not be suspicious)
    console.log('Test 1: Normal location detection');
    const result1 = await detectSuspiciousLocation(
      'user@example.com',
      '8.8.8.8', // Google DNS (US)
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      config
    );
    
    console.log('Result 1:', {
      suspicious: result1.suspicious,
      action: result1.action,
      location: result1.location ? {
        country: result1.location.country,
        city: result1.location.city,
        ip: result1.location.ip
      } : null
    });

    // Test 2: Same location again (should not be suspicious)
    console.log('\nTest 2: Same location again');
    const result2 = await detectSuspiciousLocation(
      'user@example.com',
      '8.8.8.8', // Same IP
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      config
    );
    
    console.log('Result 2:', {
      suspicious: result2.suspicious,
      action: result2.action
    });

    // Test 3: Different location (should be suspicious)
    console.log('\nTest 3: Different location (should be suspicious)');
    const result3 = await detectSuspiciousLocation(
      'user@example.com',
      '1.1.1.1', // Cloudflare DNS (different location)
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      config
    );
    
    console.log('Result 3:', {
      suspicious: result3.suspicious,
      action: result3.action,
      event: result3.event ? {
        reason: result3.event.reason,
        confidence: result3.event.confidence,
        distance: result3.event.distance
      } : null
    });

    console.log('\n✅ Location detection tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testLocationDetection();
}

module.exports = { testLocationDetection };

