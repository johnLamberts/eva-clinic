import { Response } from 'express';

export class ApiResponse {
  
  static success<T>(
    res: Response, 
    data: T, 
    message: string = 'Success', 
    statusCode: number = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        // Assuming you have the request-id middleware, otherwise optional
        traceId: res.req?.headers['x-request-id'] || 'unknown' 
      }
    });
  }

  static created<T>(res: Response, data: T, message: string = 'Resource created') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}
