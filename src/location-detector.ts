import {
  LocationData,
  SuspiciousLocationEvent,
  LocationDetectionConfig,
  LocationVerificationEmail,
} from "./location-types";
import { GeolocationService } from "./geolocation-service";
import { locationStorage } from "./location-storage";
import { locationEmailService } from "./location-email-service";
import {
  isLocationSuspicious,
  generateDeviceFingerprint,
  isPrivateIP,
  validateCoordinates,
} from "./location-utils";
import crypto from "crypto";

/**
 * Main location detection service that handles suspicious login detection
 */
export class LocationDetector {
  private geolocationService: GeolocationService;
  private config: LocationDetectionConfig;

  constructor(config: LocationDetectionConfig) {
    this.config = config;
    this.geolocationService = new GeolocationService(
      config.geolocationProvider,
      config.apiKey
    );
  }

  /**
   * Process a login attempt and detect suspicious locations
   */
  async processLoginAttempt(
    userId: string,
    ip: string,
    userAgent?: string,
    deviceFingerprint?: string
  ): Promise<{
    suspicious: boolean;
    event?: SuspiciousLocationEvent;
    location: LocationData;
    action: "allow" | "verify" | "block";
  }> {
    try {
      // Skip detection for private IPs
      if (isPrivateIP(ip)) {
        console.log(`Skipping location detection for private IP: ${ip}`);
        return {
          suspicious: false,
          location: await this.createPrivateIPLocation(ip),
          action: "allow",
        };
      }

      // Get current location
      const currentLocation = await this.geolocationService.getLocation(ip);

      // Validate coordinates
      if (
        !validateCoordinates(
          currentLocation.latitude,
          currentLocation.longitude
        )
      ) {
        console.warn(`Invalid coordinates for IP ${ip}:`, currentLocation);
        return {
          suspicious: false,
          location: currentLocation,
          action: "allow",
        };
      }

      // Store the location
      await locationStorage.storeUserLocation(userId, currentLocation);

      // Check if IP or device is already trusted
      const isIPTrusted = await locationStorage.isIPTrusted(userId, ip);
      const isDeviceTrusted = deviceFingerprint
        ? await locationStorage.isDeviceTrusted(userId, deviceFingerprint)
        : false;

      if (isIPTrusted || isDeviceTrusted) {
        console.log(`Login from trusted IP/device for user ${userId}`);
        return {
          suspicious: false,
          location: currentLocation,
          action: "allow",
        };
      }

      // Get previous location for comparison
      const previousLocation = await locationStorage.getLastKnownLocation(
        userId
      );

      if (!previousLocation) {
        // First login - store as trusted location
        console.log(
          `First login for user ${userId}, storing as trusted location`
        );
        await locationStorage.addTrustedIP(userId, ip);
        if (deviceFingerprint) {
          await locationStorage.addTrustedDevice(userId, deviceFingerprint);
        }
        return {
          suspicious: false,
          location: currentLocation,
          action: "allow",
        };
      }

      // Check for suspicious location
      const suspiciousCheck = isLocationSuspicious(
        currentLocation,
        previousLocation,
        this.config.distanceThreshold,
        this.config.newCountryThreshold
      );

      if (!suspiciousCheck.suspicious) {
        console.log(`Location appears normal for user ${userId}`);
        return {
          suspicious: false,
          location: currentLocation,
          action: "allow",
        };
      }

      // Create suspicious event
      const suspiciousEvent: SuspiciousLocationEvent = {
        id: `suspicious_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`,
        userId,
        currentLocation,
        previousLocation,
        distance:
          suspiciousCheck.reason === "distance_threshold"
            ? Math.sqrt(
                Math.pow(
                  currentLocation.latitude - previousLocation.latitude,
                  2
                ) +
                  Math.pow(
                    currentLocation.longitude - previousLocation.longitude,
                    2
                  )
              ) * 111 // Rough km conversion
            : undefined,
        reason: suspiciousCheck.reason as any,
        confidence: suspiciousCheck.confidence,
        timestamp: Date.now(),
        userAgent,
        deviceFingerprint,
      };

      // Store suspicious event
      await locationStorage.storeSuspiciousEvent(suspiciousEvent);

      // Generate verification token if email verification is enabled
      let verificationToken: string | undefined;
      if (this.config.verificationEmailEnabled) {
        verificationToken = crypto.randomBytes(32).toString("hex");

        // Store verification email data
        const verificationEmail: LocationVerificationEmail = {
          userId,
          email: userId, // Assuming userId is email, adjust as needed
          location: currentLocation,
          verificationToken,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          suspiciousEventId: suspiciousEvent.id,
        };

        await locationStorage.storeVerificationEmail(verificationEmail);
      }

      // Send verification email
      if (this.config.verificationEmailEnabled) {
        try {
          await locationEmailService.sendLocationVerificationEmail(
            userId,
            userId, // Assuming userId is email
            currentLocation,
            previousLocation,
            verificationToken
          );

          // Send admin notification
          await locationEmailService.sendAdminLocationAlert(
            userId,
            userId,
            currentLocation,
            suspiciousEvent
          );
        } catch (emailError) {
          console.error(
            "Failed to send location verification email:",
            emailError
          );
        }
      }

      // Trigger custom hook if provided
      if (this.config.onLocationAnomalyDetected) {
        try {
          await this.config.onLocationAnomalyDetected(suspiciousEvent);
        } catch (hookError) {
          console.error("Custom location anomaly hook failed:", hookError);
        }
      }

      // Determine action based on configuration
      let action: "allow" | "verify" | "block" = "verify";
      if (this.config.autoBlockSuspicious && suspiciousCheck.confidence > 0.8) {
        action = "block";
      }

      return {
        suspicious: true,
        event: suspiciousEvent,
        location: currentLocation,
        action,
      };
    } catch (error) {
      console.error("Location detection error:", error);

      // Fallback: allow login but log the error
      return {
        suspicious: false,
        location: await this.createFallbackLocation(ip),
        action: "allow",
      };
    }
  }

