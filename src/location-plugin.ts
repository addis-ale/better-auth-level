// import type { BetterAuthPlugin } from "better-auth";
// import { createAuthEndpoint } from "better-auth/api";
// import { LocationDetectionConfig, SuspiciousLocationEvent } from './location-types';
// import LocationDetector from './location-detector';
// import { locationStorage } from './location-storage';
// import { generateDeviceFingerprint } from './location-utils';

// /**
//  * Better Auth Location Detection Plugin
//  *
//  * Detects unusual login locations and provides verification mechanisms
//  */
// export const betterAuthLocationDetection = (config: LocationDetectionConfig = {}) => {
//   // Default configuration
//   const defaultConfig: LocationDetectionConfig = {
//     enabled: true,
//     distanceThreshold: 1000, // km
//     newCountryThreshold: 0.8, // confidence level
//     maxHistoryLocations: 50,
//     verificationEmailEnabled: true,
//     autoBlockSuspicious: false,
//     trustedLocationGracePeriod: 30, // days
//     geolocationProvider: 'geoip-lite',
//     ...config
//   };

//   // Initialize location detector
//   const locationDetector = new LocationDetector(defaultConfig);

//   return {
//     id: "better-auth-location-detection",

//     // Plugin endpoints
//     endpoints: {
//       // Verify suspicious location
//       verifyLocation: createAuthEndpoint("/location/verify", {
//         method: "POST"
//       }, async (ctx) => {
//         const { token, userId } = await ctx.json();

//         try {
//           const result = await locationDetector.verifyLocation(token, userId);
//           return ctx.json(result);
//         } catch (error) {
//           console.error('Location verification error:', error);
//           return ctx.json({
//             success: false,
//             message: 'Verification failed'
//           }, { status: 500 });
//         }
//       }),

//       // Reject suspicious location
//       rejectLocation: createAuthEndpoint("/location/reject", {
//         method: "POST"
//       }, async (ctx) => {
//         const { token, userId } = await ctx.json();

//         try {
//           const result = await locationDetector.rejectLocation(token, userId);
//           return ctx.json(result);
//         } catch (error) {
//           console.error('Location rejection error:', error);
//           return ctx.json({
//             success: false,
//             message: 'Rejection failed'
//           }, { status: 500 });
//         }
//       }),

//       // Get user location statistics
//       getUserLocationStats: createAuthEndpoint("/location/stats/:userId", {
//         method: "GET"
//       }, async (ctx) => {
//         const userId = ctx.params.userId;

//         try {
//           const stats = await locationDetector.getUserLocationStats(userId);
//           return ctx.json({ stats });
//         } catch (error) {
//           console.error('Get location stats error:', error);
//           return ctx.json({ error: 'Failed to get location stats' }, { status: 500 });
//         }
//       }),

//       // Get suspicious events for user
//       getUserSuspiciousEvents: createAuthEndpoint("/location/suspicious/:userId", {
//         method: "GET"
//       }, async (ctx) => {
//         const userId = ctx.params.userId;
//         const limit = parseInt(ctx.query.limit as string) || 20;

//         try {
//           const events = await locationDetector.getUserSuspiciousEvents(userId, limit);
//           return ctx.json({ events });
//         } catch (error) {
//           console.error('Get suspicious events error:', error);
//           return ctx.json({ error: 'Failed to get suspicious events' }, { status: 500 });
//         }
//       }),

//       // Get all suspicious events (admin)
//       getAllSuspiciousEvents: createAuthEndpoint("/location/suspicious", {
//         method: "GET"
//       }, async (ctx) => {
//         const limit = parseInt(ctx.query.limit as string) || 100;

//         try {
//           const events = await locationStorage.getAllSuspiciousEvents(limit);
//           return ctx.json({ events });
//         } catch (error) {
//           console.error('Get all suspicious events error:', error);
//           return ctx.json({ error: 'Failed to get suspicious events' }, { status: 500 });
//         }
//       }),

//       // Add trusted IP
//       addTrustedIP: createAuthEndpoint("/location/trusted-ip", {
//         method: "POST"
//       }, async (ctx) => {
//         const { userId, ip } = await ctx.json();

//         try {
//           await locationStorage.addTrustedIP(userId, ip);
//           return ctx.json({ success: true, message: 'IP added to trusted list' });
//         } catch (error) {
//           console.error('Add trusted IP error:', error);
//           return ctx.json({ error: 'Failed to add trusted IP' }, { status: 500 });
//         }
//       }),

//       // Remove trusted IP
//       removeTrustedIP: createAuthEndpoint("/location/trusted-ip", {
//         method: "DELETE"
//       }, async (ctx) => {
//         const { userId, ip } = await ctx.json();

//         try {
//           await locationStorage.removeTrustedIP(userId, ip);
//           return ctx.json({ success: true, message: 'IP removed from trusted list' });
//         } catch (error) {
//           console.error('Remove trusted IP error:', error);
//           return ctx.json({ error: 'Failed to remove trusted IP' }, { status: 500 });
//         }
//       }),

