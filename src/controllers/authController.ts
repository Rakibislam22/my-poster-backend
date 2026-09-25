import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiResponse } from '../utils/apiResponse';
import { generateToken } from '../utils/jwt';
import { LoginInput, RegisterInput } from '../validators/authValidators';

export const register = async (req: Request<{}, {}, RegisterInput>, res: Response) => {
  const { name, email, phone, password, role } = req.body;

  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return ApiResponse.badRequest(res, 'An account with this email already exists.');
    }
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return ApiResponse.badRequest(res, 'An account with this phone number already exists.');
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email: email ? email.toLowerCase() : undefined,
    phone,
    passwordHash,
    role: role || 'user',
  });

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return ApiResponse.created(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
    'Registration successful'
  );
};

export const login = async (req: Request<{}, {}, LoginInput>, res: Response) => {
  const { identifier, password } = req.body;

  const normalizedIdentifier = identifier.trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalizedIdentifier }, { phone: identifier.trim() }],
  });

  if (!user) {
    return ApiResponse.unauthorized(res, 'Invalid credentials.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return ApiResponse.unauthorized(res, 'Invalid credentials.');
  }

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return ApiResponse.success(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
    'Login successful'
  );
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Not authenticated');
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  return ApiResponse.success(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
    'User profile retrieved'
  );
};
