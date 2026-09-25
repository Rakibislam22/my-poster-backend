import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
  }, 'Service is operational');
});

export const healthRoutes = router;
