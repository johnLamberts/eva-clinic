export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Key Enterprise Feature: 
    // Marks this error as "Trusted". We can safely send this message to the client.
    // If false (e.g. DB crash), we send a generic "Something went wrong" to hide details.
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Dedicated Validation Error (DRY & Semantic)
export class ValidationError extends AppError {
  constructor(errors: any[]) {
    super('Validation Failed', 400, errors);
  }
}

export default {
  ValidationError, 
  AppError
}
