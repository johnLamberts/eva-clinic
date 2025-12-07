export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // Password policy
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  passwordHistoryCount: 5,
  
  // Account lockout
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  accountLockDuration: parseInt(process.env.ACCOUNT_LOCK_DURATION_MINUTES || '30'),
  
  // Email verification
  emailVerificationExpiry: 24 * 60 * 60 * 1000, // 24 hours
  
  // Password reset
  passwordResetExpiry: 60 * 60 * 1000, // 1 hour
  
  // Magic link
  magicLinkExpiry: 15 * 60 * 1000, // 15 minutes
  
  // 2FA
  twoFactorWindow: 1, // TOTP window tolerance
  backupCodesCount: 8,
};

// src/config/app.config.ts
export const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  appName: process.env.APP_NAME || 'Dental Clinic MIS',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFilePath: process.env.LOG_FILE_PATH || './logs',
  
  // File upload (future)
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  
  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100,
};
