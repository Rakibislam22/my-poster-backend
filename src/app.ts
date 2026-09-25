import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { authLimiter, posterLimiter, uploadLimiter } from './middlewares/rateLimiter';
import { authRoutes } from './routes/authRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { posterRoutes } from './routes/posterRoutes';
import { templateRoutes } from './routes/templateRoutes';
import { uploadRoutes } from './routes/uploadRoutes';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/upload', uploadLimiter, uploadRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/posters', posterLimiter, posterRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
