import { Router } from 'express';
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  getTemplates,
  updateTemplate,
} from '../controllers/templateController';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createTemplateSchema,
  queryTemplateSchema,
  updateTemplateSchema,
} from '../validators/templateValidators';

const router = Router();

router.get('/', validateRequest({ query: queryTemplateSchema }), getTemplates);
router.get('/:id', getTemplateById);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest({ body: createTemplateSchema }),
  createTemplate
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validateRequest({ body: updateTemplateSchema }),
  updateTemplate
);

router.delete('/:id', requireAuth, requireAdmin, deleteTemplate);

export const templateRoutes = router;
