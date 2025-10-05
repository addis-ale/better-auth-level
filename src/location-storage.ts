// import Redis from "ioredis";
// import {
//   LocationData,
//   UserLocationHistory,
//   SuspiciousLocationEvent,
//   LocationVerificationEmail,
// } from "./location-types";

// /**
//  * Redis-based storage for location tracking and suspicious login detection
//  */
// export class LocationStorage {
//   private redis: Redis;

//   constructor(redisClient?: Redis) {
//     this.redis = redisClient || new Redis();
//   }

//   /**
//    * Store user location history
//    */
//   async storeUserLocation(
//     userId: string,
//     location: LocationData
//   ): Promise<void> {
//     const key = `user_locations:${userId}`;

//     // Add new location to the list (most recent first)
//     await this.redis.lpush(key, JSON.stringify(location));

//     // Keep only the last N locations (configurable)
//     const maxLocations = 50; // Keep last 50 locations
//     await this.redis.ltrim(key, 0, maxLocations - 1);

//     // Set expiration (30 days)
//     await this.redis.expire(key, 30 * 24 * 60 * 60);
//   }

//   /**
//    * Get user location history
//    */
//   async getUserLocationHistory(
//     userId: string,
//     limit: number = 10
//   ): Promise<LocationData[]> {
//     const key = `user_locations:${userId}`;
//     const locations = await this.redis.lrange(key, 0, limit - 1);
//     return locations.map((loc) => JSON.parse(loc));
//   }

//   /**
//    * Get user's last known location
//    */
//   async getLastKnownLocation(userId: string): Promise<LocationData | null> {
//     const locations = await this.getUserLocationHistory(userId, 1);
//     return locations.length > 0 ? locations[0] : null;
//   }

//   /**
//    * Store suspicious location event
//    */
//   async storeSuspiciousEvent(event: SuspiciousLocationEvent): Promise<void> {
//     const key = `suspicious_events:${event.userId}`;
//     const eventKey = `suspicious_event:${event.id}`;

//     // Store individual event
//     await this.redis.setex(eventKey, 7 * 24 * 60 * 60, JSON.stringify(event)); // 7 days

//     // Add to user's suspicious events list
//     await this.redis.lpush(key, event.id);
//     await this.redis.ltrim(key, 0, 99); // Keep last 100 events
//     await this.redis.expire(key, 7 * 24 * 60 * 60);
//   }

//   /**
//    * Get suspicious events for a user
//    */
//   async getSuspiciousEvents(
//     userId: string,
//     limit: number = 20
//   ): Promise<SuspiciousLocationEvent[]> {
//     const key = `suspicious_events:${userId}`;
//     const eventIds = await this.redis.lrange(key, 0, limit - 1);

//     const events: SuspiciousLocationEvent[] = [];
//     for (const eventId of eventIds) {
//       const eventKey = `suspicious_event:${eventId}`;
//       const eventData = await this.redis.get(eventKey);
//       if (eventData) {
//         events.push(JSON.parse(eventData));
//       }
//     }

//     return events;
//   }

//   /**
//    * Get all suspicious events (admin)
//    */
//   async getAllSuspiciousEvents(
//     limit: number = 100
//   ): Promise<SuspiciousLocationEvent[]> {
//     const pattern = "suspicious_event:*";
//     const keys = await this.redis.keys(pattern);
//     const events: SuspiciousLocationEvent[] = [];

//     for (const key of keys.slice(0, limit)) {
//       const eventData = await this.redis.get(key);
//       if (eventData) {
//         events.push(JSON.parse(eventData));
//       }
//     }

//     return events.sort((a, b) => b.timestamp - a.timestamp);
//   }

//   /**
//    * Add trusted IP for a user
//    */
//   async addTrustedIP(userId: string, ip: string): Promise<void> {
//     const key = `trusted_ips:${userId}`;
//     await this.redis.sadd(key, ip);
//     await this.redis.expire(key, 365 * 24 * 60 * 60); // 1 year
//   }

//   /**
//    * Check if IP is trusted for a user
//    */
//   async isIPTrusted(userId: string, ip: string): Promise<boolean> {
//     const key = `trusted_ips:${userId}`;
//     return (await this.redis.sismember(key, ip)) === 1;
//   }

//   /**
//    * Get trusted IPs for a user
//    */
//   async getTrustedIPs(userId: string): Promise<string[]> {
//     const key = `trusted_ips:${userId}`;
//     return await this.redis.smembers(key);
//   }

//   /**
//    * Remove trusted IP for a user
//    */
//   async removeTrustedIP(userId: string, ip: string): Promise<void> {
//     const key = `trusted_ips:${userId}`;
//     await this.redis.srem(key, ip);
//   }

