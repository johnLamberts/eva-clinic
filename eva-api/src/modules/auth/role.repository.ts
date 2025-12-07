import BaseRepository from "~/orm/base-repository.orm";
import executeRaw from "~/utils/execute-raw.utils";
import { Permission, Role } from "../users/user.type";

export class RoleRepository extends BaseRepository<Role> {
  protected tableName: string = 'roles';

  async findByName(name: string): Promise<Role | null> {
    return this.findOneBy({ name });
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const sql = `
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;
    return executeRaw<Permission>(this, sql, [roleId]);
  }
}

export default {
  RoleRepository
}
