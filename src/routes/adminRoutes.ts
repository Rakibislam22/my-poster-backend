import { Router } from 'express';
import {
  deletePosterByAdmin,
  getAdminOverview,
  getModerationQueue,
  reseedTemplates,
  toggleTemplateStatus,
  updatePosterModeration,
} from '../controllers/adminController';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Protect all admin routes with authentication and admin privilege checks
router.use(requireAuth, requireAdmin);

// Overview & Analytics
router.get('/overview', getAdminOverview);

// Content Moderation Queue
router.get('/moderation/queue', getModerationQueue);
router.patch('/moderation/:id', updatePosterModeration);
router.delete('/moderation/:id', deletePosterByAdmin);

// Template Management & Seeding
router.post('/templates/reseed', reseedTemplates);
router.patch('/templates/:id/toggle', toggleTemplateStatus);

export const adminRoutes = router;
