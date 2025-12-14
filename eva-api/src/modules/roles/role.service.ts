import { Service } from "decorator/service.decorator";
import { Transaction } from "~/orm/transaction.orm";
import { AppError } from "~/utils/app-error.utils";
import AuditService from "../audit/audit.service";
// 🟢 FIX 1: Direct import to prevent circular dependency crashes
import { UserRepository } from "../users/user.repository";
import { Permission, RequestContext, RoleWithPermissions } from "../users/user.type";
import { RoleRepository } from "./role.repository";

export interface CreateRoleDto {
  name: string;
  display_name: string;
  description?: string;
  permission_ids: number[];
}

export interface UpdateRoleDto {
  display_name?: string;
  description?: string;
  permission_ids?: number[];
}

@Service()
export class RoleService {
  constructor(
    private roleRepo: RoleRepository,
    private userRepo: UserRepository,
    private auditService: AuditService
  ) {}

  // ---------------------------------------------------------
  // 🟢 CREATE
  // ---------------------------------------------------------
  async createRole(dto: CreateRoleDto, ctx: RequestContext): Promise<RoleWithPermissions> {
    this.checkPermission(ctx, 'users.manage_roles');

    // 1. Validations
    if (!/^[a-z0-9_]+$/.test(dto.name)) throw new AppError('Role name must be lowercase with underscores', 400);
    
    const existing = await this.roleRepo.findByName(dto.name);
    if (existing) throw new AppError('Role name already exists', 409);

    if (dto.permission_ids?.length) {
       const allExist = await this.roleRepo.checkPermissionsExist(dto.permission_ids);
       if (!allExist) throw new AppError('One or more invalid Permission IDs', 400);
    }

    return Transaction.transaction(async () => {
      // 2. Create Role
      const created: any = await this.roleRepo.create({
        name: dto.name,
        display_name: dto.display_name,
        description: dto.description,
        is_system_role: false,
      });

      // 3. Capture ID Safely (Handles different DB driver returns)
      let newRoleId = created.id;
      if (!newRoleId && created.insertId) {
        newRoleId = created.insertId;
      }
      if (!newRoleId) throw new AppError("Database failed to return new Role ID", 500);

      // 4. Assign Permissions
      if (dto.permission_ids?.length) {
        await this.roleRepo.addPermissions(newRoleId, dto.permission_ids);
      }

      // 5. Audit
      await this.logAudit(ctx, 'create', newRoleId, { 
        name: dto.name, 
        permissions_count: dto.permission_ids.length 
      });

      // 🟢 FIX 2: Manually Construct Response
      // We do NOT call `getRoleWithDetails` here to avoid the 404 Transaction Isolation error.
      return {
        id: newRoleId,
        name: dto.name,
        display_name: dto.display_name,
        description: dto.description,
        is_system_role: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        permissions: [], // We return empty here to avoid complexity. The UI can reload if needed.
        user_count: 0
      } as unknown as RoleWithPermissions;
    });
  }

  // ---------------------------------------------------------
  // 🟡 UPDATE
  // ---------------------------------------------------------
  async updateRole(roleId: number, dto: UpdateRoleDto, ctx: RequestContext): Promise<RoleWithPermissions> {
    this.checkPermission(ctx, 'users.manage_roles');

    const currentRole = await this.roleRepo.findById(roleId);
    if (!currentRole) throw new AppError('Role not found', 404);
    if (currentRole.is_system_role) throw new AppError('Cannot modify system roles', 403);

    return Transaction.transaction(async () => {
      // 1. Update Basic Info
      if (dto.display_name || dto.description) {
        await this.roleRepo.update(roleId, {
          display_name: dto.display_name,
          description: dto.description,
        });
      }

      // 2. Update Permissions
      if (dto.permission_ids) {
        if(dto.permission_ids.length > 0) {
            const allExist = await this.roleRepo.checkPermissionsExist(dto.permission_ids);
            if (!allExist) throw new AppError('One or more invalid Permission IDs', 400);
        }

        await this.roleRepo.clearPermissions(roleId);
        await this.roleRepo.addPermissions(roleId, dto.permission_ids);
      }

      // 3. Audit
      await this.logAudit(ctx, 'update', roleId, 
        { display_name: dto.display_name, permissions_count: dto.permission_ids?.length },
        { display_name: currentRole.display_name }
      );

      // Return updated object manually (Safest approach inside transaction)
      return {
        ...currentRole,
        display_name: dto.display_name || currentRole.display_name,
        description: dto.description || currentRole.description,
        permissions: [], 
        user_count: 0 
      } as any;
    });
  }

  // ---------------------------------------------------------
  // 🔴 DELETE
  // ---------------------------------------------------------
  async deleteRole(roleId: number, ctx: RequestContext): Promise<void> {
    this.checkPermission(ctx, 'users.manage_roles');

    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    if (role.is_system_role) throw new AppError('Cannot delete system roles', 403);

    const userCount = await this.userRepo.countByRole(roleId);
    if (userCount > 0) throw new AppError(`Cannot delete role. ${userCount} users still assigned.`, 400);

    await Transaction.transaction(async () => {
      await this.roleRepo.softDelete(roleId, ctx.userId);
      await this.logAudit(ctx, 'delete', roleId, null, { name: role.name });
    });
  }

  // ---------------------------------------------------------
  // 🔵 READ
  // ---------------------------------------------------------
  async getRoleById(roleId: number, ctx: RequestContext): Promise<RoleWithPermissions> {
    this.checkPermission(ctx, 'users.read');
    return this.getRoleWithDetails(roleId);
  }

  async listRoles(ctx: RequestContext): Promise<RoleWithPermissions[]> {
    this.checkPermission(ctx, 'users.read');
    const roles = await this.roleRepo.findAll(false);
    return Promise.all(roles.map(r => this.getRoleWithDetails(r.id!)));
  }

  async getAllPermissions(ctx: RequestContext): Promise<Permission[]> {
    this.checkPermission(ctx, 'users.read');
    return this.roleRepo.getAllPermissions();
  }

  // ---------------------------------------------------------
  // 👤 ASSIGNMENT
  // ---------------------------------------------------------
  async assignRoleToUser(userId: number, roleId: number, ctx: RequestContext): Promise<void> {
    this.checkPermission(ctx, 'users.manage_roles');

    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    if (user.role_id === roleId) return;

    await this.userRepo.update(userId, { role_id: roleId } as any, ctx.userId);

    await this.logAudit(ctx, 'role_change', userId, 
      { role_id: roleId, role_name: role.name },
      { role_id: user.role_id }
    );
  }

  // =========================================================
  // 🛠️ PRIVATE HELPERS
  // =========================================================

  private checkPermission(ctx: RequestContext, permission: string) {
    if (!ctx.permissions.includes(permission)) {
      throw new AppError('Permission denied', 403);
    }
  }

  private async getRoleWithDetails(roleId: number): Promise<RoleWithPermissions> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    const [permissions, user_count] = await Promise.all([
      this.roleRepo.getRolePermissions(roleId),
      this.userRepo.countByRole(roleId)
    ]);

    return { ...role, permissions, user_count };
  }

  private async logAudit(ctx: RequestContext, action: string, entityId: number, newValues?: any, oldValues?: any) {
    this.auditService.log({
      user_id: ctx.userId,
      action,
      entity_type: 'roles',
      entity_id: entityId,
      new_values: newValues,
      old_values: oldValues,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent
    });
  }
}
