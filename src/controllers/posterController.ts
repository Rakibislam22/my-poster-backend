import { Request, Response } from 'express';
import { GenerationLog } from '../models/GenerationLog';
import { Poster } from '../models/Poster';
import { Template } from '../models/Template';
import { canvasService } from '../services/canvasService';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { ApiResponse } from '../utils/apiResponse';
import { CreatePosterInput, RegeneratePosterInput } from '../validators/posterValidators';

export const createPoster = async (
  req: Request<{}, {}, CreatePosterInput>,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }

  const {
    templateId,
    candidateName,
    headlineBangla,
    designation,
    party,
    area,
    footerCredit,
    customNotes,
    uploadedPhotos,
    useAiSlogans,
  } = req.body;

  const template = await Template.findById(templateId);
  if (!template) {
    return ApiResponse.notFound(res, 'Specified template not found');
  }

  let finalHeadline = headlineBangla;
  let finalFooter = footerCredit;

  const startTime = Date.now();
  let aiLogData = {
    promptUsed: '',
    tokensUsed: 0,
    success: true,
  };

  if (useAiSlogans || !headlineBangla) {
    try {
      const aiResult = await geminiService.generatePosterCopy({
        occasionType: template.occasionType,
        candidateName,
        designation,
        party,
        area,
        customNotes,
        userHeadline: headlineBangla,
      });

      finalHeadline = aiResult.headlineBangla;
      finalFooter = finalFooter || aiResult.footerCreditBangla;
      aiLogData.promptUsed = aiResult.promptUsed;
      aiLogData.tokensUsed = aiResult.tokensUsed;
    } catch (err) {
      console.warn('AI enhancement fallback:', err);
    }
  }

  const poster = await Poster.create({
    userId,
    templateId: template._id,
    formData: {
      occasionType: template.occasionType,
      headlineBangla: finalHeadline || template.layoutConfig.textSlots.headline.defaultBangla,
      candidateName,
      designation,
      party,
      area,
      footerCredit: finalFooter || template.layoutConfig.textSlots.footerCredit.defaultBangla,
      customNotes,
    },
    uploadedPhotos: {
      leaderPhotos: uploadedPhotos?.leaderPhotos || [],
      candidatePhoto: uploadedPhotos?.candidatePhoto,
    },
    status: 'processing',
  });

  try {
    const posterBuffer = await canvasService.renderPoster(
      template,
      poster.formData,
      poster.uploadedPhotos
    );

    const uploadResult = await storageService.saveBuffer(posterBuffer, 'posters', 'png');

    poster.generatedImageUrl = uploadResult.url;
    poster.previewUrl = uploadResult.url;
    poster.status = 'completed';
    await poster.save();

    const latencyMs = Date.now() - startTime;
    await GenerationLog.create({
      posterId: poster._id,
      userId: poster.userId,
      promptUsed: aiLogData.promptUsed,
      tokensUsed: aiLogData.tokensUsed,
      latencyMs,
      success: true,
    });

    return ApiResponse.created(res, poster, 'Poster generated successfully');
  } catch (renderError: any) {
    console.error('❌ Canvas rendering error:', renderError);
    poster.status = 'failed';
    poster.errorMessage = renderError.message || 'Image rendering failed';
    await poster.save();

    return ApiResponse.error(
      res,
      'Poster generation failed during rendering pipeline',
      500,
      renderError.message
    );
  }
};

export const getPosterById = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const poster = await Poster.findById(id).populate('templateId');
  if (!poster) {
    return ApiResponse.notFound(res, 'Poster not found');
  }

  return ApiResponse.success(res, poster, 'Poster retrieved successfully');
};

export const getUserPosters = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }

  const posters = await Poster.find({ userId })
    .populate('templateId', 'title occasionType thumbnailUrl')
    .sort({ createdAt: -1 });

  return ApiResponse.success(
    res,
    { posters, count: posters.length },
    'User poster history retrieved'
  );
};

export const regeneratePoster = async (
  req: Request<{ id: string }, {}, RegeneratePosterInput>,
  res: Response
) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  const poster = await Poster.findById(id);
  if (!poster) {
    return ApiResponse.notFound(res, 'Poster not found');
  }

  if (poster.userId.toString() !== userId && req.user?.role !== 'admin') {
    return ApiResponse.forbidden(res, 'Unauthorized to modify this poster');
  }

  const template = await Template.findById(poster.templateId);
  if (!template) {
    return ApiResponse.notFound(res, 'Template associated with poster not found');
  }

  if (req.body.candidateName) poster.formData.candidateName = req.body.candidateName;
  if (req.body.headlineBangla) poster.formData.headlineBangla = req.body.headlineBangla;
  if (req.body.designation !== undefined) poster.formData.designation = req.body.designation;
  if (req.body.party !== undefined) poster.formData.party = req.body.party;
  if (req.body.area !== undefined) poster.formData.area = req.body.area;
  if (req.body.footerCredit !== undefined) poster.formData.footerCredit = req.body.footerCredit;

  if (req.body.uploadedPhotos) {
    if (req.body.uploadedPhotos.candidatePhoto) {
      poster.uploadedPhotos.candidatePhoto = req.body.uploadedPhotos.candidatePhoto;
    }
    if (req.body.uploadedPhotos.leaderPhotos) {
      poster.uploadedPhotos.leaderPhotos = req.body.uploadedPhotos.leaderPhotos;
    }
  }

  poster.status = 'processing';
  await poster.save();

  try {
    const posterBuffer = await canvasService.renderPoster(
      template,
      poster.formData,
      poster.uploadedPhotos
    );

    const uploadResult = await storageService.saveBuffer(posterBuffer, 'posters', 'png');

    poster.generatedImageUrl = uploadResult.url;
    poster.previewUrl = uploadResult.url;
    poster.status = 'completed';
    await poster.save();

    return ApiResponse.success(res, poster, 'Poster regenerated successfully');
  } catch (error: any) {
    poster.status = 'failed';
    poster.errorMessage = error.message;
    await poster.save();
    return ApiResponse.error(res, 'Regeneration failed', 500, error.message);
  }
};

export const deletePoster = async (req: Request<{ id: string }>, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  const poster = await Poster.findById(id);
  if (!poster) {
    return ApiResponse.notFound(res, 'Poster not found');
  }

  if (poster.userId.toString() !== userId && req.user?.role !== 'admin') {
    return ApiResponse.forbidden(res, 'Unauthorized to delete this poster');
  }

  await Poster.findByIdAndDelete(id);
  return ApiResponse.success(res, { id }, 'Poster deleted successfully');
};
