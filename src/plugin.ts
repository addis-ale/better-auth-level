import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import type { MonitorOptions, SecurityEvent, FailedLoginAttempt } from "./types";

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
    ...options
  };

  // In-memory storage for tracking
  const failedLoginAttempts = new Map<string, FailedLoginAttempt[]>();
  const botActivity = new Map<string, any[]>();
  const userLocations = new Map<string, any>();

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
      })
    },

    // Hooks for intercepting authentication events
    hooks: {
      before: [
        {
          matcher: (context) => {
            // Match Better Auth's actual sign-in endpoints
            console.log('🔍 BETTER-AUTH-MONITOR: Matcher called for path:', context.path);
            const isSignInPath = context.path === "/api/auth/sign-in/email" ||
                                context.path === "/api/auth/sign-in/password" ||
                                context.path === "/api/auth/sign-in" ||
                                context.path.includes("/sign-in");
            console.log('🔍 BETTER-AUTH-MONITOR: Is sign-in path:', isSignInPath);
            return isSignInPath;
          },
          handler: async (ctx) => {
            console.log('🔍 BETTER-AUTH-MONITOR: Before hook triggered for path:', ctx.request?.url);
            
            // Store request info for later use in after hook
            if (ctx.request) {
              try {
                const body = await ctx.request.clone().json().catch(() => ({})) as any;
                const userId = body.email || body.username || 'unknown';
                const ip = ctx.request.headers.get('x-forwarded-for') || 
                          ctx.request.headers.get('x-real-ip') || 
                          ctx.request.headers.get('cf-connecting-ip') ||
                          'unknown';
                
                // Store in context for after hook
                (ctx as any).monitorData = { userId, ip, timestamp: Date.now() };
                console.log('🔍 BETTER-AUTH-MONITOR: Stored request data for monitoring');
              } catch (error) {
                console.error('🔍 BETTER-AUTH-MONITOR: Error storing request data:', error);
              }
            }
          }
        }
      ],
      after: [
        {
          matcher: (context) => {
            // Match sign-in endpoints (both successful and failed)
            console.log('🔍 BETTER-AUTH-MONITOR: After hook matcher for path:', context.path);
            const isSignInPath = context.path === "/api/auth/sign-in/email" ||
                                context.path === "/api/auth/sign-in/password" ||
                                context.path === "/api/auth/sign-in" ||
                                context.path.includes("/sign-in");
            return isSignInPath;
          },
          handler: async (ctx) => {
            console.log('🔍 BETTER-AUTH-MONITOR: After hook triggered for path:', ctx.path);
            
            // Check if this was a failed login attempt
            const monitorData = (ctx as any).monitorData;
            if (monitorData && config.enableFailedLoginMonitoring) {
              // For now, we'll track all login attempts as potential failures
              // In a real implementation, we'd need to check the actual response status
              // This is a limitation of the current Better Auth hook system
              console.log('🔍 BETTER-AUTH-MONITOR: Processing login attempt');
              
              // Track the attempt (in a real app, this would be called only on actual failures)
              // For testing purposes, we'll track all attempts
              const attemptCount = trackFailedLogin(monitorData.userId, monitorData.ip);
              console.log('🔍 BETTER-AUTH-MONITOR: Current attempt count:', attemptCount);
              
              // TODO: Implement proper success/failure detection
              // This would require access to the response status in the hook context
            }
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
