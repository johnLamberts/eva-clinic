import { NextFunction, Request, Response } from 'express';
import { AppError } from './app-error.utils';

// Handle specific DB errors (Example: MySQL Duplicate Entry)
const handleDuplicateFieldsDB = (err: any) => {
  const message = `Duplicate field value: ${err.sqlMessage || 'unknown'}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err: any, res: Response) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } 
  // B) Programming or other unknown error: don't leak details
  else {
    // 1) Log error for DevOps
    console.error('🔥 ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message; // Important: Copy message property explicitly

    // Handle Specific Errors
    if (error.code === 'ER_DUP_ENTRY') error = handleDuplicateFieldsDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
