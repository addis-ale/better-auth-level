import type { BetterAuthClientPlugin } from "better-auth/client";
import type { MonitorOptions } from "./types";

/**
 * Client-side plugin for Better Auth Monitor
 *
 * Provides client-side utilities for monitoring integration
 */
export const betterAuthMonitorClient = (options: MonitorOptions = {}) => {
  return {
    id: "better-auth-monitor",

    // Infer server plugin endpoints
    $InferServerPlugin: {} as ReturnType<
      typeof import("./plugin").betterAuthMonitor
    >,

    // Client-side actions for monitoring
    getActions: ($fetch) => {
      return {
        // Report a failed login attempt
        reportFailedLogin: async (params: { userId: string; ip?: string }) => {
          return $fetch("/monitor/failed-login", {
            method: "POST",
            body: params,
          });
        },
        // Get security events
        getSecurityEvents: async (params: {
          limit?: number;
          type?: string;
        }) => {
          return $fetch("/monitor/events", {
            method: "GET",
            query: params,
          });
        },

        // Get monitoring statistics
        getMonitoringStats: async () => {
          return $fetch("/monitor/stats", {
            method: "GET",
          });
        },

        // Trigger security actions (for developers)
        triggerSecurityAction: async (params: {
          userId: string;
          actionType:
            | "enable_2fa"
            | "reset_password"
            | "security_alert"
            | "account_lockout";
          reason: string;
          ip?: string;
        }) => {
          return $fetch("/monitor/trigger-action", {
            method: "POST",
            body: params,
          });
        },

        // Get user security actions
        getUserSecurityActions: async (userId: string) => {
          return $fetch("/monitor/user-actions", {
            method: "GET",
            query: { userId },
          });
        },

        // Convenience methods for common security actions
        enable2FA: async (userId: string, reason: string, ip?: string) => {
          return $fetch("/monitor/trigger-action", {
            method: "POST",
            body: {
              userId,
              actionType: "enable_2fa",
              reason,
              ip: ip || "unknown",
            },
          });
        },

        resetPassword: async (userId: string, reason: string, ip?: string) => {
          return $fetch("/monitor/trigger-action", {
            method: "POST",
            body: {
              userId,
              actionType: "reset_password",
              reason,
              ip: ip || "unknown",
            },
          });
        },

        sendSecurityAlert: async (
          userId: string,
          reason: string,
          ip?: string
        ) => {
          return $fetch("/monitor/trigger-action", {
            method: "POST",
            body: {
              userId,
              actionType: "security_alert",
              reason,
              ip: ip || "unknown",
            },
          });
        },
      };
    },

    // Client-side atoms for reactive monitoring
    getAtoms: ($fetch) => {
      // TODO: Implement reactive atoms for monitoring state
      return {
        // securityEvents: atom([]),
        // monitoringStats: atom(null)
      };
    },

    // Override HTTP methods for monitoring endpoints
    pathMethods: {
      "/monitor/events": "GET",
      "/monitor/stats": "GET",
      "/monitor/trigger-action": "POST",
      "/monitor/user-actions": "GET",
      "/monitor/failed-login": "POST",
    },
  } satisfies BetterAuthClientPlugin;
};
