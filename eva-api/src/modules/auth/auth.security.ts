import argon2 from 'argon2';
import crypto from 'crypto';
import { Request } from 'express';
import jwt, { Secret, SignOptions } from "jsonwebtoken";

export interface ITokenPayload {
  userId: number;
  email: string;
  roleId: number;
  type: 'access' | 'refresh';
  [key: string]: any;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IPasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export class AuthSecurity {
  
  private static readonly EXPIRY = {
    ACCESS: '15m',
    REFRESH: '7d',
    ACCESS_SECONDS: 900,
  };

  private static get SECRETS() {
    return  {
      JWT: process.env.JWT_SECRET || 'dev-secret',
      REFRESH: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'
    } 
  }

  static async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    })
  }

  static async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain)
    } catch {
      return false;
    }
  }

  /**
   * We cannot verify cocompare hashes directly with Argon2 (salts differ)
   * Must verify the new plain password against the OLD hashes
   */
  static async IsPasswordReused(newPlainPassword: string, historyHashes: string[]): Promise<boolean> {
    for (const oldHash of historyHashes) {
      if(await this.verifyPassword(oldHash, newPlainPassword)) {
        return true;
      }
    }
    return false;
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) errors.push('Min length 12 characters');
    if (!/[A-Z]/.test(password)) errors.push('Missing uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Missing lowercase letter');
    if (!/\d/.test(password)) errors.push('Missing number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Missing special character');
    if (/^(.)\1+$/.test(password)) errors.push('Too simple (repeated characters)');

    return { valid: errors.length === 0, errors };
  }

  // --- TOKEN MANAGEMENT
  static generateTokenPair(payload: Omit<ITokenPayload, 'type'>): ITokenPair {
    return {
      accessToken: this.sign(payload, 'access', this.EXPIRY.ACCESS),
      refreshToken: this.sign(payload, 'refresh', this.EXPIRY.REFRESH),
      expiresIn: this.EXPIRY.ACCESS_SECONDS,
    }
  }

  static verifyAccessToken(token: string): ITokenPayload | null {
    return this.verify(token, 'access');
  }

  static verifyRefreshToken(token: string): ITokenPayload | null {
    return this.verify(token, 'refresh');
  }

  // Generic signer ultils helper
  private static sign(payload: Omit<ITokenPayload, "type">, type: 'access' | 'refresh', expiresIn: string): string {
    const secret: Secret = type === 'access' ? this.SECRETS.JWT : this.SECRETS.REFRESH;
    const data = { ...payload, type };

    // Add JTI (Unique Id) to refresh tokens for rotation tracking support
    if (type === 'refresh') {
      (data as any).jti = this.generateRandomString(16)
    }

    const options: SignOptions = { expiresIn: expiresIn as any }
    return jwt.sign(data, secret, options)
  }


  // Generic verifier
  private static verify(token: string, type: 'access' | 'refresh'): ITokenPayload | null {
    try {
      const secret = type === 'access' ? this.SECRETS.JWT : this.SECRETS.REFRESH;
      
      console.log(`[AuthSecurity] Verifying ${type} token. Secret prefix: ${secret.substring(0, 4)}...`);
      
      const decoded = jwt.verify(token, secret) as ITokenPayload;
      
      console.log(decoded, secret);
      if (decoded.type !== type) {
        console.error(`[AuthSecurity] Type Mismatch. Expected ${type}, got ${decoded.type}`);
        return null
      }
      return decoded;
    } catch (error: any){
      console.error(`[AuthSecurity] Verification failed: ${error.message}`)
      return null;
    }
  }


  static generateRandomString(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
 /**
  * Safe comparison to prevent timing attacks
  */
  static safeCompare(a: string, b: string): boolean {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  static sanitizeUserAgent(ua?: string): string {
    if (!ua) return 'unknown';
    // Truncate to 255 chars (or whatever your DB column size is) to prevent SQL errors
    return ua.substring(0, 255);
  }

  static extractIP(req: Request | any): string {
    // 1. Try X-Forwarded-For
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    }
    
    // 2. Try X-Real-IP
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return typeof realIp === 'string' ? realIp : realIp[0];
    }

    // 3. Fallback to socket
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
