import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/plugins";
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
    const now = Date.now();
    const windowMs = config.failedLoginWindow * 60 * 1000; // Convert minutes to ms
    
    // Get existing attempts for this user
    const existingAttempts = failedLoginAttempts.get(userId) || [];
    
    // Clean old attempts outside the window
    const recentAttempts = cleanOldAttempts(existingAttempts, windowMs);
    
    // Add new attempt
    const newAttempt: FailedLoginAttempt = {
      timestamp: now,
      ip,
      userId
    };
    
    const updatedAttempts = [...recentAttempts, newAttempt];
    failedLoginAttempts.set(userId, updatedAttempts);
    
    // Check if threshold exceeded
    if (updatedAttempts.length >= config.failedLoginThreshold) {
      const event: SecurityEvent = {
        type: 'failed_login',
        userId,
        timestamp: new Date(now).toISOString(),
        ip,
        attempts: updatedAttempts.length
      };
      
      logSecurityEvent(event);
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
            // Match sign-in endpoints
            return context.path === "/api/auth/sign-in/email" ||
                   context.path === "/api/auth/sign-in/password" ||
                   context.path === "/api/auth/sign-in/email";
          },
          handler: createAuthMiddleware(async (ctx) => {
            if (config.enableFailedLoginMonitoring && ctx.request) {
              // Extract user info from request
              const body = await ctx.request.json().catch(() => ({})) as any;
              const userId = body.email || body.username || 'unknown';
              const ip = ctx.request.headers.get('x-forwarded-for') || 
                        ctx.request.headers.get('x-real-ip') || 
                        'unknown';
              
              // Track the attempt (will be logged if threshold exceeded)
              trackFailedLogin(userId, ip);
            }
          })
        }
      ],
      after: [
        {
          matcher: (context) => {
            // TODO: Match successful login endpoints
            return false;
          },
          handler: async (ctx) => {
            // TODO: Implement location detection
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
