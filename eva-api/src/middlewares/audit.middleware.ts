/* eslint-disable prefer-rest-params */
import { NextFunction, Request, Response } from 'express';
import { AuditRepository } from '~/modules/audit/audit.repository';
import AuditService from '~/modules/audit/audit.service';
import { AuthSecurity } from '~/modules/auth/auth.security';


export class AuditMiddleware {
  private auditService: AuditService;

  constructor() {
    const auditRepo = new AuditRepository();
    
    this.auditService = new AuditService(auditRepo);
  }

  /**
   * Main Middleware: Intercepts responses to log mutations
   */
  logMutations = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

      if (!mutationMethods.includes(req.method)) {
        return next();
      }

      // 1. Capture the original send method
      const originalSend = res.send;
      let responseBody: any = null;

      // 2. Override res.send (covers res.json, res.send, etc.)
      res.send = function (body: any): Response {
        responseBody = body;
        // Call the original method to ensure response is sent to client
        return originalSend.apply(this, arguments as any);
      };

      // 3. Listen for the response to finish
      res.on('finish', () => {
        // Skip if opted out or error status (unless you want to log errors too)
        if (req.auditContext?.ignore || res.statusCode >= 400) return;

        // Execute asynchronously to not block the event loop
        this.processLog(req, res, responseBody).catch((err) => {
          console.error('[AuditMiddleware] Logging failed:', err);
        });
      });

      next();
    };
  };

  /**
   * Internal method to process and save the log
   */
  private async processLog(req: Request, res: Response, rawResponseBody: any) {
let newValues = rawResponseBody;
    try {
      if (typeof rawResponseBody === 'string') {
        newValues = JSON.parse(rawResponseBody);
      }
    } catch {
      // ignore JSON parse errors
    }

    const userId = req.user?.userId;
    
    // FIX: Pass the entire 'req' object, letting AuthSecurity handle header logic
    const ipAddress = AuthSecurity.extractIP(req);
    
    // FIX: sanitizeUserAgent is now available in AuthSecurity
    const userAgent = AuthSecurity.sanitizeUserAgent(req.headers['user-agent']);

    const action = req.auditContext?.action || this.getActionFromMethod(req.method);
    const entityInfo = this.extractEntityInfo(req);
    const entityId = req.auditContext?.entityId || entityInfo.entityId;
    const entityType = entityInfo.entityType;

    const safeNewValues = this.deepSanitize(newValues);
    const safeOldValues = req.auditContext?.oldValues ? this.deepSanitize(req.auditContext.oldValues) : null;

    await this.auditService.log({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId as number | null,
      old_values: safeOldValues,
      new_values: safeNewValues,
      ip_address: ipAddress,
      user_agent: userAgent,
      status_code: res.statusCode as any,
    });
  }

  // --- Helpers ---

  private getActionFromMethod(method: string): string {
    const map: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return map[method] || 'unknown';
  }

  private extractEntityInfo(req: Request): { entityType: string; entityId: number | string | null } {
    // 1. Try to use the Route Pattern (e.g., "/api/users/:id") if available
    // This is much more reliable than splitting the string
    const routePath = req.route?.path; 
    
    if (routePath) {
        // clean up slashes and params
        // e.g. "/users/:id" -> "users"
        const type = routePath.split('/').filter((p: string) => p && !p.startsWith(':'))[0];
        return { 
            entityType: type || 'unknown',
            entityId: req.params.id ? req.params.id : null 
        };
    }

    // Fallback: Manual URL parsing (as you had before)
    const pathParts = req.path.split('/').filter(Boolean);
    if (pathParts[0] === 'api' || pathParts[0].startsWith('v')) pathParts.shift();
    
    return { 
        entityType: pathParts[0] || 'unknown', 
        entityId: pathParts[1] || null 
    };
  }

  /**
   * Recursive Sanitization
   */
  private deepSanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    // Handle Arrays
    if (Array.isArray(data)) {
      return data.map(item => this.deepSanitize(item));
    }

    const sensitiveFields = new Set([
      'password', 'password_hash', 'token', 'refresh_token', 'access_token', 
      'secret', 'credit_card', 'cvv'
    ]);

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.has(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.deepSanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

export default new AuditMiddleware();
