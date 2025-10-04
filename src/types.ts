export interface MonitorOptions {
  /** Threshold for failed login attempts before flagging (default: 5) */
  failedLoginThreshold?: number;
  /** Time window for failed login attempts in minutes (default: 10) */
  failedLoginWindow?: number;
  /** Threshold for bot detection - requests per time window (default: 10) */
  botDetectionThreshold?: number;
  /** Time window for bot detection in seconds (default: 10) */
  botDetectionWindow?: number;
  /** Enable unusual location detection (default: true) */
  enableLocationDetection?: boolean;
  /** Enable failed login monitoring (default: true) */
  enableFailedLoginMonitoring?: boolean;
  /** Enable bot detection (default: true) */
  enableBotDetection?: boolean;
  /** Custom logger function (optional) */
  logger?: (event: SecurityEvent) => void;
  
  // Location Detection Options
  /** Maximum distance in km for normal login (default: 1000) */
  maxNormalDistance?: number;
  /** Time window for location anomaly detection in hours (default: 24) */
  locationAnomalyWindow?: number;
  /** Minimum number of previous locations needed for comparison (default: 3) */
  minLocationHistory?: number;
  /** Enable VPN/Proxy detection (default: true) */
  enableVpnDetection?: boolean;
  /** Enable Tor network detection (default: true) */
  enableTorDetection?: boolean;
  /** Enable suspicious country detection (default: true) */
  enableSuspiciousCountryDetection?: boolean;
  /** List of suspicious countries (ISO codes) */
  suspiciousCountries?: string[];
  /** Enable impossible travel detection (default: true) */
  enableImpossibleTravelDetection?: boolean;
  /** Maximum possible travel speed in km/h (default: 900) */
  maxTravelSpeed?: number;
  /** Enable new country detection (default: true) */
  enableNewCountryDetection?: boolean;
  /** Enable new city detection (default: false) */
  enableNewCityDetection?: boolean;
  /** Enable timezone anomaly detection (default: true) */
  enableTimezoneAnomalyDetection?: boolean;
}

export interface SecurityEvent {
  type: 'failed_login' | 'unusual_location' | 'bot_activity' | 'vpn_detected' | 'tor_detected' | 'impossible_travel' | 'new_country' | 'new_city' | 'timezone_anomaly' | 'suspicious_country';
  userId?: string;
  timestamp: string;
  ip: string;
  attempts?: number;
  previousCountry?: string;
  currentCountry?: string;
  requestRate?: string;
  metadata?: Record<string, any>;
  
  // Location-specific fields
  locationData?: LocationData;
  previousLocation?: LocationData;
  distance?: number;
  travelTime?: number;
  travelSpeed?: number;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
  timezone?: string;
  previousTimezone?: string;
  riskScore?: number;
  anomalyType?: string;
}

export interface FailedLoginAttempt {
  timestamp: number;
  ip: string;
  userId: string;
}

export interface BotActivity {
  ip: string;
  timestamp: number;
  count: number;
}

export interface UserLocation {
  userId: string;
  country: string;
  lastLogin: number;
}

// Comprehensive location data structure
export interface LocationData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
  timestamp: number;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
  riskScore?: number;
}

// User location history for pattern analysis
export interface UserLocationHistory {
  userId: string;
  locations: LocationData[];
  lastUpdated: number;
  homeLocation?: LocationData;
  frequentLocations: LocationData[];
  suspiciousLocations: LocationData[];
}

// Geolocation service response
export interface GeolocationResponse {
  status: 'success' | 'fail';
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
  message?: string;
}

// Location anomaly detection result
export interface LocationAnomaly {
  type: 'impossible_travel' | 'new_country' | 'new_city' | 'timezone_anomaly' | 'suspicious_country' | 'vpn_detected' | 'tor_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  riskScore: number; // 0-100
  metadata: Record<string, any>;
}

// VPN/Proxy detection result
export interface NetworkAnalysis {
  isVpn: boolean;
  isTor: boolean;
  isProxy: boolean;
  confidence: number;
  provider?: string;
  serverLocation?: string;
  riskLevel: 'low' | 'medium' | 'high';
}
