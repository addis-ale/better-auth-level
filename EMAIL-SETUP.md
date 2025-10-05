# Email Notification Setup Guide

This guide explains how to fix the `sendEmailNotification` function and set up email notifications for the Better Auth Monitor plugin.

## 🚨 **The Problem**

The `sendEmailNotification` function was not working because:

1. **Missing Email Service**: No email service was configured
2. **Missing Configuration**: The `securityActions.sendEmail` function was not provided
3. **Missing Dependencies**: Required email dependencies were not installed

## ✅ **The Solution**

### Step 1: Install Required Dependencies

```bash
npm install nodemailer
npm install @types/nodemailer --save-dev
```

### Step 2: Configure Environment Variables

Create a `.env` file with your SMTP settings:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=security@yourapp.com

# For Gmail, you need to:
# 1. Enable 2-factor authentication
# 2. Generate an App Password
# 3. Use the App Password instead of your regular password
```

### Step 3: Configure the Plugin with Email Service

```typescript
import { betterAuth } from "better-auth";
import { betterAuthMonitor, emailService } from "better-auth-monitor";

export const auth = betterAuth({
  database: {
    // Your database configuration
  },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 5,
      
      // Configure security actions with email notifications
      securityActions: {
        enable2FAEnforcement: true,
        enablePasswordResetEnforcement: true,
        
        // Provide the email sending function
        sendEmail: async (notification) => {
          try {
            await emailService.sendEmail(notification);
            console.log('✅ Email sent successfully:', notification.subject);
            return true;
          } catch (error) {
            console.error('❌ Failed to send email:', error);
            throw error; // Re-throw to let the plugin handle the error
          }
        }
      }
    })
  ]
});
```

### Step 4: Test Email Functionality

```typescript
// Test the email service directly
import { emailService } from "better-auth-monitor";

async function testEmail() {
  try {
    await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Security Alert',
      template: 'security_alert',
      data: {
        userName: 'Test User',
        reason: 'Multiple failed login attempts',
        ip: '192.168.1.100',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Test email sent successfully');
  } catch (error) {
    console.error('❌ Test email failed:', error);
  }
}
```

## 📧 **Email Templates**

The plugin includes 4 email templates:

### 1. Security Alert (`security_alert`)
Sent when suspicious activity is detected:
- Failed login attempts
- Unusual locations
- Bot activity

### 2. 2FA Setup (`2fa_setup`)
Sent when 2FA is enabled:
- Backup codes
- Security tips
- Setup confirmation

### 3. Password Reset (`password_reset`)
Sent when password reset is requested:
- Reset link
- Expiration notice
- Security warnings

### 4. Account Lockout (`account_lockout`)
Sent when account is locked:
- Lockout reason
- Unlock instructions
- Support contact

## 🔧 **Custom Email Service**

If you want to use your own email service:

```typescript
import { betterAuthMonitor } from "better-auth-monitor";

export const auth = betterAuth({
  plugins: [
    betterAuthMonitor({
      securityActions: {
        sendEmail: async (notification) => {
          // Your custom email service
          await yourEmailService.send({
            to: notification.to,
            subject: notification.subject,
            html: generateHTML(notification),
            // ... other options
          });
        }
      }
    })
  ]
});
```

## 🧪 **Testing**

### Test Email Service

```bash
# Run the email test
node test/email-test.js
```

### Test Plugin Integration

```typescript
// Test the complete flow
import { betterAuthMonitor } from "better-auth-monitor";

const auth = betterAuth({
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 1, // Very sensitive for testing
      securityActions: {
        sendEmail: async (notification) => {
          console.log('📧 Email notification:', notification);
          // Your email service here
        }
      }
    })
  ]
});

// Trigger a failed login to test
// This should send an email notification
```

## 🚨 **Troubleshooting**

### Common Issues

1. **"No email function configured"**
   - Solution: Provide `securityActions.sendEmail` function

2. **"SMTP authentication failed"**
   - Solution: Check SMTP credentials and use App Password for Gmail

3. **"Connection timeout"**
   - Solution: Check SMTP_HOST and SMTP_PORT settings

4. **"Email not sending"**
   - Solution: Check console logs for error messages

### Debug Mode

Enable debug logging:

```typescript
betterAuthMonitor({
  securityActions: {
    sendEmail: async (notification) => {
      console.log('🔍 Email notification debug:', notification);
      await emailService.sendEmail(notification);
    }
  }
})
```

## 📊 **Email Analytics**

Track email delivery:

```typescript
betterAuthMonitor({
  securityActions: {
    sendEmail: async (notification) => {
      try {
        await emailService.sendEmail(notification);
        
        // Log successful delivery
        console.log(`📧 Email sent to ${notification.to}: ${notification.subject}`);
        
        // Store in database
        await logEmailSent(notification);
        
      } catch (error) {
        // Log failure
        console.error(`❌ Email failed for ${notification.to}:`, error);
        
        // Implement fallback
        await sendToSlack(notification);
      }
    }
  }
})
```

## 🔒 **Security Considerations**

1. **Use App Passwords**: Never use your main email password
2. **Secure SMTP**: Use TLS/SSL for email transmission
3. **Rate Limiting**: Implement rate limiting for email sending
4. **Error Handling**: Don't expose sensitive information in error messages

## 📝 **Environment Variables Reference**

```bash
# Required for email functionality
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=security@yourapp.com

# Optional
ADMIN_EMAIL=admin@yourapp.com
APP_URL=https://yourapp.com
```

## 🎯 **Quick Start Checklist**

- [ ] Install `nodemailer` dependency
- [ ] Set up SMTP environment variables
- [ ] Configure `securityActions.sendEmail` function
- [ ] Test email service with `test/email-test.js`
- [ ] Test plugin integration
- [ ] Monitor email delivery logs

## 📞 **Support**

If you're still having issues:

1. Check the console logs for error messages
2. Verify your SMTP settings
3. Test the email service independently
4. Check the plugin configuration
5. Review the troubleshooting section above

The email notification system is now fully functional and will send beautiful HTML emails for all security events!
