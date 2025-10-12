import { LocationData, DistanceCalculation } from "./location-types";

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate distance between two LocationData objects
 */
export function calculateLocationDistance(
  location1: LocationData,
  location2: LocationData
): number {
  return calculateDistance(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude
  );
}

/**
 * Calculate bearing between two points
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = Math.atan2(y, x);
  bearing = toDegrees(bearing);
  bearing = (bearing + 360) % 360;

  return Math.round(bearing);
}

/**
 * Calculate distance and bearing between two locations
 */
export function calculateDistanceAndBearing(
  location1: LocationData,
  location2: LocationData
): DistanceCalculation {
  const distance = calculateLocationDistance(location1, location2);
  const bearing = calculateBearing(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude
  );

  return { distance, bearing };
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Check if two locations are in the same country
 */
export function isSameCountry(
  location1: LocationData,
  location2: LocationData
): boolean {
  return location1.countryCode === location2.countryCode;
}

/**
 * Check if two locations are in the same region/state
 */
export function isSameRegion(
  location1: LocationData,
  location2: LocationData
): boolean {
  return (
    location1.countryCode === location2.countryCode &&
    location1.regionCode === location2.regionCode
  );
}

/**
 * Check if two locations are in the same city
 */
export function isSameCity(
  location1: LocationData,
  location2: LocationData
): boolean {
  return (
    location1.countryCode === location2.countryCode &&
    location1.regionCode === location2.regionCode &&
    location1.city === location2.city
  );
}

/**
 * Get a human-readable description of the distance
 */
export function getDistanceDescription(distance: number): string {
  if (distance < 1) {
    return "Less than 1 km away";
  } else if (distance < 10) {
    return `${Math.round(distance)} km away`;
  } else if (distance < 100) {
    return `${Math.round(distance)} km away`;
  } else if (distance < 1000) {
    return `${Math.round(distance)} km away`;
  } else {
    return `${Math.round(distance / 100) / 10} thousand km away`;
  }
}

/**
 * Get a human-readable description of the bearing direction
 */
export function getBearingDescription(bearing: number): string {
  const directions = [
    "North",
    "NNE",
    "NE",
    "ENE",
    "East",
    "ESE",
    "SE",
    "SSE",
    "South",
    "SSW",
    "SW",
    "WSW",
    "West",
    "WNW",
    "NW",
    "NNW",
  ];

  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * Check if a location is suspicious based on various factors
 */
export function isLocationSuspicious(
  currentLocation: LocationData,
  previousLocation: LocationData,
  distanceThreshold: number,
  newCountryThreshold: number
): { suspicious: boolean; reason: string; confidence: number } {
  // Check for new country
  if (!isSameCountry(currentLocation, previousLocation)) {
    return {
      suspicious: true,
      reason: "new_country",
      confidence: newCountryThreshold,
    };
  }

  // Check distance threshold
  const distance = calculateLocationDistance(currentLocation, previousLocation);
  if (distance > distanceThreshold) {
    return {
      suspicious: true,
      reason: "distance_threshold",
      confidence: Math.min(0.9, distance / (distanceThreshold * 2)), // Higher confidence for larger distances
    };
  }

  // Check for unusual patterns (same country but very far)
  if (
    isSameCountry(currentLocation, previousLocation) &&
    distance > distanceThreshold * 0.5
  ) {
    return {
      suspicious: true,
      reason: "unusual_pattern",
      confidence: 0.6,
    };
  }

  return {
    suspicious: false,
    reason: "normal",
    confidence: 0,
  };
}

/**
 * Generate a device fingerprint from user agent and other data
 */
export function generateDeviceFingerprint(
  userAgent?: string,
  screenResolution?: string,
  timezone?: string
): string {
  const components = [
    userAgent || "unknown",
    screenResolution || "unknown",
    timezone || "unknown",
  ];

  // Simple hash function for fingerprinting
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Check if an IP address is in a trusted range (private networks, etc.)
 */
export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8 (localhost)
    /^::1$/, // IPv6 localhost
    /^fc00:/, // IPv6 private
    /^fe80:/, // IPv6 link-local
  ];

  return privateRanges.some((range) => range.test(ip));
}

/**
 * Validate if coordinates are reasonable
 */
export function validateCoordinates(
  latitude: number,
  longitude: number
): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Get time zone offset in minutes
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const date = new Date();
    const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const targetTime = new Date(
      utc.toLocaleString("en-US", { timeZone: timezone })
    );
    return (targetTime.getTime() - utc.getTime()) / 60000;
  } catch (error) {
    return 0;
  }
}

export default {
  calculateDistance,
  calculateLocationDistance,
  calculateBearing,
  calculateDistanceAndBearing,
  isSameCountry,
  isSameRegion,
  isSameCity,
  getDistanceDescription,
  getBearingDescription,
  isLocationSuspicious,
  generateDeviceFingerprint,
  isPrivateIP,
  validateCoordinates,
  getTimezoneOffset,
};
