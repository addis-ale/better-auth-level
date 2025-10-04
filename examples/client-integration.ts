/**
 * Client Integration Example
 * 
 * This example shows how to use the Better Auth Monitor client plugin
 * in your frontend application.
 */

import { createAuthClient } from "better-auth/client";
import { betterAuthMonitorClient } from "better-auth-monitor";

// Client-side configuration
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000/api/auth",
  plugins: [
    betterAuthMonitorClient()
  ]
});

// Example: Using the monitoring client
export class SecurityMonitor {
  
  /**
   * Get recent security events
   */
  static async getRecentEvents(limit = 10) {
    try {
      const events = await authClient.getSecurityEvents({ 
        limit,
        type: undefined // Get all types
      });
      return events;
    } catch (error) {
      console.error("Failed to fetch security events:", error);
      return [];
    }
  }

  /**
   * Get monitoring statistics
   */
  static async getStats() {
    try {
      const stats = await authClient.getMonitoringStats();
      return stats;
    } catch (error) {
      console.error("Failed to fetch monitoring stats:", error);
      return null;
    }
  }

  /**
   * Monitor for specific event types
   */
  static async getFailedLoginEvents() {
    return await authClient.getSecurityEvents({ 
      type: 'failed_login' 
    });
  }

  /**
   * Monitor for bot activity
   */
  static async getBotActivity() {
    return await authClient.getSecurityEvents({ 
      type: 'bot_activity' 
    });
  }
}

// Example usage in a React component
export const SecurityDashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Load initial data
    SecurityMonitor.getRecentEvents(20).then(setEvents);
    SecurityMonitor.getStats().then(setStats);
  }, []);

  return (
    <div>
      <h2>Security Monitor Dashboard</h2>
      {/* Your dashboard UI here */}
    </div>
  );
};
