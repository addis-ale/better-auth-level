# Email Provider Integration Guide

This guide shows how to integrate the Better Auth Monitor plugin with different email providers.

## 📧 Available Integrations

### 1. **Resend** (Recommended)
- **Pros**: Modern, developer-friendly, great deliverability
- **Setup**: Get API key from [resend.com](https://resend.com)
- **File**: `resend-integration.ts`

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

### 2. **SendGrid**
- **Pros**: Reliable, feature-rich, good analytics
- **Setup**: Get API key from [sendgrid.com](https://sendgrid.com)
- **File**: `sendgrid-integration.ts`

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### 3. **AWS SES**
- **Pros**: Cost-effective, scalable, integrates with AWS
- **Setup**: Configure AWS credentials and SES
- **File**: `aws-ses-integration.ts`

```bash
npm install @aws-sdk/client-ses
```

```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
```

### 4. **Nodemailer (SMTP)**
- **Pros**: Works with any SMTP provider, flexible
- **Setup**: Configure SMTP settings
- **File**: `nodemailer-integration.ts`

```bash
npm install nodemailer
```

```typescript
import nodemailer from 'nodemailer';
```

### 5. **Console Logging** (Development)
- **Pros**: No setup required, good for testing
- **Setup**: None required
- **File**: `console-logging.ts`

## 🚀 Quick Setup

### Step 1: Choose Your Email Provider
Pick one of the integrations above based on your needs.

### Step 2: Install Dependencies
```bash
# For Resend
npm install resend

# For SendGrid
npm install @sendgrid/mail

# For AWS SES
npm install @aws-sdk/client-ses

# For Nodemailer
npm install nodemailer
```

### Step 3: Set Environment Variables
```bash
# Resend
RESEND_API_KEY=re_xxxxxxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxx

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxx

# SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 4: Configure Better Auth
```typescript
import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "better-auth-monitor";
import { sendEmail } from "./your-email-provider";

export const auth = betterAuth({
  database: { /* your config */ },
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 5,
      enableFailedLoginMonitoring: true,
      securityActions: {
        enable2FAEnforcement: true,
        enablePasswordResetEnforcement: true,
        sendEmail: sendEmail, // Your email function
      }
    })
  ]
});
```

## 📝 Email Templates

The plugin supports custom email templates for different security scenarios:

- **2FA Setup**: When user needs to enable two-factor authentication
- **Password Reset**: When user needs to reset their password
- **Security Alert**: General security notifications

## 🔧 Customization

### Custom Email Templates
```typescript
securityActions: {
  sendEmail: sendEmail,
  twoFactorEmailTemplate: (data) => ({
    subject: 'Custom 2FA Subject',
    html: '<h1>Custom HTML</h1>',
    text: 'Custom text content'
  }),
  passwordResetEmailTemplate: (data) => ({
    subject: 'Custom Password Reset Subject',
    html: '<h1>Custom HTML</h1>',
    text: 'Custom text content'
  })
}
```

### Custom Email Function
```typescript
const sendEmail = async (notification) => {
  // Your custom email logic
  console.log('Sending email:', notification);
  
  // Example: Send to multiple providers
  await Promise.all([
    sendViaResend(notification),
    sendViaSlack(notification),
    saveToDatabase(notification)
  ]);
};
```

## 🧪 Testing

### Development Mode
Use console logging for development:
```typescript
securityActions: {
  sendEmail: async (notification) => {
    console.log('📧 Email would be sent:', notification);
  }
}
```

### Production Mode
Use a real email provider with proper error handling:
```typescript
securityActions: {
  sendEmail: async (notification) => {
    try {
      await emailProvider.send(notification);
      console.log('✅ Email sent successfully');
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Handle error (retry, fallback, etc.)
    }
  }
}
```

## 📊 Monitoring

The plugin provides endpoints to monitor email sending:

- `GET /api/auth/monitor/stats` - Get email statistics
- `GET /api/auth/monitor/user-actions` - Get user security actions
- `POST /api/auth/monitor/trigger-action` - Manually trigger security actions

## 🔒 Security Considerations

1. **API Keys**: Store email provider API keys securely
2. **Rate Limiting**: Implement rate limiting for email sending
3. **Error Handling**: Handle email sending failures gracefully
4. **Logging**: Log email sending attempts for debugging
5. **Templates**: Sanitize user data in email templates

## 📚 Examples

See the individual integration files for complete examples:
- `resend-integration.ts` - Resend integration
- `sendgrid-integration.ts` - SendGrid integration
- `aws-ses-integration.ts` - AWS SES integration
- `nodemailer-integration.ts` - Nodemailer integration
- `console-logging.ts` - Development logging
