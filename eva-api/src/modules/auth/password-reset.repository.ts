import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: boolean;
  used_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

@Service()
export class PasswordResetTokenRepository extends BaseRepository<PasswordResetToken> {
  protected tableName = 'password_reset_tokens';

  async createToken(data: Partial<PasswordResetToken>): Promise<void> {
    await this.create(data);
  }

  async invalidateUserTokens(userId: number): Promise<void> {
    await this.newQuery()
      .where('user_id', '=', userId)
      .where('used', '=', false)
      .update({ used: true });
  }

  async findValidToken(token: string): Promise<PasswordResetToken | null> {
    // Raw SQL is sometimes cleaner for complex date logic like "NOW()"
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE token = ?
      AND used = FALSE
      AND expires_at > NOW()
      LIMIT 1
    `;
    const results = await this.connection?.execute(sql, [token]);
    return (results?.[0] as any[])[0] || null;
  }

  async markAsUsed(token: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET used = TRUE, used_at = NOW()
      WHERE token = ?
    `;
    await this.connection?.execute(sql, [token]);
  }

  async cleanupExpired(): Promise<number> {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE expires_at < NOW()
      OR (used = TRUE AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
    `;
    const [result] = await this.connection!.execute(sql);
    return (result as any).affectedRows;
  }
}
