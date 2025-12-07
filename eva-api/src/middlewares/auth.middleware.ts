import { Container } from "decorator/di.container";
import { NextFunction, Request, Response } from "express";
import { AuthSecurity } from "~/modules/auth/auth.security";
import { UserRepository } from "~/modules/users";
import { RequestContext } from "~/modules/users/user.type";
import { AppError } from "../utils";

export class AuthMiddleware {
  private userRepo = Container.resolve(UserRepository);

  /**
   * 1.CORE AUTHENTICATION LOGC
   * Handles extraction, validation and context attachment in one place
   */
  private async verifyRequest(req: Request, isRequired: boolean): Promise<void> {
    const header = req.headers.authorization as string;

    // 1. Check header format
    if(!header || !header.startsWith('Bearer ')) {
      if(isRequired) throw new AppError(`No token provided`, 401);
      return;
    }
    
    
    // 2. Verify token signature
    const token = header.substring(7) // Removing `Bearer`
    const payload= AuthSecurity.verifyAccessToken(token);

    if(!payload) {
      if(isRequired) throw new AppError(`Invalid or expired token`, 401);
      return;
    }

    // 3. Verify user state
    const user = await this.userRepo.findById(payload.userId);
    if(!user || user.deleted_at || user.status !== 'active') {
      if(isRequired) throw new AppError(`User account is invalid or inactive`, 401);
      return;
    }

    // 4. Loads permission
    const permissions = await this.userRepo.getUserPermissions(payload.userId);
    req.user = {
      userId: user.id!,
      email: user.email,
      roleId: user.role_id,
      permissions: permissions.map(p => p.name),
      ip: AuthSecurity.extractIP(req),
      userAgent: (req.headers['user-agent'] || 'unknown').slice(0, 255)
    };
  }


  /**
   * 2. PUBLIC MIDDLEWARE METHODS
   */
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.verifyRequest(req, true); // true = throw if failed
      next();
    } catch (error) {
      next(error);
    }
  };

  optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.verifyRequest(req, false); // false = silent fail
      next();
    } catch (error) {
      // For optional auth, we ignore internal errors and just proceed as guest
      next();
    }
  };

  /**
   * 3. RBAC FACTORY (The DRY Guard)
   * Wraps specific logic in a standard permission check.
   */
  private guard(validator: (user: RequestContext) => boolean, errorMsg: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) return next(new AppError('Authentication required', 401));
      
      if (!validator(req.user as any)) {
        return next(new AppError(`Permission denied: ${errorMsg}`, 403));
      }
      next();
    };
  }

  // --- Simplified Role & Permission Methods ---
  requirePermission = (perm: string) => 
    this.guard(u => u.permissions.includes(perm), `Missing ${perm}`);

  requireAnyPermission = (perms: string[]) => 
    this.guard(u => perms.some(p => u.permissions.includes(p)), `Need one of: ${perms.join(',')}`);

  requireAllPermissions = (perms: string[]) => 
    this.guard(u => perms.every(p => u.permissions.includes(p)), `Need all: ${perms.join(',')}`);

  requireRole = (roleId: number) => 
    this.guard(u => u.roleId === roleId, 'Insufficient role privileges');

  requireOwnershipOrAdmin = (paramKey = 'id') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) return next(new AppError('Authentication required', 401));

      const resourceId = parseInt(req.params[paramKey]);
      const isOwner = req.user.userId === resourceId;
      const isAdmin = req.user.permissions?.includes('users.manage_roles'); // Or check roleId

      if (!isOwner && !isAdmin) {
        return next(new AppError('Access denied: Resource ownership required', 403));
      }
      next();
    };
  };
  
}

export default new AuthMiddleware();
