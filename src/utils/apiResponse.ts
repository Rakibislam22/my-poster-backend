import { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | unknown;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static success<T>(res: Response, data?: T, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created<T>(res: Response, data?: T, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message = 'An error occurred', statusCode = 500, error?: unknown) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(error && process.env.NODE_ENV !== 'production' ? { error } : {}),
    });
  }

  static badRequest(res: Response, message = 'Bad request', error?: unknown) {
    return this.error(res, message, 400, error);
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Resource not found') {
    return this.error(res, message, 404);
  }
}
