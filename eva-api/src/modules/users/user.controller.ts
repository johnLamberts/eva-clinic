import { Service } from "decorator/service.decorator";
import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from "~/utils/api-response.utils"; // Adjust path
import { AuthSecurity } from '../auth/auth.security'; // Import AuthSecurity for IP extraction
import { UserFilters, UserService } from './user.service';
import { CreateUserDto, RequestContext, UpdateUserDto } from './user.type';

@Service()
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 🛠️ HELPER: Constructs the RequestContext expected by Service
   * Combines User info + Network info (IP/UserAgent)
   */
  private getContext(req: Request): RequestContext {
    const user = req.user!;
    return {
      userId: user.userId,
      email: user.email || '',
      roleId: user.roleId || 0,
      permissions: user.permissions || [],
      // Use AuthSecurity helper or fallback to express defaults
      ip: AuthSecurity.extractIP(req), 
      userAgent: AuthSecurity.sanitizeUserAgent(req.headers['user-agent']),
    };
  }

  /**
   * Create new user
   */
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateUserDto = req.body;
      // 🟢 FIX: Use getContext instead of req.user
      const context = this.getContext(req); 

      const result = await this.userService.createUser(dto, context);
      return ApiResponse.created(res, result, 'User created successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user by ID
   */
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);
      const dto: UpdateUserDto = req.body;
      const context = this.getContext(req); // 🟢 FIX

      const result = await this.userService.updateUser(userId, dto, context);
      return ApiResponse.success(res, result, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);
      const context = this.getContext(req); // 🟢 FIX

      await this.userService.deleteUser(userId, context);
      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);
      const context = this.getContext(req); // 🟢 FIX

      const result = await this.userService.getUserById(userId, context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * List users
   */
  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.getContext(req); // 🟢 FIX
      
      const filters: UserFilters = {
        status: req.query.status as any,
        roleId: req.query.role_id ? Number(req.query.role_id) : undefined,
        search: req.query.search as string,
        emailVerified: req.query.email_verified === 'true' 
          ? true 
          : req.query.email_verified === 'false' ? false : undefined,
      };

      const pagination = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const result = await this.userService.listUsers(filters, pagination, context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk Operations
   */
  bulkOperation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.getContext(req); // 🟢 FIX
      const result = await this.userService.bulkOperation(req.body, context);
      
      return ApiResponse.success(
        res, 
        result, 
        `Bulk operation: ${result.success} succeeded, ${result.failed} failed`
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Statistics
   */
  getUserStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.getContext(req); // 🟢 FIX
      const result = await this.userService.getUserStatistics(context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Password Reset
   */
  resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const { new_password } = req.body;
      const context = this.getContext(req); // 🟢 FIX
      
      await this.userService.resetUserPassword(userId, new_password, context);
      return ApiResponse.success(res, null, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export CSV
   */
  exportUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.getContext(req); // 🟢 FIX
      const csvData = await this.userService.generateUserCsv(context);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csvData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * User Activity
   */
  getUserActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const context = this.getContext(req); // 🟢 FIX
      const result = await this.userService.getUserActivity(userId, context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Active Sessions
   */
  getUserSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const context = this.getContext(req); // 🟢 FIX
      const result = await this.userService.getUserSessions(userId, context);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Revoke Session
   */
  revokeUserSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const sessionId = Number(req.params.sessionId);
      const context = this.getContext(req); // 🟢 FIX
      
      await this.userService.revokeUserSession(userId, sessionId, context);
      return ApiResponse.success(res, null, 'Session revoked');
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
