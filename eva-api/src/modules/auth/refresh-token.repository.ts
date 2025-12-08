import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { RefreshToken } from "../users/user.type";

@Service()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  protected tableName = 'refresh_tokens';
  protected useTimestamps = false; 
  protected useSoftDeletes = false;

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    return this.newQuery()
      .where('token_hash', '=', tokenHash)
      .where('revoked', '=', 0) // Check revoked status manually
      .where('expires_at', '>', now)
      .first();
  }

  async findActiveSessions(userId: number): Promise<RefreshToken[]> {
    // 1. Safe Date Format for MySQL comparison
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    return this.newQuery()
      .where('user_id', '=', userId)
      .where('revoked', '=', 0)      // Must not be revoked
      .where('expires_at', '>', now) // Must not be expired
      .orderBy('created_at', 'DESC') // Newest first
      .get();
  }
  
  async revokeToken(tokenHash: string, replacedBy?: string): Promise<void> {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const updateData: any = {
      revoked: true,
      revoked_at: now,
    };

    if (replacedBy) {
      updateData.replaced_by_token = replacedBy;
    }

    // Direct update avoids "deleted_at" check entirely
    await this.newQuery()
      .where('token_hash', '=', tokenHash)
      .update(updateData);
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await this.newQuery()
      .where('user_id', '=', userId)
      .where('revoked', '=', 0)
      .update({ 
        revoked: true, 
        revoked_at: now 
      });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    return this.newQuery()
      .where('expires_at', '<', now)
      .delete();
  }
}

export default  {
 RefreshTokenRepository
}
