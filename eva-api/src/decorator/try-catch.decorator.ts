import { NextFunction, Request, Response } from 'express';

export function TryCatch() {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        // Execute the original controller method
        await originalMethod.apply(this, [req, res, next]);
      } catch (error) {
        // Pass error to Global Error Handler
        next(error);
      }
    };

    return descriptor;
  };
}
