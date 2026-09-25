import { Router } from 'express';
import { uploadMultipleImages, uploadSingleImage } from '../controllers/uploadController';
import { requireAuth } from '../middlewares/authMiddleware';
import { multipleUpload, singleUpload } from '../middlewares/uploadMiddleware';

const router = Router();

router.post('/single', requireAuth, singleUpload('file'), uploadSingleImage);
router.post('/multiple', requireAuth, multipleUpload('files', 5), uploadMultipleImages);

export const uploadRoutes = router;