  /**
   * Verify a suspicious location (user clicked "Yes, this is me")
   */
  async verifyLocation(
    verificationToken: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const verificationEmail = await locationStorage.getVerificationEmail(
        verificationToken
      );

      if (!verificationEmail) {
        return {
          success: false,
          message: "Invalid or expired verification token",
        };
      }

      if (verificationEmail.userId !== userId) {
        return {
          success: false,
          message: "Verification token does not match user",
        };
      }

      if (Date.now() > verificationEmail.expiresAt) {
        return { success: false, message: "Verification token has expired" };
      }

      // Mark location as trusted
      await locationStorage.addTrustedIP(userId, verificationEmail.location.ip);

      // Add device to trusted devices if available
      const deviceFingerprint = generateDeviceFingerprint();
      if (deviceFingerprint) {
        await locationStorage.addTrustedDevice(userId, deviceFingerprint);
      }

      // Send confirmation email
      try {
        await locationEmailService.sendLocationVerifiedEmail(
          userId,
          verificationEmail.email,
          verificationEmail.location
        );
      } catch (emailError) {
        console.error("Failed to send location verified email:", emailError);
      }

      // Trigger custom hook
      if (this.config.onLocationVerified) {
        try {
          await this.config.onLocationVerified(
            userId,
            verificationEmail.location
          );
        } catch (hookError) {
          console.error("Custom location verified hook failed:", hookError);
        }
      }

      // Clean up verification token
      await locationStorage.removeVerificationEmail(verificationToken);

      return { success: true, message: "Location verified successfully" };
    } catch (error) {
      console.error("Location verification error:", error);
      return { success: false, message: "Verification failed due to an error" };
    }
  }

  /**
   * Reject a suspicious location (user clicked "No, this wasn't me")
   */
  async rejectLocation(
    verificationToken: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const verificationEmail = await locationStorage.getVerificationEmail(
        verificationToken
      );

      if (!verificationEmail) {
        return {
          success: false,
          message: "Invalid or expired verification token",
        };
      }

      if (verificationEmail.userId !== userId) {
        return {
          success: false,
          message: "Verification token does not match user",
        };
      }

      // Block the IP address
      // Note: In a real implementation, you'd want to integrate with your auth system
      // to revoke tokens and block the IP
      console.log(
        `Blocking IP ${verificationEmail.location.ip} for user ${userId}`
      );

      // Send security alert email
      try {
        await locationEmailService.sendLocationRejectedEmail(
          userId,
          verificationEmail.email,
          verificationEmail.location
        );
      } catch (emailError) {
        console.error("Failed to send location rejected email:", emailError);
      }

      // Trigger custom hook
      if (this.config.onLocationRejected) {
        try {
          await this.config.onLocationRejected(
            userId,
            verificationEmail.location
          );
        } catch (error) {
          console.log(error);
        }
      }

      // Clean up verification token
      await locationStorage.removeVerificationEmail(verificationToken);

      return {
        success: true,
        message: "Suspicious location blocked successfully",
      };
    } catch (error) {
      console.error("Location rejection error:", error);
      return { success: false, message: "Rejection failed due to an error" };
    }
  }

  /**
   * Get user's location statistics
   */
  async getUserLocationStats(userId: string) {
    return await locationStorage.getUserLocationStats(userId);
  }

  /**
   * Get suspicious events for a user
   */
  async getUserSuspiciousEvents(userId: string, limit: number = 20) {
    return await locationStorage.getSuspiciousEvents(userId, limit);
  }

  /**
   * Create a fallback location for private IPs
   */
  private async createPrivateIPLocation(ip: string): Promise<LocationData> {
    return {
      ip,
      country: "Private Network",
      countryCode: "PRIVATE",
      region: "Private",
      regionCode: "PRIVATE",
      city: "Private",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
      timestamp: Date.now(),
      accuracy: 0,
    };
  }

  /**
   * Create a fallback location when geolocation fails
   */
  private async createFallbackLocation(ip: string): Promise<LocationData> {
    return {
      ip,
      country: "Unknown",
      countryCode: "XX",
      region: "Unknown",
      regionCode: "XX",
      city: "Unknown",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
      timestamp: Date.now(),
      accuracy: 999, // Low accuracy
    };
  }
}

export default LocationDetector;

