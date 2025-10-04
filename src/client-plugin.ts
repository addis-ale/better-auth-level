import type { BetterAuthClientPlugin } from "better-auth/client";
import type { MonitorOptions } from "./types";

// Type for the fetch function
type FetchFunction = (url: string, options?: any) => Promise<any>;

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
    getActions: ($fetch: FetchFunction) => {
      return {
        // Get security events
        getSecurityEvents: async (params: { limit?: number; type?: string }) => {
          return $fetch("/monitor/events", {
            method: "GET",
            query: params
          });
        },
        
        // Get monitoring statistics
        getMonitoringStats: async () => {
          return $fetch("/monitor/stats", {
            method: "GET"
          });
        },

        // Get location monitoring statistics
        getLocationStats: async () => {
          return $fetch("/monitor/location-stats", {
            method: "GET"
          });
        },

        // Get user location history
        getUserLocationHistory: async (userId: string) => {
          return $fetch(`/monitor/user-locations/${userId}`, {
            method: "GET"
          });
        },

        // Get location data for an IP (for testing)
        getLocationData: async (ip: string) => {
          return $fetch("/monitor/location-data", {
            method: "POST",
            body: { ip }
          });
        }
      };
    },

    // Client-side atoms for reactive monitoring
    getAtoms: ($fetch: FetchFunction) => {
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
      "/monitor/location-stats": "GET",
      "/monitor/user-locations/:userId": "GET",
      "/monitor/location-data": "POST"
    }
  } satisfies BetterAuthClientPlugin;
};