//   /**
//    * Add trusted device for a user
//    */
//   async addTrustedDevice(
//     userId: string,
//     deviceFingerprint: string
//   ): Promise<void> {
//     const key = `trusted_devices:${userId}`;
//     await this.redis.sadd(key, deviceFingerprint);
//     await this.redis.expire(key, 365 * 24 * 60 * 60); // 1 year
//   }

//   /**
//    * Check if device is trusted for a user
//    */
//   async isDeviceTrusted(
//     userId: string,
//     deviceFingerprint: string
//   ): Promise<boolean> {
//     const key = `trusted_devices:${userId}`;
//     return (await this.redis.sismember(key, deviceFingerprint)) === 1;
//   }

//   /**
//    * Get trusted devices for a user
//    */
//   async getTrustedDevices(userId: string): Promise<string[]> {
//     const key = `trusted_devices:${userId}`;
//     return await this.redis.smembers(key);
//   }

//   /**
//    * Remove trusted device for a user
//    */
//   async removeTrustedDevice(
//     userId: string,
//     deviceFingerprint: string
//   ): Promise<void> {
//     const key = `trusted_devices:${userId}`;
//     await this.redis.srem(key, deviceFingerprint);
//   }

//   /**
//    * Store location verification email
//    */
//   async storeVerificationEmail(
//     verification: LocationVerificationEmail
//   ): Promise<void> {
//     const key = `location_verification:${verification.verificationToken}`;
//     await this.redis.setex(key, 24 * 60 * 60, JSON.stringify(verification)); // 24 hours
//   }

//   /**
//    * Get location verification email
//    */
//   async getVerificationEmail(
//     token: string
//   ): Promise<LocationVerificationEmail | null> {
//     const key = `location_verification:${token}`;
//     const data = await this.redis.get(key);
//     return data ? JSON.parse(data) : null;
//   }

//   /**
//    * Remove location verification email
//    */
//   async removeVerificationEmail(token: string): Promise<void> {
//     const key = `location_verification:${token}`;
//     await this.redis.del(key);
//   }

//   /**
//    * Get user location statistics
//    */
//   async getUserLocationStats(userId: string): Promise<{
//     totalLocations: number;
//     uniqueCountries: number;
//     uniqueCities: number;
//     lastLocation?: LocationData;
//     suspiciousEvents: number;
//     trustedIPs: number;
//     trustedDevices: number;
//   }> {
//     const locations = await this.getUserLocationHistory(userId, 100);
//     const suspiciousEvents = await this.getSuspiciousEvents(userId);
//     const trustedIPs = await this.getTrustedIPs(userId);
//     const trustedDevices = await this.getTrustedDevices(userId);

//     const uniqueCountries = new Set(locations.map((loc) => loc.countryCode))
//       .size;
//     const uniqueCities = new Set(
//       locations.map((loc) => `${loc.city}, ${loc.countryCode}`)
//     ).size;

//     return {
//       totalLocations: locations.length,
//       uniqueCountries,
//       uniqueCities,
//       lastLocation: locations[0],
//       suspiciousEvents: suspiciousEvents.length,
//       trustedIPs: trustedIPs.length,
//       trustedDevices: trustedDevices.length,
//     };
//   }

//   /**
//    * Clean up expired data
//    */
//   async cleanupExpiredData(): Promise<void> {
//     // This would typically be run as a cron job
//     const patterns = [
//       "suspicious_event:*",
//       "location_verification:*",
//       "user_locations:*",
//     ];

//     for (const pattern of patterns) {
//       const keys = await this.redis.keys(pattern);
//       for (const key of keys) {
//         const ttl = await this.redis.ttl(key);
//         if (ttl === -1) {
//           // Key exists but has no expiration, set one
//           await this.redis.expire(key, 7 * 24 * 60 * 60); // 7 days
//         }
//       }
//     }
//   }

//   /**
//    * Get all users with suspicious activity
//    */
//   async getUsersWithSuspiciousActivity(): Promise<string[]> {
//     const pattern = "suspicious_events:*";
//     const keys = await this.redis.keys(pattern);
//     return keys.map((key) => key.replace("suspicious_events:", ""));
//   }

//   /**
//    * Clear all location data for a user (GDPR compliance)
//    */
//   async clearUserLocationData(userId: string): Promise<void> {
//     const keys = [
//       `user_locations:${userId}`,
//       `suspicious_events:${userId}`,
//       `trusted_ips:${userId}`,
//       `trusted_devices:${userId}`,
//     ];

//     // Get all suspicious event IDs for this user
//     const suspiciousEventIds = await this.redis.lrange(
//       `suspicious_events:${userId}`,
//       0,
//       -1
//     );
//     for (const eventId of suspiciousEventIds) {
//       keys.push(`suspicious_event:${eventId}`);
//     }

//     // Delete all keys
//     if (keys.length > 0) {
//       await this.redis.del(...keys);
//     }
//   }
// }

// export const locationStorage = new LocationStorage();
// export default locationStorage;
