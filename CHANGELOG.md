# Changelog

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
