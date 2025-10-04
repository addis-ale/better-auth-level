// Main exports for the Better Auth Monitor plugin
export { betterAuthMonitor } from "./plugin";
export { betterAuthMonitorClient } from "./client-plugin";
export type { 
  MonitorOptions, 
  SecurityEvent, 
  FailedLoginAttempt, 
  BotActivity, 
  UserLocation 
} from "./types";

// Default export for convenience
export default betterAuthMonitor;
