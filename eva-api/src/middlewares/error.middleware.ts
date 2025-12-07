// src/middleware/error.middleware.ts
import { NextFunction, Request, Response } from 'express';
import logger from '~/utils/logger.utils';
import { ApiResponse, AppError } from '../utils';


export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] | undefined;

  // Handle known AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = (err as any).errors ;
  }
  // Handle MySQL errors
  else if ((err as any).code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry - resource already exists';
  }
  else if ((err as any).code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Invalid reference - related resource does not exist';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // // Log error
  logger.error({
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
  });

  // Send error response
  // res.status(statusCode).json(errorResponse(message, errors));
  ApiResponse.created(res, errors, message)
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};
