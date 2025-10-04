export interface MonitorOptions {
  /** Threshold for failed login attempts before flagging (default: 5) */
  failedLoginThreshold?: number;
  /** Time window for failed login attempts in minutes (default: 10) */
  failedLoginWindow?: number;
  /** Threshold for bot detection - requests per time window (default: 10) */
  botDetectionThreshold?: number;
  /** Time window for bot detection in seconds (default: 10) */
  botDetectionWindow?: number;
  /** Enable unusual location detection (default: true) */
  enableLocationDetection?: boolean;
  /** Enable failed login monitoring (default: true) */
  enableFailedLoginMonitoring?: boolean;
  /** Enable bot detection (default: true) */
  enableBotDetection?: boolean;
  /** Custom logger function (optional) */
  logger?: (event: SecurityEvent) => void;
}

export interface SecurityEvent {
  type: 'failed_login' | 'unusual_location' | 'bot_activity';
  userId?: string;
  timestamp: string;
  ip: string;
  attempts?: number;
  previousCountry?: string;
  currentCountry?: string;
  requestRate?: string;
  metadata?: Record<string, any>;
}

export interface FailedLoginAttempt {
  timestamp: number;
  ip: string;
  userId: string;
}

export interface BotActivity {
  ip: string;
  timestamp: number;
  count: number;
}

export interface UserLocation {
  userId: string;
  country: string;
  lastLogin: number;
}
