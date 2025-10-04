# Changelog

## [1.1.0] - 2025-01-04

### Added
- **NEW**: Email notifications for security actions
- **NEW**: Two-Factor Authentication (2FA) enforcement
- **NEW**: Password reset enforcement
- **NEW**: Developer API for triggering security actions
- **NEW**: Security action tracking and management
- **NEW**: Custom email templates for different security scenarios
- **NEW**: Client-side methods for security actions
- **NEW**: Comprehensive security action examples

### Features
- Automatic 2FA enforcement when suspicious activity is detected
- Automatic password reset enforcement for compromised accounts
- Customizable email templates for security notifications
- Developer endpoints for manual security action triggers
- Enhanced monitoring statistics including security actions
- Integration with Better Auth's built-in 2FA and password reset

### API Endpoints
- `POST /api/auth/monitor/trigger-action` - Trigger security actions
- `GET /api/auth/monitor/user-actions` - Get user security actions
- `GET /api/auth/monitor/stats` - Get monitoring statistics

### Client Methods
- `enable2FA(userId, reason, ip?)` - Enable 2FA for user
- `resetPassword(userId, reason, ip?)` - Reset user password
- `sendSecurityAlert(userId, reason, ip?)` - Send security alert
- `getUserSecurityActions(userId)` - Get user's security actions

## [1.0.3] - 2025-01-04

### Added
- Enhanced debug logging for troubleshooting
- Detailed console output to verify plugin hooks are working
- Better error tracking and monitoring

### Fixed
- Improved endpoint path matching for Better Auth v1.x
- Enhanced failed login detection with detailed logging

## [1.0.2] - 2025-01-04

### Fixed
- Fixed Better Auth version compatibility for v1.x
- Changed peer dependency from `^0.8.0` to `>=0.8.0`
- Now supports Better Auth v0.8.0 through v1.x+

## [1.0.1] - 2025-01-04

### Fixed
- Fixed Better Auth version compatibility issues
- Changed from `dependencies` to `peerDependencies` for Better Auth
- Fixed parameter naming in `onRequest` hook (`context` → `ctx`)

### Changed
- Better Auth is now a peer dependency instead of a direct dependency
- This ensures compatibility with different Better Auth versions

## [1.0.0] - 2025-01-04

### Added
- Initial release of Better Auth Monitor
- Failed login detection with configurable thresholds
- Real-time security event logging
- Bot detection capabilities (placeholder)
- Unusual location detection (placeholder)
- TypeScript support with full type definitions
- Comprehensive documentation and examples
