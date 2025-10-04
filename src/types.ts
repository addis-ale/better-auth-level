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
  /** Security action options for 2FA and password reset */
  securityActions?: SecurityActionOptions;
}

export interface SecurityEvent {
  type: 'failed_login' | 'unusual_location' | 'bot_activity' | 'security_action_triggered';
  userId?: string;
  timestamp: string;
  ip: string;
  attempts?: number;
  previousCountry?: string;
  currentCountry?: string;
  requestRate?: string;
  action?: SecurityAction;
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

export interface SecurityAction {
  type: 'enable_2fa' | 'reset_password' | 'account_lockout' | 'security_alert';
  userId: string;
  reason: string;
  timestamp: string;
  ip: string;
  emailSent?: boolean;
  metadata?: Record<string, any>;
}

export interface EmailNotification {
  to: string;
  subject: string;
  template: '2fa_setup' | 'password_reset' | 'security_alert' | 'account_lockout';
  data: {
    userName?: string;
    resetUrl?: string;
    totpUri?: string;
    backupCodes?: string[];
    reason?: string;
    ip?: string;
    timestamp?: string;
  };
}

export interface SecurityActionOptions {
  /** Enable 2FA enforcement for suspicious activity */
  enable2FAEnforcement?: boolean;
  /** Enable password reset enforcement for suspicious activity */
  enablePasswordResetEnforcement?: boolean;
  /** Custom email sending function - developer provides their own email service */
  sendEmail?: (notification: EmailNotification) => Promise<void>;
}
