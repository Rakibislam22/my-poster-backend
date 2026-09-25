import { Router } from 'express';
import {
  createPoster,
  deletePoster,
  getPosterById,
  getUserPosters,
  regeneratePoster,
} from '../controllers/posterController';
import { requireAuth } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { createPosterSchema, regeneratePosterSchema } from '../validators/posterValidators';

const router = Router();

router.post('/', requireAuth, validateRequest({ body: createPosterSchema }), createPoster);
router.get('/my-posters', requireAuth, getUserPosters);
router.get('/:id', requireAuth, getPosterById);
router.post(
  '/:id/regenerate',
  requireAuth,
  validateRequest({ body: regeneratePosterSchema }),
  regeneratePoster
);
router.delete('/:id', requireAuth, deletePoster);

export const posterRoutes = router;
