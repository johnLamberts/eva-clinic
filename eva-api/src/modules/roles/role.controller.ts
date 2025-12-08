import { Service } from "decorator/service.decorator";
import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from "~/utils/api-response.utils";
import { AuthSecurity } from "../auth/auth.security";
import { RequestContext } from "../users/user.type";
import { CreateRoleDto, RoleService, UpdateRoleDto } from "./role.service";

@Service()
export class RoleController {
  constructor(private roleService: RoleService) {}

  /**
   * 🛠️ HELPER: Constructs the RequestContext expected by Service
   * Combines User info + Network info (IP/UserAgent) for Audit Logs
   */
  private getContext(req: Request): RequestContext {
    const user = req.user!;
    return {
      userId: user.userId,
      email: user.email || '',
      roleId: user.roleId || 0,
      permissions: user.permissions || [],
      // Extract network info for audit trails
      ip: AuthSecurity.extractIP(req), 
      userAgent: AuthSecurity.sanitizeUserAgent(req.headers['user-agent']),
    };
  }

  /**
   * Create Role
   */
  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateRoleDto = req.body;
      const context = this.getContext(req); // 🟢 FIX: Use helper

      const result = await this.roleService.createRole(dto, context);
      return ApiResponse.created(res, result, 'Role created successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update Role
   */
  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = parseInt(req.params.id);
      const dto: UpdateRoleDto = req.body;
      const context = this.getContext(req); // 🟢 FIX

      const result = await this.roleService.updateRole(roleId, dto, context);
      return ApiResponse.success(res, result, 'Role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete Role
   */
  deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = parseInt(req.params.id);
      const context = this.getContext(req); // 🟢 FIX

      await this.roleService.deleteRole(roleId, context);
      return ApiResponse.success(res, null, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Role By ID
   */
  getRoleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = parseInt(req.params.id);
      const context = this.getContext(req); // 🟢 FIX

      const result = await this.roleService.getRoleById(roleId, context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * List Roles
   */
  listRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.getContext(req); // 🟢 FIX

      const result = await this.roleService.listRoles(context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get All Permissions
   */
  getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.getContext(req); // 🟢 FIX

      const result = await this.roleService.getAllPermissions(context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Assign Role To User
   */
  assignRoleToUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role_id } = req.body;
      const context = this.getContext(req); // 🟢 FIX
      
      await this.roleService.assignRoleToUser(userId, role_id, context);
      return ApiResponse.success(res, null, 'Role assigned successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default RoleController;
