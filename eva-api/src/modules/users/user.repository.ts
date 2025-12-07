import BaseRepository from "~/orm/base-repository.orm";
import executeRaw from "~/utils/execute-raw.utils";
import { IUser, Permission, Role, UserStatus } from "./user.type";


export class UserRepository extends BaseRepository<IUser> {
  protected tableName: string = 'users';

  async findByEmail(email: string, includeDeleted = false): Promise<IUser | null> {
    return this.findOneBy({ email }, includeDeleted);
  }

  async findByEmailWithRole(email: string): Promise<(IUser & { role: Role }) | null> {
    const query = this.
      newQuery()
      .select('users.*', 'roles.id as role_id', 'roles.name as role_name',
              'roles.display_name as role_display_name')
      .leftJoin('roles', 'users.role_id', '=', 'roles.id')
      .where('users.email', '=', email)
      .whereNull('users.deleted_at');

    const result = await query.first();
    if(!result) return null;

    const userWithRole = {
      ...result,
      role: {
        id: result.role_id,
        name: result.role_name,
        display_name: result.role_display_name,
        description: result.role_description,
        is_system_role: result.role_is_system_role
      }
    };

    return userWithRole as IUser & { role: Role };
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    // Raw query
    const sql = `
      SELECT DISTINCT p.* FROM permissions p
      JOIN role_permission rp ON p.id = rp.permission_id
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
    await this.update(userId, {
      status: UserStatus.LOCKED,
      locked_until: lockUntil.toISOString().slice(0, 19).replace('T', ' ')    })
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

}
