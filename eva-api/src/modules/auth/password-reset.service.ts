import { Service } from "decorator/service.decorator";
import { AppError } from '../../utils/app-error.utils'; // Updated to match your utils path
import { UserRepository } from "../users";
import { AuthSecurity } from "./auth.security";
import { PasswordHistoryRepository } from "./password-history.repository";
import { PasswordResetTokenRepository } from "./password-reset.repository";
import { RefreshTokenRepository } from "./refresh-token.repository";

@Service()
export class PasswordResetService {
  // 🟢 Inject all dependencies here
  constructor(
    private userRepo: UserRepository,
    private tokenRepo: PasswordResetTokenRepository,
    private passwordHistoryRepo: PasswordHistoryRepository,
    private refreshTokenRepo: RefreshTokenRepository
  ) {}

  async requestPasswordReset(
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const user = await this.userRepo.findByEmail(email);
    
    // 🛡️ Security: Return dummy token to prevent email enumeration
    if (!user) {
      console.log(`[Security] Password reset requested for non-existent email: ${email}`);
      return 'dummy-token-prevention';
    }

    // 1. Invalidate old tokens
    await this.tokenRepo.invalidateUserTokens(user.id!);

    // 2. Generate new token
    const token = AuthSecurity.generateRandomString(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 3. Save to DB
    await this.tokenRepo.createToken({
      user_id: user.id!,
      token: token,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      used: false
    });

    // TODO: Send actual email
    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
    
    console.log(`\n🔑 [DEBUG] Password Reset Link for ${user.email}:`);
    console.log(`   ${resetLink}`);
    console.log(`   (Valid for 1 hour)\n`);

    return token;
  }

  async validateResetToken(token: string): Promise<number> {
    const resetToken = await this.tokenRepo.findValidToken(token);

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    return resetToken.user_id;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 1. Validate Token
    const userId = await this.validateResetToken(token);

    // 2. Validate Password Strength
    const validation = AuthSecurity.validatePassword(newPassword);
    if (!validation.valid) {
      throw new AppError('Password requirements not met: ' + validation.errors.join(', '), 400);
    }

    // 3. Check Password History (Reuse Prevention)
    // 
    const history = await this.passwordHistoryRepo.getUserPasswordHistory(userId, 5);
    
    for (const entry of history) {
      const isReused = await AuthSecurity.verifyPassword(entry.password_hash, newPassword);
      if (isReused) {
        throw new AppError('Password has been used recently. Please choose a different password.', 400);
      }
    }

    // 4. Hash & Update
    const newPasswordHash = await AuthSecurity.hashPassword(newPassword);

    await this.userRepo.update(userId, {
      password_hash: newPasswordHash,
      password_changed_at: new Date().toISOString(),
      must_change_password: false,
    } as any);

    // 5. Update History & Token
    await this.passwordHistoryRepo.addPasswordHistory(userId, newPasswordHash);
    await this.tokenRepo.markAsUsed(token);

    // 6. 🛡️ Security: Force logout on all devices
    await this.refreshTokenRepo.revokeAllUserTokens(userId);
  }

  async cleanupExpiredTokens(): Promise<number> {
    return this.tokenRepo.cleanupExpired();
  }
}

export default PasswordResetService;
