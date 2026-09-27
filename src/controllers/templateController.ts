import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Template } from '../models/Template';
import { ApiResponse } from '../utils/apiResponse';
import { CreateTemplateInput, UpdateTemplateInput } from '../validators/templateValidators';

export const getTemplates = async (req: Request, res: Response) => {
  const { occasionType } = req.query;

  const query: Record<string, unknown> = { isActive: true };
  if (occasionType) {
    query.occasionType = occasionType;
  }

  const templates = await Template.find(query).sort({ createdAt: -1 });

  return ApiResponse.success(res, {
    templates,
    count: templates.length,
  }, 'Templates retrieved successfully');
};

export const getTemplateById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  let template: any = null;
  if (mongoose.isValidObjectId(id)) {
    template = await Template.findById(id);
  }
  if (!template) {
    const cleanOccasion = id.replace(/^seed[-_]/i, '').replace(/[-]/g, '_');
    template = await Template.findOne({
      $or: [{ occasionType: cleanOccasion as any }, { occasionType: id as any }],
    } as any);
  }
  if (!template) {
    return ApiResponse.notFound(res, 'Template not found');
  }

  return ApiResponse.success(res, template, 'Template retrieved successfully');
};

export const createTemplate = async (
  req: Request<{}, {}, CreateTemplateInput>,
  res: Response
) => {
  const template = await Template.create(req.body);
  return ApiResponse.created(res, template, 'Template created successfully');
};

export const updateTemplate = async (
  req: Request<{ id: string }, {}, UpdateTemplateInput>,
  res: Response
) => {
  const { id } = req.params;

  const template = await Template.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!template) {
    return ApiResponse.notFound(res, 'Template not found');
  }

  return ApiResponse.success(res, template, 'Template updated successfully');
};

export const deleteTemplate = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const template = await Template.findByIdAndDelete(id);
  if (!template) {
    return ApiResponse.notFound(res, 'Template not found');
  }

  return ApiResponse.success(res, { id }, 'Template deleted successfully');
};
