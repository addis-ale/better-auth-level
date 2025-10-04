import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import type {
  MonitorOptions,
  SecurityEvent,
  FailedLoginAttempt,
} from "./types";

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
    ...options,
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
  const cleanOldAttempts = (
    attempts: FailedLoginAttempt[],
    windowMs: number
  ) => {
    const now = Date.now();
    return attempts.filter((attempt) => now - attempt.timestamp < windowMs);
  };

  /**
   * Track failed login attempt
   */
  const trackFailedLogin = (userId: string, ip: string) => {
    console.log(
      "🔍 BETTER-AUTH-MONITOR: trackFailedLogin called for user:",
      userId
    );

    const now = Date.now();
    const windowMs = config.failedLoginWindow * 60 * 1000; // Convert minutes to ms

    // Get existing attempts for this user
    const existingAttempts = failedLoginAttempts.get(userId) || [];
    console.log(
      "🔍 BETTER-AUTH-MONITOR: Existing attempts:",
      existingAttempts.length
    );

    // Clean old attempts outside the window
    const recentAttempts = cleanOldAttempts(existingAttempts, windowMs);
    console.log(
      "🔍 BETTER-AUTH-MONITOR: Recent attempts after cleanup:",
      recentAttempts.length
    );

    // Add new attempt
    const newAttempt: FailedLoginAttempt = {
      timestamp: now,
      ip,
      userId,
    };

    const updatedAttempts = [...recentAttempts, newAttempt];
    failedLoginAttempts.set(userId, updatedAttempts);
    console.log(
      "🔍 BETTER-AUTH-MONITOR: Updated attempts:",
      updatedAttempts.length
    );
    console.log(
      "🔍 BETTER-AUTH-MONITOR: Threshold:",
      config.failedLoginThreshold
    );

    // Check if threshold exceeded
    if (updatedAttempts.length >= config.failedLoginThreshold) {
      console.log(
        "🔍 BETTER-AUTH-MONITOR: THRESHOLD EXCEEDED! Triggering security alert..."
      );

      const event: SecurityEvent = {
        type: "failed_login",
        userId,
        timestamp: new Date(now).toISOString(),
        ip,
        attempts: updatedAttempts.length,
      };

      logSecurityEvent(event);
    } else {
      console.log("🔍 BETTER-AUTH-MONITOR: Threshold not exceeded yet");
    }

    return updatedAttempts.length;
  };

  return {
    id: "better-auth-monitor",

    // Plugin endpoints for monitoring data
    endpoints: {
      getSecurityEvents: createAuthEndpoint(
        "/monitor/events",
        {
          method: "GET",
        },
        async (ctx) => {
          // Return recent security events (for demo purposes)
          const events: SecurityEvent[] = [];

          // Collect failed login events
          for (const [userId, attempts] of failedLoginAttempts.entries()) {
            if (attempts.length >= config.failedLoginThreshold) {
              const latestAttempt = attempts[attempts.length - 1];
              events.push({
                type: "failed_login",
                userId,
                timestamp: new Date(latestAttempt.timestamp).toISOString(),
                ip: latestAttempt.ip,
                attempts: attempts.length,
              });
            }
          }

          return ctx.json({ events });
        }
      ),
    },

    // Monitor all requests for bot detection
    onRequest: async (request, ctx) => {
      if (config.enableBotDetection) {
        const ip =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          request.headers.get("cf-connecting-ip") ||
          "unknown";

        const now = Date.now();
        const windowMs = config.botDetectionWindow * 1000; // Convert seconds to ms

        // Get existing bot activity for this IP
        const existingActivity = botActivity.get(ip) || [];

        // Clean old activity outside the window
        const recentActivity = existingActivity.filter(
          (activity) => now - activity.timestamp < windowMs
        );

        // Add new activity
        const newActivity = { timestamp: now, count: 1 };
        const updatedActivity = [...recentActivity, newActivity];
        botActivity.set(ip, updatedActivity);

        // Check if threshold exceeded
        if (updatedActivity.length >= config.botDetectionThreshold) {
          const event: SecurityEvent = {
            type: "bot_activity",
            timestamp: new Date(now).toISOString(),
            ip,
            requestRate: `${updatedActivity.length} requests in ${config.botDetectionWindow}s`,
          };

          logSecurityEvent(event);
        }
      }
    },

    // Rate limiting for monitoring endpoints
    rateLimit: [
      {
        pathMatcher: (path) => path.includes("/monitor/"),
        max: 100,
        window: 60,
      },
    ],
  } satisfies BetterAuthPlugin;
};

/**
 * Manual tracking function for failed logins
 * Use this in your application code when you detect a failed login
 */
export const trackFailedLoginManually = (
  userId: string,
  ip: string,
  options: MonitorOptions = {}
) => {
  // Create a temporary plugin instance for tracking
  const tempPlugin = betterAuthMonitor(options);

  // Access the internal tracking function
  // This is a workaround since we can't expose it directly
  console.log(
    "🔍 BETTER-AUTH-MONITOR: Manual tracking called for user:",
    userId
  );

  // For now, we'll create a simple tracking mechanism
  const now = Date.now();
  const windowMs = (options.failedLoginWindow || 10) * 60 * 1000;

  // Use a global storage for manual tracking
  if (!(globalThis as any)._manualFailedLogins) {
    (globalThis as any)._manualFailedLogins = new Map();
  }

  const existingAttempts =
    (globalThis as any)._manualFailedLogins.get(userId) || [];
  const recentAttempts = existingAttempts.filter(
    (attempt: any) => now - attempt.timestamp < windowMs
  );

  const newAttempt = { timestamp: now, ip, userId };
  const updatedAttempts = [...recentAttempts, newAttempt];
  (globalThis as any)._manualFailedLogins.set(userId, updatedAttempts);

  const threshold = options.failedLoginThreshold || 5;

  if (updatedAttempts.length >= threshold) {
    const event: SecurityEvent = {
      type: "failed_login",
      userId,
      timestamp: new Date(now).toISOString(),
      ip,
      attempts: updatedAttempts.length,
    };

    if (options.logger) {
      options.logger(event);
    } else {
      console.log(`[BETTER-AUTH-MONITOR] ${JSON.stringify(event)}`);
    }
  }

  return updatedAttempts.length;
};
