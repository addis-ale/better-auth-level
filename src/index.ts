// Main exports for the Better Auth Monitor plugin
export { betterAuthMonitor, trackFailedLoginManually } from "./plugin";
export { betterAuthMonitorClient } from "./client-plugin";
export { LocationDetectionService } from "./location-detection";
export type { 
  MonitorOptions, 
  SecurityEvent, 
  FailedLoginAttempt, 
  BotActivity, 
  UserLocation,
  LocationData,
  LocationAnomaly,
  UserLocationHistory,
  GeolocationResponse,
  NetworkAnalysis
} from "./types";

// Import for default export
import { betterAuthMonitor } from "./plugin";

// Default export for convenience
export default betterAuthMonitor;
