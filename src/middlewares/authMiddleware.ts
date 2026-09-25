import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { ApiResponse } from '../utils/apiResponse';
import { verifyToken } from '../utils/jwt';

export interface AuthUser {
  userId: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Authentication required. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return ApiResponse.unauthorized(res, 'User account no longer exists.');
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    next();
  } catch (error) {
    return ApiResponse.unauthorized(res, 'Invalid or expired authentication token.');
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, 'Admin privileges required.');
  }
  next();
};
