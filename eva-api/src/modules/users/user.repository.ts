import { Service } from "decorator/service.decorator";
import BaseRepository, { PaginationOptions } from "~/orm/base-repository.orm";
import { PaginationResult } from "~/orm/query-builder.orm";
import executeRaw from "~/utils/execute-raw.utils";
import { UserFilters } from "./user.service";
import { IUser, Permission, Role, UserStatus } from "./user.type";
// 🟢 FIX 1: Import filters from types to avoid Circular Dependency with Service

@Service()
export class UserRepository extends BaseRepository<IUser> {
  protected tableName: string = 'users';

  async findByEmail(email: string, includeDeleted = false): Promise<IUser | null> {
    return this.findOneBy({ email }, includeDeleted);
  }

  async findByEmailWithRole(email: string): Promise<(IUser & { role: Role }) | null> {
    const query = this.newQuery()
      .select(
        'users.*', 
        'roles.id as role_id', 
        'roles.name as role_name',
        'roles.display_name as role_display_name',
        // 🟢 FIX 2: Select these missing columns so mapping doesn't fail
        'roles.description as role_description',
        'roles.is_system_role as role_is_system_role'
      )
      .leftJoin('roles', 'users.role_id', '=', 'roles.id')
      .where('users.email', '=', email)
      .whereNull('users.deleted_at');

    const result: any = await query.first();
    if (!result) return null;

    // 🟢 MAPPING: Re-nest the flat SQL result into objects
    const userWithRole = {
      ...result,
      role: {
        id: result.role_id,
        name: result.role_name,
        display_name: result.role_display_name,
        description: result.role_description,        // Now defined
        is_system_role: result.role_is_system_role   // Now defined
      }
    };

    // Clean up flat keys to prevent pollution (optional)
    delete userWithRole.role_id;
    delete userWithRole.role_name;
    delete userWithRole.role_display_name;
    delete userWithRole.role_description;
    delete userWithRole.role_is_system_role;

    return userWithRole as IUser & { role: Role };
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const sql = `
      SELECT DISTINCT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = ? and u.deleted_at IS NULL
    `;
    return executeRaw<Permission>(this, sql, [userId]);
  }

  async incrementFailedLoginAttempts(userId: number): Promise<void> {
    const sql = `UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW() WHERE id = ?`;
    await executeRaw(this, sql, [userId]);
  }

  async lockAccount(userId: number, lockUntil: Date): Promise<void> {
    // 🟢 Helper: Ensure formatting matches your other methods
    const mysqlDate = lockUntil.toISOString().slice(0, 19).replace('T', ' ');
    
    await this.update(userId, {
      status: UserStatus.LOCKED,
      locked_until: mysqlDate as any // Cast if type definition expects Date
    });
  }

  async resetFailedLoginAttempts(userId: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, 
          status = CASE WHEN status = 'locked' THEN 'active' ELSE status END,
          updated_at = NOW()
      WHERE id = ?
    `;
    await executeRaw(this, sql, [userId]);
  }

  async updateLastLogin(userId: number): Promise<void> {
    const mysqlDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await this.update(userId, { last_login_at: mysqlDate });
  }

  async isEmailTaken(email: string, excludeUserId?: number): Promise<boolean> {
    const query = this.newQuery().where('email', '=', email).whereNull('deleted_at');
    if (excludeUserId) query.where('id', '!=', excludeUserId);
    return (await query.count()) > 0;
  }

  async findUsersWithFilters(filters: UserFilters, pagination: PaginationOptions): Promise<PaginationResult<IUser>> {
    const query = this.newQuery().select('*').whereNull('deleted_at');

    if (filters.status) query.where('status', '=', filters.status);
    if (filters.roleId) query.where('role_id', '=', filters.roleId);
    if (filters.emailVerified !== undefined) {
      query.where('email_verified', '=', filters.emailVerified ? 1 : 0);
    }
    if (filters.search) {
      const term = `%${filters.search}%`;
      query.whereRaw('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)', [term, term, term]);
    }

    const total = await query.count(); 

    const offset = (pagination.page - 1) * pagination.limit;
    query.limit(pagination.limit).offset(offset);
    
    const data = await query.get();

    return {
      data,
      meta: {
        total,
        per_page: pagination.limit,
        current_page: pagination.page,
        last_page: Math.ceil(total / pagination.limit)
      }
    };
  }

  async countByRole(roleId: number): Promise<number> {
    return this.newQuery()
      .where('role_id', '=', roleId)
      .whereNull('deleted_at')
      .count();
  }
}
