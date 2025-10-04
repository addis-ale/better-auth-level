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
    $InferServerPlugin: {} as ReturnType<typeof import("./plugin").betterAuthMonitor>,
    
    // Client-side actions for monitoring
    getActions: ($fetch) => {
      return {
        // TODO: Add client actions for monitoring data
        getSecurityEvents: async (params: { limit?: number; type?: string }) => {
          // TODO: Implement client action for fetching security events
          return $fetch("/monitor/events", {
            method: "GET",
            query: params
          });
        },
        
        getMonitoringStats: async () => {
          // TODO: Implement client action for monitoring statistics
          return $fetch("/monitor/stats", {
            method: "GET"
          });
        }
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
      "/monitor/stats": "GET"
    }
  } satisfies BetterAuthClientPlugin;
};
