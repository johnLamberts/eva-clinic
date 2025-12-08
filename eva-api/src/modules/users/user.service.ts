import { Service } from "decorator/service.decorator";
import { PaginationOptions } from "~/orm/base-repository.orm";
import { PaginationResult } from "~/orm/query-builder.orm";
import { Transaction } from "~/orm/transaction.orm";
import { AppError } from "~/utils/app-error.utils";
import AuditService from "../audit/audit.service";
import { PasswordHistoryRepository, RefreshTokenRepository, RoleRepository } from "../auth";
import { AuthSecurity } from "../auth/auth.security";
import { UserRepository } from "./user.repository";
import { CreateUserDto, RequestContext, UpdateUserDto, UserResponse, UserStatus } from "./user.type";


export interface UserFilters {
  status?: UserStatus;
  roleId?: number;
  search?: string;
  emailVerified?: boolean;
}

export interface BulkUserOperation {
  userIds: number[];
  action: 'activate' | 'deactivate' | 'suspend' | 'delete';
}

@Service()
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private roleRepo: RoleRepository,
    private passwordHistoryRepo: PasswordHistoryRepository,
    private refreshTokenRepo: RefreshTokenRepository,
    private auditService: AuditService
  ) {}

  // ---------------------------------------------------------
  // 🟢 CREATE
  // ---------------------------------------------------------
  async createUser(dto: CreateUserDto, ctx: RequestContext): Promise<UserResponse> {
    this.checkPermission(ctx, 'users.create');

    return Transaction.transaction(async () => {
      // 1. Validations
      if (await this.userRepo.isEmailTaken(dto.email)) throw new AppError('Email already in use', 409);
      await this.validateRole(dto.role_id, ctx, false); // false = is not update
      
      const passValidation = AuthSecurity.validatePassword(dto.password);
      if (!passValidation.valid) throw new AppError(`Password weak: ${passValidation.errors.join(', ')}`, 400);

      // 2. Prepare Data
      const passwordHash = await AuthSecurity.hashPassword(dto.password);
      
      // 3. Create User
      const newUser = await this.userRepo.create({
        ...dto,
        password_hash: passwordHash,
        status: UserStatus.ACTIVE,
        password_changed_at: this.getMySQLDate(), // ✅ FIX: Prevents SQL Error
        created_by: ctx.userId,
      });

      // 4. Post-Create Actions
      await this.passwordHistoryRepo.addPasswordHistory(newUser.id!, passwordHash);
      
      // 5. Fetch Complete User & Log
      const fullUser = await this.getFullUserOrThrow(newUser.id!);
      
      await this.logAudit(ctx, 'create', newUser.id!, {
        email: fullUser.email,
        name: `${fullUser.first_name} ${fullUser.last_name}`,
        role_id: fullUser.role_id
      });

      return this.mapToUserResponse(fullUser);
    });
  }

  // ---------------------------------------------------------
  // 🟡 UPDATE
  // ---------------------------------------------------------
  async updateUser(userId: number, dto: UpdateUserDto, ctx: RequestContext): Promise<UserResponse> {
    // 1. Permission Check
    const isOwnProfile = ctx.userId === userId;
    if (!isOwnProfile) this.checkPermission(ctx, 'users.update');

    return Transaction.transaction(async () => {
      const currentUser = await this.userRepo.findById(userId);
      if (!currentUser) throw new AppError('User not found', 404);

      // 2. Validate Changes
      if (dto.role_id && dto.role_id !== currentUser.role_id) {
        this.checkPermission(ctx, 'users.manage_roles');
        await this.validateRole(dto.role_id, ctx, true);
      }

      if (dto.status && dto.status !== currentUser.status) {
        this.checkPermission(ctx, 'users.update');
        if (isOwnProfile && ['inactive', 'suspended'].includes(dto.status)) {
          throw new AppError('Cannot deactivate your own account', 400);
        }
      }

      // 3. Execute Update
      await this.userRepo.update(userId, dto, ctx.userId);

      // 4. Log & Return
      const updatedUser = await this.getFullUserOrThrow(userId);
      
      await this.logAudit(ctx, 'update', userId, dto, {
        role_id: currentUser.role_id,
        status: currentUser.status
      });

      return this.mapToUserResponse(updatedUser);
    });
  }

  // ---------------------------------------------------------
  // 🔴 DELETE
  // ---------------------------------------------------------
  async deleteUser(userId: number, ctx: RequestContext): Promise<void> {
    this.checkPermission(ctx, 'users.delete');
    if (ctx.userId === userId) throw new AppError('Cannot delete your own account', 400);

    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    await Transaction.transaction(async () => {
      await this.userRepo.softDelete(userId, ctx.userId);
      await this.refreshTokenRepo.revokeAllUserTokens(userId);
      
      await this.logAudit(ctx, 'delete', userId, null, { email: user.email });
    });
  }

  // ---------------------------------------------------------
  // 🔵 READ / LIST
  // ---------------------------------------------------------
  async getUserById(userId: number, ctx: RequestContext): Promise<UserResponse> {
    const isOwnProfile = ctx.userId === userId;
    if (!isOwnProfile) this.checkPermission(ctx, 'users.read');

    const user = await this.getFullUserOrThrow(userId);
    return this.mapToUserResponse(user);
  }

  async listUsers(filters: UserFilters, pagination: PaginationOptions, ctx: RequestContext): Promise<PaginationResult<UserResponse>> {
    this.checkPermission(ctx, 'users.read');

    // 🟢 OPTIMIZED: Delegated filtering to Repository (Code provided below)
    const result = await this.userRepo.findUsersWithFilters(filters, pagination);

    // Map results
    const mappedData = await Promise.all(result.data.map(async (u: any) => {
      // Small N+1 query here for permissions, acceptable for small pages (limit 10-20)
      // Ideally, join permissions in the main query if performance demands it
      const permissions = await this.userRepo.getUserPermissions(u.id!);
      return this.mapToUserResponse({ ...u, permissions } as any);
    }));

    return { ...result, data: mappedData };
  }

  async generateUserCsv(ctx: RequestContext): Promise<string> {
    this.checkPermission(ctx, 'users.read');

    // Get all users (Limit 10k for safety)
    const result = await this.listUsers({}, { page: 1, limit: 10000 }, ctx);

    const header = 'ID,Email,First Name,Last Name,Phone,Role,Status,Verified,Created At\n';
    const rows = result.data.map(u => 
      `${u.id},${u.email},"${u.first_name}","${u.last_name}",${u.phone || ''},${u.role.name},${u.status},${u.email_verified},${u.created_at}`
    ).join('\n');

    return header + rows;
  }

  async getUserActivity(userId: number, ctx: RequestContext) {
    const isOwnProfile = ctx.userId === userId;
    if (!isOwnProfile) this.checkPermission(ctx, 'users.read');

    // Proxy to audit service
    return this.auditService.getUserActivity(userId, 50);
  }

  // ---------------------------------------------------------
  // 🔑 SESSION MANAGEMENT
  // ---------------------------------------------------------

  async getUserSessions(userId: number, ctx: RequestContext) {
    const isOwnProfile = ctx.userId === userId;
    if (!isOwnProfile) this.checkPermission(ctx, 'users.read');

    // 🟢 MOVED DB LOGIC HERE
    const now = this.getMySQLDate();
    
    // Note: Add 'findActiveSessions' to RefreshTokenRepository to keep this clean
    // OR use newQuery() here if Repository exposes it
    const sessions = await this.refreshTokenRepo.findActiveSessions(userId);

    return sessions.map(s => ({
      id: s.id,
      device_info: s.device_info,
      ip_address: s.ip_address,
      created_at: s.created_at,
      expires_at: s.expires_at
    }));
  }

  async revokeUserSession(userId: number, sessionId: number, ctx: RequestContext) {
    const isOwnProfile = ctx.userId === userId;
    if (!isOwnProfile) this.checkPermission(ctx, 'users.update');

    const session = await this.refreshTokenRepo.findById(sessionId);
    
    if (!session || session.user_id !== userId) {
      throw new AppError('Session not found', 404);
    }

    // Direct update via ID
    await this.refreshTokenRepo.update(sessionId, {
      revoked: true,
      revoked_at: this.getMySQLDate() // ✅ Safe Date format
    } as any);
  }

  async getUserStatistics(ctx: RequestContext) {
    this.checkPermission(ctx, 'users.read');

    // 1. Fetch all users (Optimized: In a real app, use count() queries instead of fetching all)
    const allUsers = await this.userRepo.findAll(false);
    
    // 2. Fetch all roles for mapping
    const roles = await this.roleRepo.findAll();

    // 3. Calculate Stats
    const stats = {
      total: allUsers.length,
      active: 0,
      inactive: 0,
      suspended: 0,
      locked: 0,
      byRole: {} as Record<string, number>,
    };

    // Initialize roles count
    roles.forEach(r => stats.byRole[r.name] = 0);

    for (const user of allUsers) {
      // Status Count
      if (user.status === UserStatus.ACTIVE) stats.active++;
      else if (user.status === UserStatus.INACTIVE) stats.inactive++;
      else if (user.status === UserStatus.SUSPENDED) stats.suspended++;
      else if (user.status === UserStatus.LOCKED) stats.locked++;

      // Role Count
      const roleName = roles.find(r => r.id === user.role_id)?.name;
      if (roleName && stats.byRole[roleName] !== undefined) {
        stats.byRole[roleName]++;
      }
    }

    return stats;
  }
  

  // ---------------------------------------------------------
  // ⚡ BULK OPERATIONS
  // ---------------------------------------------------------
  async bulkOperation(op: BulkUserOperation, ctx: RequestContext) {
    this.checkPermission(ctx, 'users.update');
    
    let success = 0, failed = 0;
    const errors: any[] = [];

    for (const userId of op.userIds) {
      if (userId === ctx.userId) {
        errors.push({ userId, error: 'Skipped own account' });
        failed++;
        continue;
      }

      try {
        if (op.action === 'delete') {
          await this.deleteUser(userId, ctx);
        } else {
          // Map action string to UserStatus enum safely
          const statusMap: Record<string, UserStatus> = {
            'activate': UserStatus.ACTIVE,
            'deactivate': UserStatus.INACTIVE,
            'suspend': UserStatus.SUSPENDED
          };
          if (statusMap[op.action]) {
            await this.userRepo.update(userId, { status: statusMap[op.action] }, ctx.userId);
            // Log for bulk action (simplified)
             await this.logAudit(ctx, op.action, userId, { bulk: true });
          }
        }
        success++;
      } catch (err: any) {
        errors.push({ userId, error: err.message });
        failed++;
      }
    }
    return { success, failed, errors };
  }

  // ---------------------------------------------------------
  // 🔐 PASSWORD RESET (Admin)
  // ---------------------------------------------------------
  async resetUserPassword(userId: number, newPass: string, ctx: RequestContext): Promise<void> {
    this.checkPermission(ctx, 'users.update');
    
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const validation = AuthSecurity.validatePassword(newPass);
    if (!validation.valid) throw new AppError(`Password weak: ${validation.errors.join(', ')}`, 400);

    const hash = await AuthSecurity.hashPassword(newPass);

    await Transaction.transaction(async () => {
      await this.userRepo.update(userId, {
        password_hash: hash,
        password_changed_at: this.getMySQLDate(), // ✅ FIX
        must_change_password: true,
      } as any, ctx.userId);

      await this.passwordHistoryRepo.addPasswordHistory(userId, hash);
      await this.refreshTokenRepo.revokeAllUserTokens(userId);
      
      await this.logAudit(ctx, 'password_reset', userId, { admin_reset: true });
    });
  }

  // =========================================================
  // 🛠️ PRIVATE HELPERS (The "Clean" Part)
  // =========================================================

  private checkPermission(ctx: RequestContext, permission: string) {
    if (!ctx.permissions.includes(permission)) {
      throw new AppError(`Permission denied: ${permission}`, 403);
    }
  }

  private async validateRole(roleId: number, ctx: RequestContext, isUpdate: boolean) {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new AppError('Invalid Role ID', 400);
    
    if (role.is_system_role && !ctx.permissions.includes('users.manage_roles')) {
      throw new AppError('Insufficient permissions to assign System Roles', 403);
    }
    return role;
  }

  private async getFullUserOrThrow(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    
    // We fetch with role to ensure response is complete
    const fullUser = await this.userRepo.findByEmailWithRole(user.email);
    if (!fullUser) throw new AppError('User details incomplete', 500);
    
    return fullUser;
  }

  private async logAudit(ctx: RequestContext, action: string, entityId: number, newValues?: any, oldValues?: any) {
    // Fire and forget (don't await if you want speed, await if you want safety)
    await this.auditService.log({
      user_id: ctx.userId,
      action,
      entity_type: 'users',
      entity_id: entityId,
      new_values: newValues,
      old_values: oldValues,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent
    });
  }

  // ✅ HELPER: Fixes "Incorrect datetime value"
  private getMySQLDate(): string {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  private mapToUserResponse(user: any, permissions: string[] = []): UserResponse {
    // If permissions passed in arg use them, else check if they exist on user object
    const finalPerms = permissions.length > 0 ? permissions : (user.permissions?.map((p: any) => p.name) || []);

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: user.status,
      role: {
        id: user.role_id || user.role?.id,
        name: user.role_name || user.role?.name,
        display_name: user.role_display_name || user.role?.display_name,
      },
      permissions: finalPerms,
      email_verified: !!user.email_verified,
      two_factor_enabled: !!user.two_factor_enabled,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
    };
  }
}