//       // Get trusted IPs
//       getTrustedIPs: createAuthEndpoint("/location/trusted-ips/:userId", {
//         method: "GET"
//       }, async (ctx) => {
//         const userId = ctx.params.userId;

//         try {
//           const ips = await locationStorage.getTrustedIPs(userId);
//           return ctx.json({ ips });
//         } catch (error) {
//           console.error('Get trusted IPs error:', error);
//           return ctx.json({ error: 'Failed to get trusted IPs' }, { status: 500 });
//         }
//       }),

//       // Clear user location data (GDPR compliance)
//       clearUserLocationData: createAuthEndpoint("/location/clear/:userId", {
//         method: "DELETE"
//       }, async (ctx) => {
//         const userId = ctx.params.userId;

//         try {
//           await locationStorage.clearUserLocationData(userId);
//           return ctx.json({ success: true, message: 'User location data cleared' });
//         } catch (error) {
//           console.error('Clear user location data error:', error);
//           return ctx.json({ error: 'Failed to clear user location data' }, { status: 500 });
//         }
//       })
//     },

//     // Hook into authentication events
//     onRequest: async (request, ctx) => {
//       if (!defaultConfig.enabled) return;

//       // Only process authentication requests
//       const url = new URL(request.url);
//       if (!url.pathname.includes('/auth/')) return;

//       try {
//         // Extract user information from request
//         const userId = ctx.user?.id;
//         if (!userId) return;

//         // Get IP address
//         const ip = request.headers.get('x-forwarded-for') ||
//                   request.headers.get('x-real-ip') ||
//                   request.headers.get('cf-connecting-ip') ||
//                   'unknown';

//         // Get user agent
//         const userAgent = request.headers.get('user-agent');

//         // Generate device fingerprint
//         const deviceFingerprint = generateDeviceFingerprint(userAgent);

//         // Process location detection
//         const result = await locationDetector.processLoginAttempt(
//           userId,
//           ip,
//           userAgent,
//           deviceFingerprint
//         );

//         // Handle suspicious location
//         if (result.suspicious && result.event) {
//           console.log(`🚨 Suspicious location detected for user ${userId}:`, {
//             location: result.location,
//             reason: result.event.reason,
//             confidence: result.event.confidence,
//             action: result.action
//           });

//           // Store the result in context for potential use by other middleware
//           (ctx as any).locationDetection = {
//             suspicious: true,
//             event: result.event,
//             action: result.action
//           };

//           // If auto-blocking is enabled and confidence is high, block the request
//           if (result.action === 'block') {
//             return new Response(
//               JSON.stringify({
//                 error: 'Login blocked due to suspicious location',
//                 code: 'SUSPICIOUS_LOCATION'
//               }),
//               {
//                 status: 403,
//                 headers: { 'Content-Type': 'application/json' }
//               }
//             );
//           }

//           // If verification is required, return a special response
//           if (result.action === 'verify') {
//             return new Response(
//               JSON.stringify({
//                 error: 'Location verification required',
//                 code: 'LOCATION_VERIFICATION_REQUIRED',
//                 verificationToken: result.event.verificationToken
//               }),
//               {
//                 status: 202,
//                 headers: { 'Content-Type': 'application/json' }
//               }
//             );
//           }
//         } else {
//           // Store normal location detection result
//           (ctx as any).locationDetection = {
//             suspicious: false,
//             location: result.location
//           };
//         }

//       } catch (error) {
//         console.error('Location detection error in onRequest:', error);
//         // Don't block the request if location detection fails
//       }
//     },

//     // Rate limiting for location endpoints
//     rateLimit: [
//       {
//         pathMatcher: (path) => path.includes("/location/"),
//         max: 50,
//         window: 60
//       }
//     ],

//     // Expose location detector for manual use
//     locationDetector: locationDetector
//   } satisfies BetterAuthPlugin;
// };

// /**
//  * Manual location detection function
//  * Use this in your application code when you need to manually check a location
//  */
// export const detectSuspiciousLocation = async (
//   userId: string,
//   ip: string,
//   userAgent?: string,
//   config?: Partial<LocationDetectionConfig>
// ) => {
//   const mergedConfig = {
//     enabled: true,
//     distanceThreshold: 1000,
//     newCountryThreshold: 0.8,
//     maxHistoryLocations: 50,
//     verificationEmailEnabled: true,
//     autoBlockSuspicious: false,
//     trustedLocationGracePeriod: 30,
//     geolocationProvider: 'geoip-lite' as const,
//     ...config
//   };

//   const detector = new LocationDetector(mergedConfig);
//   const deviceFingerprint = generateDeviceFingerprint(userAgent);

//   return await detector.processLoginAttempt(userId, ip, userAgent, deviceFingerprint);
// };

// export default betterAuthLocationDetection;
