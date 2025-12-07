import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Parse AND Transform
      // We validate body, query, and params together
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // 2. Apply Transformations back to Request
      // This ensures that if Zod coerced a string to a number, the controller gets a number.
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // 3. Format Errors for Frontend
        // Maps ['body', 'email'] -> 'email'
        const formattedErrors = error.errors.map(err => ({
          field: err.path.slice(1).join('.'), 
          message: err.message,
        }));

        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
