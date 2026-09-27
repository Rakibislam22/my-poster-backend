import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Poster } from '../models/Poster';
import { Template } from '../models/Template';
import { User } from '../models/User';
import { ApiResponse } from '../utils/apiResponse';
import { seedDatabase } from '../utils/seedDatabase';

/**
 * 1. Admin System Overview & Analytics
 */
export const getAdminOverview = async (req: Request, res: Response) => {
  try {
    // Auto-migrate legacy posters without moderationStatus to 'pending'
    await Poster.updateMany(
      { $or: [{ moderationStatus: { $exists: false } }, { moderationStatus: null }] },
      { $set: { moderationStatus: 'pending' } }
    );

    const [
      totalPosters,
      pendingCount,
      approvedCount,
      rejectedCount,
      flaggedCount,
      totalTemplates,
      activeTemplates,
      totalUsers,
      recentPosters,
    ] = await Promise.all([
      Poster.countDocuments(),
      Poster.countDocuments({ moderationStatus: 'pending' }),
      Poster.countDocuments({ moderationStatus: 'approved' }),
      Poster.countDocuments({ moderationStatus: 'rejected' }),
      Poster.countDocuments({ moderationStatus: 'flagged' }),
      Template.countDocuments(),
      Template.countDocuments({ isActive: true }),
      User.countDocuments(),
      Poster.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('userId', 'name email role')
        .populate('templateId', 'title occasionType thumbnailUrl'),
    ]);

    return ApiResponse.success(
      res,
      {
        stats: {
          totalPosters,
          pendingModeration: pendingCount,
          approvedPosters: approvedCount,
          rejectedPosters: rejectedCount,
          flaggedPosters: flaggedCount,
          totalTemplates,
          activeTemplates,
          totalUsers,
        },
        recentPosters,
      },
      'Admin overview retrieved successfully'
    );
  } catch (error: any) {
    return ApiResponse.error(res, 'Failed to fetch admin overview', 500, error.message);
  }
};

/**
 * 2. Content Moderation Queue (with filtering, pagination, search)
 */
export const getModerationQueue = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string) || 12));
    const status = (req.query.status as string) || 'all';
    const search = (req.query.search as string)?.trim();

    const query: any = {};

    if (status && status !== 'all') {
      query.moderationStatus = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { 'formData.candidateName': regex },
        { 'formData.headlineBangla': regex },
        { 'formData.party': regex },
        { 'formData.designation': regex },
        { 'formData.area': regex },
      ];
    }

    const [posters, total, pendingCount, approvedCount, rejectedCount, flaggedCount] = await Promise.all([
      Poster.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email role phone')
        .populate('templateId', 'title occasionType canvasDimensions thumbnailUrl')
        .populate('moderatedBy', 'name email'),
      Poster.countDocuments(query),
      Poster.countDocuments({ moderationStatus: 'pending' }),
      Poster.countDocuments({ moderationStatus: 'approved' }),
      Poster.countDocuments({ moderationStatus: 'rejected' }),
      Poster.countDocuments({ moderationStatus: 'flagged' }),
    ]);

    return ApiResponse.success(
      res,
      {
        posters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        counts: {
          all: pendingCount + approvedCount + rejectedCount + flaggedCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          flagged: flaggedCount,
        },
      },
      'Moderation queue retrieved successfully'
    );
  } catch (error: any) {
    return ApiResponse.error(res, 'Failed to fetch moderation queue', 500, error.message);
  }
};

/**
 * 3. Update Poster Moderation Status (Approve, Reject, Flag)
 */
export const updatePosterModeration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, moderationNotes, flaggedReason } = req.body;
    const adminId = req.user?.userId;

    if (!['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
      return ApiResponse.badRequest(res, 'Invalid moderation status. Must be pending, approved, rejected, or flagged.');
    }

    if (!mongoose.isValidObjectId(id)) {
      return ApiResponse.notFound(res, 'Invalid poster ID format');
    }

    const poster = await Poster.findById(id);
    if (!poster) {
      return ApiResponse.notFound(res, 'Poster not found');
    }

    poster.moderationStatus = status;
    if (moderationNotes !== undefined) poster.moderationNotes = moderationNotes;
    if (flaggedReason !== undefined) poster.flaggedReason = flaggedReason;
    if (adminId) poster.moderatedBy = new mongoose.Types.ObjectId(adminId);
    poster.moderatedAt = new Date();

    await poster.save();

    const populated = await Poster.findById(id)
      .populate('userId', 'name email role')
      .populate('templateId', 'title occasionType')
      .populate('moderatedBy', 'name email');

    return ApiResponse.success(res, populated, `Poster status updated to ${status}`);
  } catch (error: any) {
    return ApiResponse.error(res, 'Failed to update poster moderation status', 500, error.message);
  }
};

/**
 * 4. Admin Delete Poster
 */
export const deletePosterByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return ApiResponse.notFound(res, 'Invalid poster ID format');
    }

    const poster = await Poster.findByIdAndDelete(id);
    if (!poster) {
      return ApiResponse.notFound(res, 'Poster not found');
    }

    return ApiResponse.success(res, { id }, 'Poster deleted by admin successfully');
  } catch (error: any) {
    return ApiResponse.error(res, 'Failed to delete poster', 500, error.message);
  }
};

/**
 * 5. Re-seed Templates via Seed Script
 */
export const reseedTemplates = async (req: Request, res: Response) => {
  try {
    await seedDatabase(true);
    const templates = await Template.find().sort({ createdAt: -1 });

    return ApiResponse.success(
      res,
      {
        count: templates.length,
        templates,
      },
      'Templates successfully re-seeded from default calibrated layout configurations'
    );
  } catch (error: any) {
    return ApiResponse.error(res, 'Failed to reseed templates', 500, error.message);
  }
};

/**
 * 6. Toggle Template Active Status
 */
export const toggleTemplateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return ApiResponse.notFound(res, 'Invalid template ID');
    }

    const template = await Template.findById(id);
    if (!template) {
      return ApiResponse.notFound(res, 'Template not found');
    }

    template.isActive = !template.isActive;
    await template.save();

    return ApiResponse.success(
      res,
      template,
      `Template "${template.title}" is now ${template.isActive ? 'Active' : 'Inactive'}`
    );
  } catch (error: any) {
    return ApiResponse.error(res, 'Failed to toggle template status', 500, error.message);
  }
};
