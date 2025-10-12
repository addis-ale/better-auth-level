/**
 * Email Service Test
 * 
 * This test demonstrates the email service functionality
 */

const { emailService } = require('../dist/email-service');

// Test function
async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  try {
    // Test 1: Security Alert Email
    console.log('Test 1: Security Alert Email');
    await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Security Alert',
      template: 'security_alert',
      data: {
        userName: 'Test User',
        reason: 'Multiple failed login attempts detected',
        ip: '192.168.1.100',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Security alert email sent successfully');

    // Test 2: 2FA Setup Email
    console.log('\nTest 2: 2FA Setup Email');
    await emailService.sendEmail({
      to: 'test@example.com',
      subject: '2FA Setup Complete',
      template: '2fa_setup',
      data: {
        userName: 'Test User',
        backupCodes: ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345']
      }
    });
    console.log('✅ 2FA setup email sent successfully');

    // Test 3: Password Reset Email
    console.log('\nTest 3: Password Reset Email');
    await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Password Reset Request',
      template: 'password_reset',
      data: {
        userName: 'Test User',
        resetUrl: 'https://yourapp.com/reset-password?token=abc123'
      }
    });
    console.log('✅ Password reset email sent successfully');

    // Test 4: Account Lockout Email
    console.log('\nTest 4: Account Lockout Email');
    await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Account Locked',
      template: 'account_lockout',
      data: {
        userName: 'Test User',
        reason: 'Suspicious activity detected',
        ip: '203.0.113.1',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Account lockout email sent successfully');

    console.log('\n✅ All email tests completed successfully!');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Make sure you have configured your SMTP settings:');
    console.error('- SMTP_HOST');
    console.error('- SMTP_PORT');
    console.error('- SMTP_USER');
    console.error('- SMTP_PASS');
    console.error('- EMAIL_FROM');
  }
}

// Run the test
if (require.main === module) {
  testEmailService();
}

module.exports = { testEmailService };

