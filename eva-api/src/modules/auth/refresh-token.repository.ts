import BaseRepository from "~/orm/base-repository.orm";
import { RefreshToken } from "../users/user.type";

export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  protected tableName = 'refresh_tokens';
  protected useTimestamps: boolean = false; 

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.newQuery()
      .where('token_hash', '=', tokenHash)
      .where('revoked', '=',0)
      .where('expires_at', '>', new Date().toISOString())
      .first();
  }

  async revokeToken(tokenHash: string, replacedBy?: string): Promise<void> {
    const token = await this.findOneBy({ token_hash: tokenHash });
    if (token && token.id) {
      await this.update(token.id, {
        revoked: true,
        revoked_at: new Date().toISOString(),
        replaced_by_token: replacedBy,
      });
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    // SIMPLE: Use update query with where clause instead of loop
    await this.newQuery()
      .where('user_id', '=', userId)
      .where('revoked', '=', 0)
      .update({ revoked: true, revoked_at: new Date().toISOString() });
  }

  async cleanupExpiredTokens(): Promise<number> {
    return this.newQuery()
      .where('expires_at', '<', new Date().toISOString())
      .delete();
  }
}

export default  {
 RefreshTokenRepository
}
