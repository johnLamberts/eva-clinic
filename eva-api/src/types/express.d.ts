
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email?: string;
        roleId?: number;
        permissions?: string[];
        [key: string]: any;
      };
      
      auditContext?: {
        oldValues?: any;
        newValues?: any;
        entityId?: string | number;
        action?: string;
        ignore?: boolean;
      };
    }
  }
}

export { };
