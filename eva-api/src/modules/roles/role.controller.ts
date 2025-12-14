import { Service } from "decorator/service.decorator";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "~/utils/api-response.utils";
import { AuthSecurity } from "../auth/auth.security";
import { RequestContext } from "../users/user.type";
import { CreateRoleDto, RoleService, UpdateRoleDto } from "./role.service";

@Service()
export class RoleController {
  constructor(private roleService: RoleService) {}

  private getContext(req: Request): RequestContext {
    const user = req.user!;
    return {
      userId: user.userId,
      email: user.email || '',
      roleId: user.roleId || 0,
      permissions: user.permissions || [],
      ip: AuthSecurity.extractIP(req),
      userAgent: AuthSecurity.sanitizeUserAgent(req.headers['user-agent']),
    };
  }

  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateRoleDto = req.body;
      const result = await this.roleService.createRole(dto, this.getContext(req));
      return ApiResponse.created(res, result, 'Role created successfully');
    } catch (error) {
      // 🟢 CRITICAL: Must use next(error) to trigger 400/404/500 responses
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateRoleDto = req.body;
      const result = await this.roleService.updateRole(id, dto, this.getContext(req));
      return ApiResponse.success(res, result, 'Role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      await this.roleService.deleteRole(id, this.getContext(req));
      return ApiResponse.success(res, null, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  listRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.roleService.listRoles(this.getContext(req));
      return ApiResponse.success(res, result, 'Roles retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getRoleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.roleService.getRoleById(id, this.getContext(req));
      return ApiResponse.success(res, result, 'Role retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.roleService.getAllPermissions(this.getContext(req));
      return ApiResponse.success(res, result, 'Permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  assignRoleToUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role_id } = req.body;
      await this.roleService.assignRoleToUser(userId, role_id, this.getContext(req));
      return ApiResponse.success(res, null, 'Role assigned successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default RoleController;
