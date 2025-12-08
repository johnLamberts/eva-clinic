import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import QueryBuilder from "~/orm/query-builder.orm";
import { Permission, Role } from "../users/user.type";

@Service()
export class RoleRepository extends BaseRepository<Role> {
  protected tableName = 'roles';

  // 1. Find by Name
  async findByName(name: string): Promise<Role | null> {
    return this.findOneBy({ name });
  }

  // 2. Get Permissions for a Role (Optimized JOIN)
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    return new QueryBuilder<Permission>('permissions', this.connection)
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
      .where('role_permissions.role_id', '=', roleId)
      .orderBy('permissions.resource', 'ASC')
      .get();
  }

  // 3. Bulk Add Permissions (Solves N+1 Insert problem)
  async addPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    if (permissionIds.length === 0) return;

    // Map IDs to row objects for QueryBuilder
    const data = permissionIds.map(pid => ({
      role_id: roleId,
      permission_id: pid
    }));

    // Use pivot table
    await new QueryBuilder('role_permissions', this.connection).insertMany(data);
  }

  // 4. Clear All Permissions for a Role
  async clearPermissions(roleId: number): Promise<void> {
    await new QueryBuilder('role_permissions', this.connection)
      .where('role_id', '=', roleId)
      .delete();
  }

  // 5. Get All Available Permissions (for UI lists)
  async getAllPermissions(): Promise<Permission[]> {
    return new QueryBuilder<Permission>('permissions', this.connection)
      .orderBy('resource', 'ASC')
      .orderBy('action', 'ASC')
      .get();
  }
  
  // 6. Validate IDs Exist (Safety Check)
  async checkPermissionsExist(permissionIds: number[]): Promise<boolean> {
    if (permissionIds.length === 0) return true;
    
    const count = await new QueryBuilder('permissions', this.connection)
        .whereIn('id', permissionIds)
        .count();
        
    // If the count matches the input array length, all IDs exist
    return count === permissionIds.length;
  }
}
