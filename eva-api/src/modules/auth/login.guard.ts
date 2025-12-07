import { Service } from "decorator/service.decorator";
import { AppError } from "~/utils/index";
import { UserRepository } from "../users";
import { IUser } from "../users/user.type";
import { LoginAttemptRepository } from "./login-attempt.repository";

@Service()
export class LoginGuard {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_MINS = 30;

  constructor(
    private userRepo: UserRepository,
    private attemptRepo: LoginAttemptRepository
  ) { }

  async validateLoginRequest(email: string): Promise<void> {
    const failures = await this.attemptRepo.getRecentFailedAttempts(email);

    if(failures >= this.MAX_ATTEMPTS) {
      throw new AppError('Too many faield attempts. Try again later.', 429);
    }
  }

  async validateUserStatus(user: IUser): Promise<void> {
    if(user.status === 'suspended') throw new AppError('Account suspended', 403);
    if(user.status === 'inactive') throw new AppError('Account inactive', 403);

    if(user.status === 'locked' && user.locked_until) {
      if(new Date(user.locked_until) > new Date()) {
        throw new AppError(`Account locked until ${user.locked_until}`, 423);
      }

      // Auto unlock if time passed
      await this.userRepo.resetFailedLoginAttempts(user.id!);
    }
  }

  async handleFailedAttempt(user: IUser | null, email: string, ip: string, ua: string, reason: string) {
    // Log the failure
    await this.attemptRepo.logAttempt(email, ip, ua, false, user?.id, reason);

    if (user && user.id) {
      await this.userRepo.incrementFailedLoginAttempts(user.id);
      
      // Check if we need to lock
      // Note: We fetch the FRESH count or increment locally to save a DB call
      const attempts = (user.failed_login_attempts || 0) + 1;
      
      if (attempts >= this.MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + this.LOCK_MINS * 60000);
        await this.userRepo.lockAccount(user.id, lockUntil);
        throw new AppError(`Max attempts reached. Account locked for ${this.LOCK_MINS} mins.`, 423);
      }
    }
  }

  async handleSuccess(user: IUser, ip: string, ua: string) {
    await this.userRepo.resetFailedLoginAttempts(user.id!);
    await this.userRepo.updateLastLogin(user.id!);
    await this.attemptRepo.logAttempt(user.email, ip, ua, true, user.id);
  }
}
