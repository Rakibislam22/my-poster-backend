import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { loginSchema, registerSchema } from '../validators/authValidators';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.get('/me', requireAuth, getMe);

export const authRoutes = router;
