/**
 * Location Detection Test Suite
 * 
 * This tests the complete unusual location detection functionality
 */

import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "../src/plugin";
import { LocationDetectionService } from "../src/location-detection";

// Test configuration
const testConfig = {
  failedLoginThreshold: 3,
  failedLoginWindow: 5,
  enableLocationDetection: true,
  maxNormalDistance: 1000,
  locationAnomalyWindow: 24,
  minLocationHistory: 2,
  enableVpnDetection: true,
  enableTorDetection: true,
  enableSuspiciousCountryDetection: true,
  suspiciousCountries: ['KP', 'IR', 'SY'],
  enableImpossibleTravelDetection: true,
  maxTravelSpeed: 900,
  enableNewCountryDetection: true,
  enableNewCityDetection: true,
  enableTimezoneAnomalyDetection: true,
  logger: (event: any) => {
    console.log(`🧪 TEST EVENT: ${event.type}`, event);
  }
};

// Create test auth instance
const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: ":memory:"
  },
  plugins: [betterAuthMonitor(testConfig)]
});

// Test location detection service directly
const locationService = new LocationDetectionService(testConfig);

async function testLocationDetection() {
  console.log('🧪 Testing Location Detection Service...\n');

  // Test 1: VPN Detection
  console.log('Test 1: VPN Detection');
  const vpnLocation = {
    ip: '1.2.3.4',
    country: 'United States',
    countryCode: 'US',
    region: 'CA',
    regionName: 'California',
    city: 'Los Angeles',
    zip: '90210',
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: 'America/Los_Angeles',
    isp: 'NordVPN',
    org: 'NordVPN',
    as: 'AS12345',
    query: '1.2.3.4',
    timestamp: Date.now(),
    isVpn: true,
    isTor: false,
    isProxy: false,
    riskScore: 70
  };

  const vpnAnomalies = await locationService.detectLocationAnomalies('user1', vpnLocation);
  console.log('VPN Anomalies:', vpnAnomalies.length > 0 ? '✅ Detected' : '❌ Not detected');
  console.log('Anomaly details:', vpnAnomalies);
  console.log('');

  // Test 2: Impossible Travel
  console.log('Test 2: Impossible Travel Detection');
  
  // First location - New York
  const nyLocation = {
    ip: '1.2.3.5',
    country: 'United States',
    countryCode: 'US',
    region: 'NY',
    regionName: 'New York',
    city: 'New York',
    zip: '10001',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
    isp: 'Verizon',
    org: 'Verizon',
    as: 'AS701',
    query: '1.2.3.5',
    timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
    isVpn: false,
    isTor: false,
    isProxy: false,
    riskScore: 10
  };

  // Add to history
  await locationService.detectLocationAnomalies('user2', nyLocation);

  // Second location - Tokyo (impossible travel)
  const tokyoLocation = {
    ip: '1.2.3.6',
    country: 'Japan',
    countryCode: 'JP',
    region: '13',
    regionName: 'Tokyo',
    city: 'Tokyo',
    zip: '100-0001',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    isp: 'NTT',
    org: 'NTT',
    as: 'AS2914',
    query: '1.2.3.6',
    timestamp: Date.now(),
    isVpn: false,
    isTor: false,
    isProxy: false,
    riskScore: 10
  };

  const travelAnomalies = await locationService.detectLocationAnomalies('user2', tokyoLocation);
  console.log('Impossible Travel Anomalies:', travelAnomalies.length > 0 ? '✅ Detected' : '❌ Not detected');
  console.log('Anomaly details:', travelAnomalies);
  console.log('');

  // Test 3: New Country Detection
  console.log('Test 3: New Country Detection');
  
  // User has only been to US
  const usLocation1 = {
    ip: '1.2.3.7',
    country: 'United States',
    countryCode: 'US',
    region: 'CA',
    regionName: 'California',
    city: 'San Francisco',
    zip: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    isp: 'Comcast',
    org: 'Comcast',
    as: 'AS7922',
    query: '1.2.3.7',
    timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
    isVpn: false,
    isTor: false,
    isProxy: false,
    riskScore: 10
  };

  await locationService.detectLocationAnomalies('user3', usLocation1);

  // Now login from Germany (new country)
  const germanyLocation = {
    ip: '1.2.3.8',
    country: 'Germany',
    countryCode: 'DE',
    region: 'BE',
    regionName: 'Berlin',
    city: 'Berlin',
    zip: '10115',
    latitude: 52.5200,
    longitude: 13.4050,
    timezone: 'Europe/Berlin',
    isp: 'Deutsche Telekom',
    org: 'Deutsche Telekom',
    as: 'AS3320',
    query: '1.2.3.8',
    timestamp: Date.now(),
    isVpn: false,
    isTor: false,
    isProxy: false,
    riskScore: 10
  };

  const newCountryAnomalies = await locationService.detectLocationAnomalies('user3', germanyLocation);
  console.log('New Country Anomalies:', newCountryAnomalies.length > 0 ? '✅ Detected' : '❌ Not detected');
  console.log('Anomaly details:', newCountryAnomalies);
  console.log('');

  // Test 4: Suspicious Country Detection
  console.log('Test 4: Suspicious Country Detection');
  
  const suspiciousLocation = {
    ip: '1.2.3.9',
    country: 'North Korea',
    countryCode: 'KP',
    region: 'PY',
    regionName: 'Pyongyang',
    city: 'Pyongyang',
    zip: '00000',
    latitude: 39.0392,
    longitude: 125.7625,
    timezone: 'Asia/Pyongyang',
    isp: 'Korea Post and Telecommunications',
    org: 'Korea Post and Telecommunications',
    as: 'AS131279',
    query: '1.2.3.9',
    timestamp: Date.now(),
    isVpn: false,
    isTor: false,
    isProxy: false,
    riskScore: 80
  };

  const suspiciousAnomalies = await locationService.detectLocationAnomalies('user4', suspiciousLocation);
  console.log('Suspicious Country Anomalies:', suspiciousAnomalies.length > 0 ? '✅ Detected' : '❌ Not detected');
  console.log('Anomaly details:', suspiciousAnomalies);
  console.log('');

  // Test 5: Tor Network Detection
  console.log('Test 5: Tor Network Detection');
  
  const torLocation = {
    ip: '1.2.3.10',
    country: 'United States',
    countryCode: 'US',
    region: 'CA',
    regionName: 'California',
    city: 'San Francisco',
    zip: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    isp: 'Tor Exit Node',
    org: 'Tor Project',
    as: 'AS11223',
    query: '1.2.3.10',
    timestamp: Date.now(),
    isVpn: false,
    isTor: true,
    isProxy: false,
    riskScore: 85
  };

  const torAnomalies = await locationService.detectLocationAnomalies('user5', torLocation);
  console.log('Tor Network Anomalies:', torAnomalies.length > 0 ? '✅ Detected' : '❌ Not detected');
  console.log('Anomaly details:', torAnomalies);
  console.log('');

  console.log('🧪 Location Detection Tests Completed!');
}

// Run the tests
testLocationDetection().catch(console.error);

export { testLocationDetection };
