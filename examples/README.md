# Better Auth Monitor Plugin

A comprehensive monitoring plugin for Better Auth that detects suspicious authentication activities and triggers security actions.

## 🚀 Quick Start

### Installation

```bash
npm install better-auth-monitor
```

### Basic Setup

```typescript
import { betterAuth } from "better-auth";
import { betterAuthMonitor } from "better-auth-monitor";

// Your email service (same pattern as Better Auth)
const SendEmailAction = async ({ to, subject, meta }) => {
  // Implement your email service here
  // This could be Resend, SendGrid, AWS SES, Nodemailer, etc.
  console.log(`📧 Sending email to ${to}: ${subject}`);
  // await yourEmailService.send({ to, subject, html: generateHTML(meta) });
};

export const auth = betterAuth({
  database: { /* your config */ },
  
  // Better Auth's built-in email features
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await SendEmailAction({
        to: user.email,
        subject: "Verify Your Email",
        meta: { description: "Please verify your email", link: url }
      });
    }
  },
  
  // Add the monitoring plugin
  plugins: [
    betterAuthMonitor({
      failedLoginThreshold: 3,
      failedLoginWindow: 5,
      enableFailedLoginMonitoring: true,
      securityActions: {
        enable2FAEnforcement: true,
        enablePasswordResetEnforcement: true,
        // Use the SAME email function as Better Auth
        sendEmail: async (notification) => {
          await SendEmailAction({
            to: notification.to,
            subject: notification.subject,
            meta: {
              description: notification.data.reason || 'Security notification',
              reason: notification.data.reason,
              ip: notification.data.ip,
              timestamp: notification.data.timestamp,
            }
          });
        }
      }
    })
  ]
});
```

## 📧 Email Provider Integration

The plugin follows Better Auth's pattern where **you provide your own email function**. No default provider is included.

### Example with Resend

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

const SendEmailAction = async ({ to, subject, meta }) => {
  await resend.emails.send({
    from: 'security@yourapp.com',
    to: [to],
    subject: subject,
    html: generateHTML(meta)
  });
};
```

### Example with SendGrid

```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const SendEmailAction = async ({ to, subject, meta }) => {
  await sgMail.send({
    to: to,
    from: 'security@yourapp.com',
    subject: subject,
    html: generateHTML(meta)
  });
};
```

### Example with AWS SES

```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const sesClient = new SESClient({ region: process.env.AWS_REGION });

const SendEmailAction = async ({ to, subject, meta }) => {
  await sesClient.send(new SendEmailCommand({
    Source: 'security@yourapp.com',
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: generateHTML(meta) } }
    }
  }));
};
```

## 🔧 Configuration Options

```typescript
betterAuthMonitor({
  // Basic monitoring
  failedLoginThreshold: 3,        // Alert after 3 failed attempts
  failedLoginWindow: 5,            // Within 5 minutes
  enableFailedLoginMonitoring: true,
  
  // Security actions
  securityActions: {
    enable2FAEnforcement: true,        // Enable 2FA enforcement
    enablePasswordResetEnforcement: true, // Enable password reset enforcement
    sendEmail: yourEmailFunction,      // Your email function
  },
  
  // Custom logger
  logger: (event) => {
    console.log(`🚨 Security Event: ${event.type}`);
  }
})
```

## 📊 API Endpoints

The plugin provides these endpoints:

- `GET /api/auth/monitor/stats` - Get monitoring statistics
- `GET /api/auth/monitor/events` - Get security events
- `POST /api/auth/monitor/trigger-action` - Manually trigger security actions
- `GET /api/auth/monitor/user-actions` - Get user security actions

### Manual Security Actions

```typescript
// Trigger 2FA enforcement
await fetch('/api/auth/monitor/trigger-action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user@example.com',
    actionType: 'enable_2fa',
    reason: 'Suspicious activity detected',
    ip: '192.168.1.100'
  })
});

// Trigger password reset
await fetch('/api/auth/monitor/trigger-action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user@example.com',
    actionType: 'reset_password',
    reason: 'Account compromised',
    ip: '192.168.1.100'
  })
});
```

## 🧪 Testing

### Development Mode

For development, you can use console logging:

```typescript
const SendEmailAction = async ({ to, subject, meta }) => {
  console.log(`📧 Email would be sent to ${to}: ${subject}`);
  console.log('Meta:', meta);
};
```

### Production Mode

Use your preferred email service with proper error handling:

```typescript
const SendEmailAction = async ({ to, subject, meta }) => {
  try {
    await yourEmailService.send({ to, subject, html: generateHTML(meta) });
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    // Handle error (retry, fallback, etc.)
  }
};
```

## 🔒 Security Features

- **Failed Login Detection**: Automatically detects multiple failed login attempts
- **2FA Enforcement**: Prompts users to enable two-factor authentication
- **Password Reset Enforcement**: Forces password resets for compromised accounts
- **Security Alerts**: Sends notifications for suspicious activity
- **IP Tracking**: Monitors login attempts by IP address
- **Rate Limiting**: Built-in protection against brute force attacks

## 📚 Examples

See the `examples/` directory for complete integration examples:

- `developer-email-integration.ts` - Complete integration example
- `better-auth-pattern-integration.ts` - Following Better Auth's pattern
- `email-providers/` - Examples for different email providers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.
