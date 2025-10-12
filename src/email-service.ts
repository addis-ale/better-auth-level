import nodemailer from "nodemailer";
import { EmailNotification } from "./types";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<void> {
    const html = this.generateEmailHTML(notification);

    await this.transporter.sendMail({
      from: this.config.from,
      to: notification.to,
      subject: notification.subject,
      html,
    });
  }

  /**
   * Generate HTML email content based on template
   */
  private generateEmailHTML(notification: EmailNotification): string {
    const { template, data } = notification;

    switch (template) {
      case "2fa_setup":
        return this.generate2FASetupHTML(data);
      case "password_reset":
        return this.generatePasswordResetHTML(data);
      case "security_alert":
        return this.generateSecurityAlertHTML(data);
      case "account_lockout":
        return this.generateAccountLockoutHTML(data);
      default:
        return this.generateDefaultHTML(notification);
    }
  }

  /**
   * Generate 2FA setup email HTML
   */
  private generate2FASetupHTML(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745; margin: 0 0 20px 0;">🔐 Two-Factor Authentication Setup</h2>
          
          <p>Hello ${data.userName},</p>
          
          <p>You have successfully enabled two-factor authentication for your account. This adds an extra layer of security to protect your account.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Backup Codes:</h3>
            <div style="font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 3px;">
              ${
                data.backupCodes
                  ?.map((code: string) => `<div>${code}</div>`)
                  .join("") || "No backup codes provided"
              }
            </div>
            <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">
              <strong>Important:</strong> Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">🔒 Security Tips:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
              <li>Keep your authenticator app secure</li>
              <li>Don't share your backup codes with anyone</li>
              <li>Contact support if you need assistance</li>
            </ul>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            If you didn't set up 2FA, please contact our support team immediately.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate password reset email HTML
   */
  private generatePasswordResetHTML(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">🔑 Password Reset Request</h2>
          
          <p>Hello ${data.userName},</p>
          
          <p>You have requested to reset your password. Click the link below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Important:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, ignore this email</li>
              <li>Your password will remain unchanged until you click the link</li>
            </ul>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate security alert email HTML
   */
  private generateSecurityAlertHTML(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">🚨 Security Alert</h2>
          
          <p>Hello ${data.userName},</p>
          
          <p>We detected suspicious activity on your account:</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Activity Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Reason:</strong> ${data.reason}</li>
              <li><strong>IP Address:</strong> ${data.ip}</li>
              <li><strong>Time:</strong> ${data.timestamp}</li>
            </ul>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ What this means:</h4>
            <p style="margin: 0; color: #721c24;">
              Someone may have attempted to access your account. If this wasn't you, please secure your account immediately.
            </p>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">🔒 Recommended Actions:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
              <li>Change your password if you haven't already</li>
              <li>Enable two-factor authentication</li>
              <li>Review your account activity</li>
              <li>Contact support if you need assistance</li>
            </ul>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            If you have any questions or concerns, please contact our support team.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate account lockout email HTML
   */
  private generateAccountLockoutHTML(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">🔒 Account Temporarily Locked</h2>
          
          <p>Hello ${data.userName},</p>
          
          <p>Your account has been temporarily locked due to suspicious activity:</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Lockout Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Reason:</strong> ${data.reason}</li>
              <li><strong>IP Address:</strong> ${data.ip}</li>
              <li><strong>Time:</strong> ${data.timestamp}</li>
            </ul>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ Important Notice:</h4>
            <p style="margin: 0; color: #721c24;">
              Your account will be automatically unlocked after a security review. 
              This is a protective measure to keep your account secure.
            </p>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">📞 Need Help?</h4>
            <p style="margin: 0; color: #0c5460;">
              If you believe this lockout is in error or need assistance, 
              please contact our support team immediately.
            </p>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            This is an automated security measure to protect your account.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate default email HTML
   */
  private generateDefaultHTML(notification: EmailNotification): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">${
            notification.subject
          }</h2>
          
          <p>Hello ${notification.data.userName},</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p>${JSON.stringify(notification.data, null, 2)}</p>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `;
  }
}

// Create default email service instance
export const emailService = new EmailService({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  from: process.env.EMAIL_FROM || "security@yourapp.com",
});

export default emailService;
