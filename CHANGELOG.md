# Changelog

## [1.0.5] - 2025-01-04

### Fixed
- **CRITICAL**: Fixed `[TypeError: unusable]` error when reading request body
- **CRITICAL**: Fixed `Cannot read properties of undefined (reading 'headers')` server error
- Improved error handling for request body reading
- Added safer approach to handle request headers
- Plugin now works without trying to read request body (which was causing issues)
- Enhanced error logging and debugging

### Changed
- Simplified request data collection to avoid body reading issues
- Better error handling throughout the plugin
- More robust IP address detection

## [1.0.4] - 2025-01-04

### Fixed
- **CRITICAL**: Fixed plugin integration with Better Auth system
- Removed invalid `createAuthMiddleware` import that was causing plugin failures
- Fixed hook structure to use proper async functions instead of middleware wrappers
- Corrected API path matching to use Better Auth's actual endpoints:
  - `/api/auth/sign-in/email`
  - `/api/auth/sign-in/password`
  - `/api/auth/sign-in`
- Fixed TypeScript errors with `ctx.response` access
- Improved error handling and logging throughout the plugin
- Fixed repository URL format for npm publishing

### Changed
- Plugin now properly integrates with Better Auth's hook system
- Enhanced path matching accuracy for Better Auth endpoints
- Improved error handling and debugging capabilities

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
