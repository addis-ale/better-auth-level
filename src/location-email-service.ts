import nodemailer from "nodemailer";
import { LocationData, LocationVerificationEmail } from "./location-types";
import {
  getDistanceDescription,
  getBearingDescription,
} from "./location-utils";

export interface LocationEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  adminEmail: string;
}

export class LocationEmailService {
  private transporter: nodemailer.Transporter;
  private config: LocationEmailConfig;

  constructor(config: LocationEmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransporter(config);
  }

  /**
   * Send suspicious location verification email
   */
  async sendLocationVerificationEmail(
    userId: string,
    email: string,
    currentLocation: LocationData,
    previousLocation?: LocationData,
    verificationToken?: string
  ): Promise<void> {
    const verificationUrl = verificationToken
      ? `${
          process.env.APP_URL || "http://localhost:3000"
        }/auth/verify-location?token=${verificationToken}`
      : "#";

    const distance = previousLocation
      ? getDistanceDescription(
          Math.sqrt(
            Math.pow(currentLocation.latitude - previousLocation.latitude, 2) +
              Math.pow(
                currentLocation.longitude - previousLocation.longitude,
                2
              )
          ) * 111 // Rough conversion to km
        )
      : "Unknown";

    const subject = `🔍 Unusual Login Location Detected`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">🔍 Unusual Login Location</h2>

          <p>We detected a login from an unusual location for your account:</p>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Current Login Location:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Location:</strong> ${currentLocation.city}, ${
      currentLocation.region
    }, ${currentLocation.country}</li>
              <li><strong>IP Address:</strong> ${currentLocation.ip}</li>
              <li><strong>Time:</strong> ${new Date(
                currentLocation.timestamp
              ).toLocaleString()}</li>
              <li><strong>ISP:</strong> ${currentLocation.isp || "Unknown"}</li>
            </ul>
          </div>

          ${
            previousLocation
              ? `
          <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Previous Login Location:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Location:</strong> ${previousLocation.city}, ${
                  previousLocation.region
                }, ${previousLocation.country}</li>
              <li><strong>Time:</strong> ${new Date(
                previousLocation.timestamp
              ).toLocaleString()}</li>
              <li><strong>Distance:</strong> ${distance}</li>
            </ul>
          </div>
          `
              : ""
          }

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Is this you?</h4>
            <p style="margin: 0; color: #856404;">
              If this login was made by you, please verify it to continue using your account normally.
              If this wasn't you, please secure your account immediately.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}&action=verify"
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">
              ✅ Yes, this is me
            </a>
            <a href="${verificationUrl}&action=reject"
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">
              ❌ No, this wasn't me
            </a>
          </div>

          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">🔒 Security Tips:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
              <li>Always use strong, unique passwords</li>
              <li>Enable two-factor authentication when available</li>
              <li>Be cautious of suspicious emails or links</li>
              <li>Contact support if you have any concerns</li>
            </ul>
          </div>

          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            This verification link will expire in 24 hours. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.fromEmail,
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send location verified confirmation email
   */
  async sendLocationVerifiedEmail(
    userId: string,
    email: string,
    location: LocationData
  ): Promise<void> {
    const subject = `✅ Location Verified Successfully`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745; margin: 0 0 20px 0;">✅ Location Verified</h2>

          <p>Your login from the following location has been verified and trusted:</p>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Verified Location:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Location:</strong> ${location.city}, ${
      location.region
    }, ${location.country}</li>
              <li><strong>IP Address:</strong> ${location.ip}</li>
              <li><strong>Time:</strong> ${new Date(
                location.timestamp
              ).toLocaleString()}</li>
            </ul>
          </div>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #155724;">✅ What this means:</h4>
            <p style="margin: 0; color: #155724;">
              This location and device are now trusted for future logins. You won't need to verify this location again unless there are significant changes.
            </p>
          </div>

          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            Thank you for helping us keep your account secure!
          </p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.fromEmail,
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send location rejected security alert email
   */
  async sendLocationRejectedEmail(
    userId: string,
    email: string,
    location: LocationData
  ): Promise<void> {
    const subject = `🚨 Suspicious Login Blocked`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">🚨 Suspicious Login Blocked</h2>

          <p>You have rejected a login from the following location, and we have taken immediate security measures:</p>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Blocked Location:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Location:</strong> ${location.city}, ${
      location.region
    }, ${location.country}</li>
              <li><strong>IP Address:</strong> ${location.ip}</li>
              <li><strong>Time:</strong> ${new Date(
                location.timestamp
              ).toLocaleString()}</li>
            </ul>
          </div>

          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #721c24;">🔒 Security Actions Taken:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #721c24;">
              <li>Blocked the suspicious IP address</li>
              <li>Revoked all active sessions from that device</li>
              <li>Logged the security event for review</li>
              <li>Notified our security team</li>
            </ul>
          </div>

          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">📞 Next Steps:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
              <li>Change your password immediately if you haven't already</li>
              <li>Review your account activity for any unauthorized access</li>
              <li>Enable two-factor authentication for extra security</li>
              <li>Contact our support team if you need assistance</li>
            </ul>
          </div>

          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            Thank you for helping us protect your account. If you have any concerns, please contact our support team immediately.
          </p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.fromEmail,
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send admin notification for suspicious location activity
   */
  async sendAdminLocationAlert(
    userId: string,
    email: string,
    location: LocationData,
    suspiciousEvent: any
  ): Promise<void> {
    const subject = `🚨 Admin Alert - Suspicious Location: ${userId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">🚨 Admin Security Alert</h2>

          <p>A user has triggered suspicious location detection:</p>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">User Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>User ID:</strong> ${userId}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Location:</strong> ${location.city}, ${
      location.region
    }, ${location.country}</li>
              <li><strong>IP Address:</strong> ${location.ip}</li>
              <li><strong>Time:</strong> ${new Date(
                location.timestamp
              ).toLocaleString()}</li>
              <li><strong>Confidence:</strong> ${Math.round(
                suspiciousEvent.confidence * 100
              )}%</li>
            </ul>
          </div>

          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">📊 Action Required:</h4>
            <p style="margin: 0; color: #0c5460;">
              Review this user's activity in the admin dashboard and take appropriate action if needed.
              The user has been sent a verification email.
            </p>
          </div>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.fromEmail,
      to: this.config.adminEmail,
      subject,
      html,
    });
  }
}

export const locationEmailService = new LocationEmailService({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  fromEmail: process.env.EMAIL_FROM || "security@yourapp.com",
  adminEmail: process.env.ADMIN_EMAIL || "admin@yourapp.com",
});

export default locationEmailService;
