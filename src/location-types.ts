// export interface LocationData {
//   ip: string;
//   country: string;
//   countryCode: string;
//   region: string;
//   regionCode: string;
//   city: string;
//   latitude: number;
//   longitude: number;
//   timezone: string;
//   isp?: string;
//   organization?: string;
//   accuracy?: number; // Location accuracy in km
//   timestamp: number;
// }

// export interface UserLocationHistory {
//   userId: string;
//   locations: LocationData[];
//   trustedIPs: string[];
//   trustedDevices: string[];
//   lastKnownLocation?: LocationData;
//   suspiciousLogins: SuspiciousLocationEvent[];
// }

// export interface SuspiciousLocationEvent {
//   id: string;
//   userId: string;
//   currentLocation: LocationData;
//   previousLocation?: LocationData;
//   distance?: number; // in kilometers
//   reason: 'new_country' | 'distance_threshold' | 'unusual_pattern';
//   confidence: number; // 0-1, how confident we are this is suspicious
//   timestamp: number;
//   userAgent?: string;
//   deviceFingerprint?: string;
//   isVerified?: boolean;
//   verificationToken?: string;
//   verificationExpires?: number;
// }

// export interface LocationDetectionConfig {
//   enabled: boolean;
//   distanceThreshold: number; // km
//   newCountryThreshold: number; // confidence level for new country
//   maxHistoryLocations: number;
//   verificationEmailEnabled: boolean;
//   autoBlockSuspicious: boolean;
//   trustedLocationGracePeriod: number; // days
//   geolocationProvider: 'geoip-lite' | 'ipdata' | 'ipinfo' | 'ipapi';
//   apiKey?: string;
//   onLocationAnomalyDetected?: (event: SuspiciousLocationEvent) => Promise<void>;
//   onLocationVerified?: (userId: string, location: LocationData) => Promise<void>;
//   onLocationRejected?: (userId: string, location: LocationData) => Promise<void>;
// }

// export interface GeolocationProvider {
//   getLocation(ip: string): Promise<LocationData>;
// }

// export interface DistanceCalculation {
//   distance: number;
//   bearing: number;
// }

// export interface LocationVerificationEmail {
//   userId: string;
//   email: string;
//   location: LocationData;
//   verificationToken: string;
//   expiresAt: number;
//   suspiciousEventId: string;
// }

