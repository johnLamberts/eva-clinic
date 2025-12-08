import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import auditMiddleware from './middlewares/audit.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { authRoutes } from './modules/auth/auth.route';
import { userRoutes } from './modules/users/user.route';
import logger from './utils/logger.utils';


class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet()); // Set security HTTP headers
    this.app.use(hpp()); // Prevent HTTP Parameter Pollution

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    // this.app.use('/api', apiLimiter);

    // Audit logging for mutations
    this.app.use('/api', auditMiddleware.logMutations());

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      next();
    });
  }

  private initializeRoutes(): void {
    const API_PREFIX = process.env.API_PREFIX || '/api/v1';

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // API Routes
    this.app.use(`${API_PREFIX}/auth`, authRoutes);
    // Add more routes here as you build them
    this.app.use(`${API_PREFIX}/users`, userRoutes);
    // this.app.use(`${API_PREFIX}/patients`, patientRoutes);
    // this.app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler (must be after all routes)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }
}

export default new App().app;
