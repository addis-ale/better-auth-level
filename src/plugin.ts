import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/plugins";
import { createAuthEndpoint } from "better-auth/api";
import type { MonitorOptions, SecurityEvent, FailedLoginAttempt, LocationData, LocationAnomaly } from "./types";
import { LocationDetectionService } from "./location-detection";

/**
 * Better Auth Monitoring Plugin
 * 
 * Detects and logs suspicious authentication activities:
 * - Failed login attempts
 * - Unusual login locations  
 * - Bot-like login patterns
 */
export const betterAuthMonitor = (options: MonitorOptions = {}) => {
  // Default configuration
  const config = {
    failedLoginThreshold: 5,
    failedLoginWindow: 10, // minutes
    botDetectionThreshold: 10,
    botDetectionWindow: 10, // seconds
    enableLocationDetection: true,
    enableFailedLoginMonitoring: true,
    enableBotDetection: true,
    // Location detection defaults
    maxNormalDistance: 1000,
    locationAnomalyWindow: 24,
    minLocationHistory: 3,
    enableVpnDetection: true,
    enableTorDetection: true,
    enableSuspiciousCountryDetection: true,
    suspiciousCountries: ['KP', 'IR', 'SY', 'CU', 'VE', 'MM', 'BY', 'RU', 'CN'],
    enableImpossibleTravelDetection: true,
    maxTravelSpeed: 900,
    enableNewCountryDetection: true,
    enableNewCityDetection: false,
    enableTimezoneAnomalyDetection: true,
    ...options
  };

  // In-memory storage for tracking
  const failedLoginAttempts = new Map<string, FailedLoginAttempt[]>();
  const botActivity = new Map<string, any[]>();
  const userLocations = new Map<string, any>();
  
  // Initialize location detection service
  const locationService = new LocationDetectionService(config);

  /**
   * Log security events
   */
  const logSecurityEvent = (event: SecurityEvent) => {
    if (config.logger) {
      config.logger(event);
    } else {
      console.log(`[BETTER-AUTH-MONITOR] ${JSON.stringify(event)}`);
    }
  };

  /**
   * Clean old attempts from storage
   */
  const cleanOldAttempts = (attempts: FailedLoginAttempt[], windowMs: number) => {
    const now = Date.now();
    return attempts.filter(attempt => now - attempt.timestamp < windowMs);
  };

  /**
   * Track failed login attempt
   */
  const trackFailedLogin = (userId: string, ip: string) => {
    console.log('🔍 BETTER-AUTH-MONITOR: trackFailedLogin called for user:', userId);
    
    const now = Date.now();
    const windowMs = config.failedLoginWindow * 60 * 1000; // Convert minutes to ms
    
    // Get existing attempts for this user
    const existingAttempts = failedLoginAttempts.get(userId) || [];
    console.log('🔍 BETTER-AUTH-MONITOR: Existing attempts:', existingAttempts.length);
    
    // Clean old attempts outside the window
    const recentAttempts = cleanOldAttempts(existingAttempts, windowMs);
    console.log('🔍 BETTER-AUTH-MONITOR: Recent attempts after cleanup:', recentAttempts.length);
    
    // Add new attempt
    const newAttempt: FailedLoginAttempt = {
      timestamp: now,
      ip,
      userId
    };
    
    const updatedAttempts = [...recentAttempts, newAttempt];
    failedLoginAttempts.set(userId, updatedAttempts);
    console.log('🔍 BETTER-AUTH-MONITOR: Updated attempts:', updatedAttempts.length);
    console.log('🔍 BETTER-AUTH-MONITOR: Threshold:', config.failedLoginThreshold);
    
    // Check if threshold exceeded
    if (updatedAttempts.length >= config.failedLoginThreshold) {
      console.log('🔍 BETTER-AUTH-MONITOR: THRESHOLD EXCEEDED! Triggering security alert...');
      
      const event: SecurityEvent = {
        type: 'failed_login',
        userId,
        timestamp: new Date(now).toISOString(),
        ip,
        attempts: updatedAttempts.length
      };
      
      logSecurityEvent(event);
    } else {
      console.log('🔍 BETTER-AUTH-MONITOR: Threshold not exceeded yet');
    }
    
    return updatedAttempts.length;
  };

  /**
   * Handle location detection for successful logins
   */
  const handleLocationDetection = async (userId: string, ip: string) => {
    if (!config.enableLocationDetection) {
      console.log('🔍 BETTER-AUTH-MONITOR: Location detection disabled');
      return;
    }

    try {
      console.log('🔍 BETTER-AUTH-MONITOR: Starting location detection for user:', userId, 'IP:', ip);
      
      // Get location data for the IP
      const locationData = await locationService.getLocationData(ip);
      if (!locationData) {
        console.log('🔍 BETTER-AUTH-MONITOR: Could not get location data for IP:', ip);
        return;
      }

      console.log('🔍 BETTER-AUTH-MONITOR: Location data retrieved:', {
        country: locationData.country,
        city: locationData.city,
        isVpn: locationData.isVpn,
        isTor: locationData.isTor,
        riskScore: locationData.riskScore
      });

      // Detect location anomalies
      const anomalies = await locationService.detectLocationAnomalies(userId, locationData);
      
      if (anomalies.length > 0) {
        console.log('🔍 BETTER-AUTH-MONITOR: Location anomalies detected:', anomalies.length);
        
        // Log each anomaly as a security event
        for (const anomaly of anomalies) {
          const event: SecurityEvent = {
            type: anomaly.type as any,
            userId,
            timestamp: new Date().toISOString(),
            ip,
            locationData,
            riskScore: anomaly.riskScore,
            anomalyType: anomaly.type,
            metadata: {
              ...anomaly.metadata,
              severity: anomaly.severity,
              confidence: anomaly.confidence,
              description: anomaly.description
            }
          };
          
          logSecurityEvent(event);
        }
      } else {
        console.log('🔍 BETTER-AUTH-MONITOR: No location anomalies detected');
      }
      
    } catch (error) {
      console.error('🔍 BETTER-AUTH-MONITOR: Error in location detection:', error);
    }
  };

  return {
    id: "better-auth-monitor",
    
    // Plugin endpoints for monitoring data
    endpoints: {
      getSecurityEvents: createAuthEndpoint("/monitor/events", {
        method: "GET"
      }, async (ctx) => {
        // Return recent security events (for demo purposes)
        const events: SecurityEvent[] = [];
        
        // Collect failed login events
        for (const [userId, attempts] of failedLoginAttempts.entries()) {
          if (attempts.length >= config.failedLoginThreshold) {
            const latestAttempt = attempts[attempts.length - 1];
            events.push({
              type: 'failed_login',
              userId,
              timestamp: new Date(latestAttempt.timestamp).toISOString(),
              ip: latestAttempt.ip,
              attempts: attempts.length
            });
          }
        }
        
        return ctx.json({ events });
      }),

      getLocationStats: createAuthEndpoint("/monitor/location-stats", {
        method: "GET"
      }, async (ctx) => {
        // Return location monitoring statistics
        const stats = {
          totalUsers: locationService['userLocationHistory'].size,
          suspiciousCountries: config.suspiciousCountries,
          locationDetectionEnabled: config.enableLocationDetection,
          vpnDetectionEnabled: config.enableVpnDetection,
          torDetectionEnabled: config.enableTorDetection,
          impossibleTravelDetectionEnabled: config.enableImpossibleTravelDetection,
          newCountryDetectionEnabled: config.enableNewCountryDetection,
          timezoneAnomalyDetectionEnabled: config.enableTimezoneAnomalyDetection
        };
        
        return ctx.json({ stats });
      }),

      getUserLocationHistory: createAuthEndpoint("/monitor/user-locations/:userId", {
        method: "GET"
      }, async (ctx) => {
        const userId = ctx.params.userId;
        const userHistory = locationService['userLocationHistory'].get(userId);
        
        if (!userHistory) {
          return ctx.json({ error: "User not found" }, { status: 404 });
        }
        
        return ctx.json({ 
          userId,
          locations: userHistory.locations,
          frequentLocations: userHistory.frequentLocations,
          lastUpdated: userHistory.lastUpdated
        });
      })
    },

    // Hooks for intercepting authentication events
    hooks: {
      before: [
        {
          matcher: (context) => {
            // Match sign-in endpoints - more flexible matching
            console.log('🔍 BETTER-AUTH-MONITOR: Matcher called for path:', context.path);
            const isSignInPath = context.path.includes("/sign-in") || 
                                context.path === "/api/auth/sign-in/email" ||
                                context.path === "/api/auth/sign-in/password" ||
                                context.path === "/api/auth/sign-in";
            console.log('🔍 BETTER-AUTH-MONITOR: Is sign-in path:', isSignInPath);
            return isSignInPath;
          },
          handler: createAuthMiddleware(async (ctx) => {
            console.log('🔍 BETTER-AUTH-MONITOR: Hook triggered for path:', ctx.request?.url);
            console.log('🔍 BETTER-AUTH-MONITOR: Request method:', ctx.request?.method);
            
            if (config.enableFailedLoginMonitoring && ctx.request) {
              console.log('🔍 BETTER-AUTH-MONITOR: Processing failed login monitoring...');
              
              // Extract user info from request
              const body = await ctx.request.json().catch(() => ({})) as any;
              const userId = body.email || body.username || 'unknown';
              const ip = ctx.request.headers.get('x-forwarded-for') || 
                        ctx.request.headers.get('x-real-ip') || 
                        'unknown';
              
              console.log('🔍 BETTER-AUTH-MONITOR: User ID:', userId);
              console.log('🔍 BETTER-AUTH-MONITOR: IP:', ip);
              
              // Track the attempt (will be logged if threshold exceeded)
              const attemptCount = trackFailedLogin(userId, ip);
              console.log('🔍 BETTER-AUTH-MONITOR: Current attempt count:', attemptCount);
            } else {
              console.log('🔍 BETTER-AUTH-MONITOR: Monitoring disabled or no request');
            }
          })
        }
      ],
      after: [
        {
          matcher: (context) => {
            // Match successful login endpoints
            console.log('🔍 BETTER-AUTH-MONITOR: After hook matcher called for path:', context.path);
            const isSignInPath = context.path.includes("/sign-in") || 
                                context.path === "/api/auth/sign-in/email" ||
                                context.path === "/api/auth/sign-in/password" ||
                                context.path === "/api/auth/sign-in";
            console.log('🔍 BETTER-AUTH-MONITOR: Is sign-in path (after):', isSignInPath);
            return isSignInPath;
          },
          handler: async (ctx) => {
            console.log('🔍 BETTER-AUTH-MONITOR: After hook triggered for successful login');
            
            if (config.enableLocationDetection && ctx.request) {
              try {
                // Extract user info from request
                const body = await ctx.request.json().catch(() => ({})) as any;
                const userId = body.email || body.username || 'unknown';
                const ip = ctx.request.headers.get('x-forwarded-for') || 
                          ctx.request.headers.get('x-real-ip') || 
                          'unknown';
                
                console.log('🔍 BETTER-AUTH-MONITOR: Processing location detection for successful login');
                console.log('🔍 BETTER-AUTH-MONITOR: User ID:', userId);
                console.log('🔍 BETTER-AUTH-MONITOR: IP:', ip);
                
                // Handle location detection for successful login
                await handleLocationDetection(userId, ip);
              } catch (error) {
                console.error('🔍 BETTER-AUTH-MONITOR: Error in after hook:', error);
              }
            }
            
            // Return void to continue with the request
          }
        }
      ]
    },

    // Monitor all requests for bot detection
    onRequest: async (request, ctx) => {
      // TODO: Implement bot detection logic
      // Return void to continue with the request
    },

    // Rate limiting for monitoring endpoints
    rateLimit: [
      {
        pathMatcher: (path) => path.includes("/monitor/"),
        max: 100,
        window: 60
      }
    ]
  } satisfies BetterAuthPlugin;
};
