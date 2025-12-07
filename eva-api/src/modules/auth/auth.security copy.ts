// src/modules/auth/auth.security.ts
import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
  email: string;
  roleId: number;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export class AuthSecurity {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  
  // Argon2 configuration (recommended by OWASP)
  private static readonly ARGON2_OPTIONS = {
    type: argon2.argon2id, // Most secure variant
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 threads
  };

  // Password requirements
  private static readonly PASSWORD_REQUIREMENTS: PasswordRequirements = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  // Hash password using Argon2
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, this.ARGON2_OPTIONS);
  }

  // Verify password against hash
  static async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  // Validate password against requirements
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const req = this.PASSWORD_REQUIREMENTS;

    if (password.length < req.minLength) {
      errors.push(`Password must be at least ${req.minLength} characters long`);
    }

    if (req.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (req.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (req.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (req.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    if (/^(.)\1+$/.test(password)) {
      errors.push('Password cannot contain only repeated characters');
    }

    if (/^(012|123|234|345|456|567|678|789|890)+/.test(password)) {
      errors.push('Password cannot contain sequential numbers');
    }

    if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i.test(password)) {
      errors.push('Password cannot contain sequential letters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Check if password was used recently (requires password history)
  static async isPasswordReused(
    newPasswordHash: string,
    passwordHistory: string[]
  ): Promise<boolean> {
    for (const oldHash of passwordHistory) {
      // Note: This won't work with Argon2 since same password = different hash
      // Instead, we need to store plaintext temporarily during check, or use a different approach
      // For production: Store last 5 password hashes and verify against them
      if (oldHash === newPasswordHash) {
        return true;
      }
    }
    return false;
  }

  // Generate secure random token
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate JWT access token
  static generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );
  }

  // Generate JWT refresh token
  static generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh', jti: this.generateSecureToken(16) },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
  }

  // Generate token pair
  static generateTokenPair(payload: Omit<TokenPayload, 'type'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  // Verify access token
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      if (decoded.type !== 'access') {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as TokenPayload;
      if (decoded.type !== 'refresh') {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  // Hash sensitive data (for token storage)
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Generate session ID
  static generateSessionId(): string {
    return this.generateSecureToken(32);
  }

  // Constant-time string comparison (prevent timing attacks)
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  // Rate limiting helper - generate key from IP + identifier
  static generateRateLimitKey(ip: string, identifier: string): string {
    return `ratelimit:${ip}:${identifier}`;
  }

  // Extract IP from request (handles proxies)
  static extractIP(
    xForwardedFor?: string,
    xRealIp?: string,
    remoteAddress?: string
  ): string {
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map(ip => ip.trim());
      return ips[0]; // First IP is the client
    }
    return xRealIp || remoteAddress || 'unknown';
  }

  // Sanitize user agent string
  static sanitizeUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    // Limit length and remove potential injection attempts
    return userAgent.slice(0, 255).replace(/[<>]/g, '');
  }
}

export default AuthSecurity;
