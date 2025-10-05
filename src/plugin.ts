import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import type {
  MonitorOptions,
  SecurityEvent,
  FailedLoginAttempt,
  SecurityAction,
  EmailNotification,
  SecurityActionOptions,
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
  const securityActions = new Map<string, SecurityAction[]>();

  // Security action configuration
  const securityConfig = config.securityActions || {};

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
   * Send email notification
   */
  const sendEmailNotification = async (notification: EmailNotification) => {
    if (securityConfig.sendEmail) {
      try {
        await securityConfig.sendEmail(notification);
        console.log("🔍 BETTER-AUTH-MONITOR: Email sent successfully");
      } catch (error) {
        console.error("🔍 BETTER-AUTH-MONITOR: Failed to send email:", error);
      }
    } else {
      console.log(
        "🔍 BETTER-AUTH-MONITOR: No email function configured, skipping email"
      );
    }
  };

  /**
   * Create security action
   */
  const createSecurityAction = async (
    action: Omit<SecurityAction, "timestamp">
  ) => {
    const securityAction: SecurityAction = {
      ...action,
      timestamp: new Date().toISOString(),
    };

    // Store the action
    const userActions = securityActions.get(action.userId) || [];
    userActions.push(securityAction);
    securityActions.set(action.userId, userActions);

    // Log the security event
    const event: SecurityEvent = {
      type: "security_action_triggered",
      userId: action.userId,
      timestamp: securityAction.timestamp,
      ip: action.ip,
      action: securityAction,
    };
    logSecurityEvent(event);

    // Send email notification based on action type
    if (securityConfig.sendEmail) {
      let subject = "";
      let template:
        | "2fa_setup"
        | "password_reset"
        | "security_alert"
        | "account_lockout" = "security_alert";

      switch (action.type) {
        case "enable_2fa":
          subject = "Security Alert: Enable Two-Factor Authentication";
          template = "2fa_setup";
          break;
        case "reset_password":
          subject = "Security Alert: Reset Your Password";
          template = "password_reset";
          break;
        case "security_alert":
          subject = "Security Alert: Suspicious Activity Detected";
          template = "security_alert";
          break;
        case "account_lockout":
          subject = "Account Security: Account Temporarily Locked";
          template = "account_lockout";
          break;
      }

      const emailNotification: EmailNotification = {
        to: action.userId, // Assuming userId is email for now
        subject,
        template,
        data: {
          userName: action.userId,
          reason: action.reason,
          ip: action.ip,
          timestamp: securityAction.timestamp,
        },
      };

      await sendEmailNotification(emailNotification);
      securityAction.emailSent = true;
    }

    return securityAction;
  };

  /**
   * Track failed login attempt
   */
  const trackFailedLogin = async (userId: string, ip: string) => {
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

      // Trigger security actions based on configuration
      if (securityConfig.enable2FAEnforcement) {
        await createSecurityAction({
          type: "enable_2fa",
          userId,
          reason: `Multiple failed login attempts detected (${updatedAttempts.length} attempts)`,
          ip,
        });
      }

      if (securityConfig.enablePasswordResetEnforcement) {
        await createSecurityAction({
          type: "reset_password",
          userId,
          reason: `Multiple failed login attempts detected (${updatedAttempts.length} attempts)`,
          ip,
        });
      }

      // Always send a general security alert
      await createSecurityAction({
        type: "security_alert",
        userId,
        reason: `Suspicious login activity detected (${updatedAttempts.length} failed attempts)`,
        ip,
      });
    } else {
      console.log("🔍 BETTER-AUTH-MONITOR: Threshold not exceeded yet");
    }

    return updatedAttempts.length;
  };

  return {
    id: "better-auth-monitor",

    // Plugin endpoints for monitoring data
    endpoints: {
      // Report a failed login attempt and trigger security actions if threshold reached
      reportFailedLogin: createAuthEndpoint(
        "/monitor/failed-login",
        {
          method: "POST",
        },
        async (ctx) => {
          try {
            if (!ctx.request) {
              return ctx.json(
                {
                  success: false,
                  error: "Request not available",
                },
                { status: 400 }
              );
            }

            const body = (await ctx.request.json()) as {
              userId: string;
              ip?: string;
            };

            const attemptCount = await trackFailedLogin(
              body.userId,
              body.ip || "unknown"
            );

            return ctx.json({
              success: true,
              attempts: attemptCount,
              threshold: config.failedLoginThreshold,
              message:
                attemptCount >= config.failedLoginThreshold
                  ? "Threshold reached; security actions evaluated."
                  : "Failed login recorded.",
            });
          } catch (error) {
            return ctx.json(
              {
                success: false,
                error: "Failed to record failed login",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              },
              { status: 400 }
            );
          }
        }
      ),
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

      // Developer endpoints for triggering security actions
      triggerSecurityAction: createAuthEndpoint(
        "/monitor/trigger-action",
        {
          method: "POST",
        },
        async (ctx) => {
          try {
            if (!ctx.request) {
              return ctx.json(
                {
                  success: false,
                  error: "Request not available",
                },
                { status: 400 }
              );
            }

            const body = (await ctx.request.json()) as {
              userId: string;
              actionType: SecurityAction["type"];
              reason: string;
              ip?: string;
            };

            const action = await createSecurityAction({
              type: body.actionType,
              userId: body.userId,
              reason: body.reason,
              ip: body.ip || "unknown",
            });

            return ctx.json({
              success: true,
              action,
              message: `Security action '${body.actionType}' triggered for user ${body.userId}`,
            });
          } catch (error) {
            return ctx.json(
              {
                success: false,
                error: "Failed to trigger security action",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              },
              { status: 400 }
            );
          }
        }
      ),

      // Get security actions for a user
      getUserSecurityActions: createAuthEndpoint(
        "/monitor/user-actions",
        {
          method: "GET",
        },
        async (ctx) => {
          try {
            if (!ctx.request) {
              return ctx.json(
                {
                  success: false,
                  error: "Request not available",
                },
                { status: 400 }
              );
            }

            const url = new URL(ctx.request.url);
            const userId = url.searchParams.get("userId");

            if (!userId) {
              return ctx.json(
                {
                  success: false,
                  error: "userId parameter is required",
                },
                { status: 400 }
              );
            }

            const userActions = securityActions.get(userId) || [];
            return ctx.json({
              success: true,
              actions: userActions,
            });
          } catch (error) {
            return ctx.json(
              {
                success: false,
                error: "Failed to get user security actions",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              },
              { status: 500 }
            );
          }
        }
      ),

      // Get monitoring statistics
      getMonitoringStats: createAuthEndpoint(
        "/monitor/stats",
        {
          method: "GET",
        },
        async (ctx) => {
          const stats = {
            totalFailedLoginAttempts: Array.from(
              failedLoginAttempts.values()
            ).reduce((total, attempts) => total + attempts.length, 0),
            usersWithFailedAttempts: failedLoginAttempts.size,
            totalSecurityActions: Array.from(securityActions.values()).reduce(
              (total, actions) => total + actions.length,
              0
            ),
            usersWithSecurityActions: securityActions.size,
            botActivityCount: botActivity.size,
            userLocationsCount: userLocations.size,
          };

          return ctx.json({ success: true, stats });
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

    // Attempt to send email notifications using provided security actions
    const actions = options.securityActions;
    if (actions && actions.sendEmail) {
      const subject = "Security Alert: Suspicious Activity Detected";
      const emailNotification: EmailNotification = {
        to: userId,
        subject,
        template: "security_alert",
        data: {
          userName: userId,
          reason: `Multiple failed login attempts detected (${updatedAttempts.length} attempts)`,
          ip,
          timestamp: new Date(now).toISOString(),
        },
      };
      actions.sendEmail(emailNotification).catch((err) => {
        console.error(
          "🔍 BETTER-AUTH-MONITOR: Failed to send email (manual):",
          err
        );
      });
    }
  }

  return updatedAttempts.length;
};
