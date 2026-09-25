import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../utils/apiResponse';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('🔥 Error caught by global handler:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiResponse.badRequest(res, `Duplicate value entered for ${field}. Please use another value.`);
  }

  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, `Invalid resource identifier: ${err.value}`);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token. Please authenticate again.');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expired. Please login again.');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return ApiResponse.error(res, message, statusCode, err.stack);
};
