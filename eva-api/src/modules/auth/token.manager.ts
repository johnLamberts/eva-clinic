import { Service } from "decorator/service.decorator";
import { AppError } from "~/utils/app-error.utils";
import { IUser } from "../users/user.type";
import AuthSecurity from "./auth.security copy";
import { RefreshTokenRepository } from "./refresh-token.repository";

@Service()
export class TokenManager {
  protected useTimestamps = false;

  constructor(private tokenRepo: RefreshTokenRepository) {}

  async createSession(user: IUser, ip: string, ua: string) {
    // 1. Generate Pair
    const pair = AuthSecurity.generateTokenPair({
      userId: user.id!,
      email: user.email,
      roleId: user.role_id,
    });

    // 2. Calculate Expiry (7 days)
    const expiryDate = new Date(Date.now() + 7 * 86400000);

    // 3. Persist
    await this.tokenRepo.create({
      user_id: user.id,
      token_hash: AuthSecurity.hashToken(pair.refreshToken),
      
      expires_at: expiryDate.toISOString().slice(0, 19).replace('T', ' '),
      
      ip_address: ip,
      device_info: ua,
    });

    return pair;
  }

  async rotateSession(refreshToken: string) {
    const payload = AuthSecurity.verifyRefreshToken(refreshToken);
    if (!payload) throw new AppError('Invalid Token', 401);

    const hash = AuthSecurity.hashToken(refreshToken);
    const stored = await this.tokenRepo.findByTokenHash(hash);

    if (!stored) throw new AppError('Token not found or revoked', 401);

    // Reuse Detection could go here (if stored.revoked check family...)

    // Revoke old
    await this.tokenRepo.revokeToken(hash);

    // Issue new (We need to fetch the user in the main service to pass here, 
    // or we reconstruct minimal user object if we trust the token payload)
    return { userId: payload.userId, email: payload.email, oldSession: stored };
  }

  async revokeSession(token: string) {
    const hash = AuthSecurity.hashToken(token);
    await this.tokenRepo.revokeToken(hash);
  }

  async revokeAllUserSessions(userId: number) {
    // Simple delegation to the repository
    await this.tokenRepo.revokeAllUserTokens(userId);
  }

  async revokeToken(rawRefreshToken: string): Promise<void> {
    // DRY: Always hash tokens before touching the DB
    const hash = AuthSecurity.hashToken(rawRefreshToken);
    await this.tokenRepo.revokeToken(hash);
  }
}
