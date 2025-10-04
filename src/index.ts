// Main exports for the Better Auth Monitor plugin
export { betterAuthMonitor, trackFailedLoginManually } from "./plugin";
export { betterAuthMonitorClient } from "./client-plugin";
export type { 
  MonitorOptions, 
  SecurityEvent, 
  FailedLoginAttempt, 
  BotActivity, 
  UserLocation 
} from "./types";

// Import for default export
import { betterAuthMonitor } from "./plugin";

// Default export for convenience
export default betterAuthMonitor;
