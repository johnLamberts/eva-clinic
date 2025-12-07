import { Service } from "decorator/service.decorator";
import { Transaction } from "~/orm/transaction.orm";
import { AppError } from "~/utils/index";
import { UserRepository } from "../users";
import { AuthResponse, ChangePasswordDto, CreateUserDto, IUser, LoginDto, Permission, Role, UserResponse, UserStatus } from "../users/user.type";
import { AuthSecurity } from "./auth.security";
import { LoginGuard } from "./login.guard";
import { PasswordHistoryRepository } from "./password-history.repository";
import { RoleRepository } from "./role.repository";
import { TokenManager } from "./token.manager";

@Service()
export class AuthService {

  
  constructor(
    private userRepo: UserRepository,
    private roleRepo: RoleRepository,
    private passwordHistoryRepo: PasswordHistoryRepository,
    private guard: LoginGuard,
    private tokenManager: TokenManager
  ) { }



  async login(dto: LoginDto, ip: string, ua: string): Promise<AuthResponse> {
    // 1. Guard checks
    await this.guard.validateLoginRequest(dto.email);

    // 2. Find user
    const user = await this.userRepo.findByEmailWithRole(dto.email);
    if(!user) {
      // Fake delay / work could be added here
      await this.guard.handleFailedAttempt(null, dto.email, ip, ua, 'User not found');
      throw new AppError('Invalid credentials', 401);
    }

    // 3. Status checks
    await this.guard.validateUserStatus(user);

    // 4. verify password
    const isValid = await AuthSecurity.verifyPassword(user.password_hash, dto.password);
    if(!isValid) {
      await this.guard.handleFailedAttempt(user, dto.email, ip, ua, 'Bad password');
      throw new AppError('Invalid credentials', 401);
    }

    // 5. Success flow
    await this.guard.handleSuccess(user, ip, ua);

    // 6. Issue Token
    const token = await this.tokenManager.createSession(user, ua, ip);

    return { user: this.mapUser(user) as any, ...token }
  }

// src/modules/auth/auth.service.ts

async register(dto: CreateUserDto): Promise<AuthResponse> {
  return Transaction.transaction(async () => {
    // 1. Validations
    if (await this.userRepo.isEmailTaken(dto.email)) throw new AppError('Email taken', 409);
    
    // Check if Role Exists (Optional safety check)
    const role = await this.roleRepo.findById(dto.role_id);
    if (!role) throw new AppError('Invalid Role ID', 400);

    // ... Hash password ...
    const hash = await AuthSecurity.hashPassword(dto.password);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = dto;

    const roleExists = await this.roleRepo.findById(dto.role_id);
    if (!roleExists) {
      throw new AppError(`Role with ID ${dto.role_id} not found`, 400);
    }

    // 2. Create User
    const createdUser = await this.userRepo.create({
      ...userData,
      password_hash: hash,
      status: UserStatus.ACTIVE,
      password_changed_at: new Date() // Fix from previous step
    });

    // 3. History
    await this.passwordHistoryRepo.addPasswordHistory(createdUser.id!, hash);
    
    // 4. Fetch the Complete User (With Role Join)
    // We use findByIdWithRole (create this if missing) or rely on findByEmail
    const fullUser: IUser & { role: Role } = {
      ...createdUser,
      id: createdUser.id!, // Ensure ID is present
      role: role // We fetched this in Step 2
    };

    // 🚨 DEBUGGING: If this throws "User not found" here, it confirms the JOIN issue
    console.log(fullUser);

    if (!fullUser) {
      throw new AppError('User created but failed to retrieve details. Check Role ID.', 500);
    }


    // 5. Auto-Login
    const tokens = await this.tokenManager.createSession(fullUser, 'system', 'register');

    return { user: this.mapUser(fullUser), ...tokens };
  });
}

  async refreshToken(token: string): Promise<AuthResponse> {
    // 1. Rotate Logic
    const { userId, oldSession } = await this.tokenManager.rotateSession(token);
    
    // 2. Re-fetch user to ensure they aren't banned in the meantime
    const user = await this.userRepo.findByEmailWithRole(oldSession.email || ''); // Assuming email stored or fetch by ID
    // Better: fetch by ID from payload
    // const user = await this.userRepo.findById(userId);

    if (!user || user.status !== 'active') throw new AppError('Session invalid', 401);

    // 3. Issue New
    const tokens = await this.tokenManager.createSession(user, oldSession.ip_address, oldSession.device_info as string);
    
    return { user: this.mapUser(user), ...tokens };
  }

  /**
   * Logout (Single Device)
   * Just invalidates the specific refresh token provided.
   */
  async logout(refreshToken: string): Promise<void> {
    // Delegate to manager to handle hashing and DB update
    await this.tokenManager.revokeToken(refreshToken);
  }

  /**
   * Logout All (Security)
   * Used when password changes or user suspects hacking.
   */
  async logoutAll(userId: number): Promise<void> {
    await this.tokenManager.revokeAllUserSessions(userId);
  }


  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const { current_password, new_password, confirm_password } = dto;

    // 1. Basic validation
    if(new_password !== confirm_password) {
      throw new AppError('New password and and confirmation password do not match', 400);
    }

    // 2. Fetch user
    const user = await this.userRepo.findById(userId);

    if (!user) throw new AppError('User not found', 404);

    // 3. Verify Current Password
    const isCurrentValid = await AuthSecurity.verifyPassword(user.password_hash, current_password);
    if (!isCurrentValid) throw new AppError('Current password is incorrect', 401);

    // 4. Validate New Password Strength
    const validation = AuthSecurity.validatePassword(new_password);
    if (!validation.valid) {
      throw new AppError(`Weak password: ${validation.errors.join(', ')}`, 400);
    }

    // 5. Check Password History (Reuse Policy)
    const history = await this.passwordHistoryRepo.getUserPasswordHistory(userId, 5);
    const historyHashes = history.map(h => h.password_hash);
    
    // Use the helper we fixed in AuthSecurity
    const isReused = await AuthSecurity.IsPasswordReused(new_password, historyHashes);
    if (isReused) {
      throw new AppError('Password cannot be one of your last 5 passwords', 400);
    }

    // 6. Execute Update (Atomic Transaction)
    await Transaction.transaction(async () => {
      const newHash = await AuthSecurity.hashPassword(new_password);

      // A. Update User
      await this.userRepo.update(userId, {
        password_hash: newHash,
        password_changed_at: new Date().toISOString(),
        must_change_password: false, // Clear flag if it was set
      } as any);

      // B. Add to History
      await this.passwordHistoryRepo.addPasswordHistory(userId, newHash);

      // C. Revoke All Sessions (Force Re-login for security)
      // await this.tokenManager.revokeAllUserSessions(userId);
    });
  }

  /**
   * Get Current User Profile
   */
  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Re-fetch with Role details joined
    const fullUser = await this.userRepo.findByEmailWithRole(user.email);
    
    if (!fullUser) throw new AppError('User details unavailable', 404);

    return this.mapUser(fullUser);
  }

  // --- Private Helper (DRY) ---
  // Ensure this handles the mapping for both Login and GetCurrentUser

  private mapUser(user: IUser & { role: Role; permissions?: Permission[] }): UserResponse {
   return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: user.status,
      email_verified: user.email_verified,
      two_factor_enabled: user.two_factor_enabled,
      last_login_at: user.last_login_at,
      created_at: user.created_at,

      role: {
        id: user.role.id,
        name: user.role.name,
        display_name: user.role.display_name
      },

      permissions: user.permissions
        ? user.permissions.map((p) => p.name)
        : []
    };
  }

  

 
}
