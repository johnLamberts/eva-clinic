import BaseRepository from "~/orm/base-repository.orm";
import { LoginAttempt } from "../users/user.type";

export class LoginAttemptRepository extends BaseRepository<LoginAttempt> {
  protected tableName = 'login_attempts';

  protected useTimestamps = false;
  
  async logAttempt(email: string, ip: string, ua: string, success: boolean, userId?: number, reason?: string) {
    await this.create({
      email,
      ip_address: ip,
      user_agent: ua,
      success,
      user_id: userId, // Safe to pass undefined now
      failure_reason: reason
    });
  }

  async getRecentFailedAttempts(email: string, minutesAgo = 15): Promise<number> {
    const since = new Date(Date.now() - minutesAgo * 60000).toISOString();
    return this.newQuery()
      .where('email', '=', email)
      .where('success', '=', 0)
      .where('created_at', '>', since)
      .count();
  }
}

export default {
  LoginAttemptRepository
}
