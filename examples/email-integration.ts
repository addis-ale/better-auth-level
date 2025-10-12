// /**
//  * Email Integration Example
//  *
//  * This example shows how to integrate the email service with the Better Auth Monitor plugin
//  */

// import { betterAuth } from "better-auth";
// import { betterAuthMonitor } from "../src/plugin";
// import { emailService } from "../src/email-service";

// // Example 1: Basic email integration
// export const auth = betterAuth({
//   database: {
//     // Your database configuration
//   },
//   plugins: [
//     betterAuthMonitor({
//       failedLoginThreshold: 3,
//       failedLoginWindow: 5,

//       // Configure security actions with email notifications
//       securityActions: {
//         enable2FAEnforcement: true,
//         enablePasswordResetEnforcement: true,

//         // Provide the email sending function
//         sendEmail: async (notification) => {
//           try {
//             await emailService.sendEmail(notification);
//             console.log('✅ Email sent successfully:', notification.subject);
//           } catch (error) {
//             console.error('❌ Failed to send email:', error);
//             throw error; // Re-throw to let the plugin handle the error
//           }
//         }
//       }
//     })
//   ]
// });

// // Example 2: Custom email service integration
// import nodemailer from 'nodemailer';

// const customEmailService = {
//   async sendEmail(notification: any) {
//     // Create your own email transporter
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: parseInt(process.env.SMTP_PORT || '587'),
//       secure: false,
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     // Generate HTML content
//     const html = generateEmailHTML(notification);

//     // Send email
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: notification.to,
//       subject: notification.subject,
//       html,
//     });
//   }
// };

// function generateEmailHTML(notification: any): string {
//   const { template, data } = notification;

//   switch (template) {
//     case 'security_alert':
//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>🚨 Security Alert</h2>
//           <p>Hello ${data.userName},</p>
//           <p>We detected suspicious activity on your account:</p>
//           <ul>
//             <li><strong>Reason:</strong> ${data.reason}</li>
//             <li><strong>IP:</strong> ${data.ip}</li>
//             <li><strong>Time:</strong> ${data.timestamp}</li>
//           </ul>
//           <p>If this wasn't you, please secure your account immediately.</p>
//         </div>
//       `;
//     default:
//       return `<p>${notification.subject}</p>`;
//   }
// }

// export const authWithCustomEmail = betterAuth({
//   database: {
//     // Your database configuration
//   },
//   plugins: [
//     betterAuthMonitor({
//       failedLoginThreshold: 3,
//       securityActions: {
//         sendEmail: customEmailService.sendEmail
//       }
//     })
//   ]
// });

// // Example 3: Testing email functionality
// export async function testEmailNotification() {
//   try {
//     // Test the email service directly
//     await emailService.sendEmail({
//       to: 'test@example.com',
//       subject: 'Test Security Alert',
//       template: 'security_alert',
//       data: {
//         userName: 'Test User',
//         reason: 'Multiple failed login attempts',
//         ip: '192.168.1.100',
//         timestamp: new Date().toISOString()
//       }
//     });

//     console.log('✅ Test email sent successfully');
//   } catch (error) {
//     console.error('❌ Test email failed:', error);
//   }
// }

// // Example 4: Environment variables setup
// export const environmentSetup = {
//   // Required environment variables for email service
//   SMTP_HOST: 'smtp.gmail.com',
//   SMTP_PORT: '587',
//   SMTP_SECURE: 'false',
//   SMTP_USER: 'your-email@gmail.com',
//   SMTP_PASS: 'your-app-password',
//   EMAIL_FROM: 'security@yourapp.com'
// };

// // Example 5: Error handling and logging
// export const authWithErrorHandling = betterAuth({
//   database: {
//     // Your database configuration
//   },
//   plugins: [
//     betterAuthMonitor({
//       failedLoginThreshold: 3,
//       securityActions: {
//         sendEmail: async (notification) => {
//           try {
//             await emailService.sendEmail(notification);

//             // Log successful email
//             console.log(`📧 Email sent to ${notification.to}: ${notification.subject}`);

//             // You can also log to your database
//             // await logEmailSent(notification);

//           } catch (error) {
//             // Log email failure
//             console.error(`❌ Email failed for ${notification.to}:`, error);

//             // You can implement fallback mechanisms here
//             // await sendToSlack(notification);
//             // await logToDatabase(notification);

//             // Re-throw to let the plugin know email failed
//             throw error;
//           }
//         }
//       }
//     })
//   ]
// });

// // Example 6: Multiple email providers
// export class MultiProviderEmailService {
//   private primaryService: any;
//   private fallbackService: any;

//   constructor() {
//     this.primaryService = emailService;
//     // You could set up a fallback service here
//   }

//   async sendEmail(notification: any) {
//     try {
//       // Try primary service first
//       await this.primaryService.sendEmail(notification);
//     } catch (primaryError) {
//       console.warn('Primary email service failed, trying fallback...');

//       try {
//         // Try fallback service
//         await this.fallbackService.sendEmail(notification);
//       } catch (fallbackError) {
//         console.error('All email services failed:', { primaryError, fallbackError });
//         throw new Error('Email delivery failed');
//       }
//     }
//   }
// }

// export const authWithMultiProvider = betterAuth({
//   database: {
//     // Your database configuration
//   },
//   plugins: [
//     betterAuthMonitor({
//       securityActions: {
//         sendEmail: new MultiProviderEmailService().sendEmail
//       }
//     })
//   ]
// });

