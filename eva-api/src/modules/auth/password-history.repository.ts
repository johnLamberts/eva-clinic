import BaseRepository from "~/orm/base-repository.orm";
import { PasswordHistory } from "../users/user.type";

export class PasswordHistoryRepository extends BaseRepository<PasswordHistory> {
  protected tableName = 'password_history';

  async getUserPasswordHistory(userId: number, limit = 5): Promise<PasswordHistory[]> {
    return this.newQuery()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .get();
  }

  async addPasswordHistory(userId: number, passwordHash: string): Promise<number> {
    const result = await this.create({ user_id: userId, password_hash: passwordHash });
    return result.id!;
  }
}
