import { RequestHandler, Router } from 'express';

import auditMiddleware from '~/middlewares/audit.middleware';
import authMiddleware from '~/middlewares/auth.middleware';
import { validate } from '~/middlewares/validation.middleware';
import { AuthController } from './auth.controller';
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from './auth.validation';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user & get tokens
 * @access  Public
 */
router.post(
  '/login',
  validate(loginSchema),
  authController.login.bind(authController) as RequestHandler
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public (or Admin only depending on config)
 */
router.post(
  '/register',
  // authMiddleware.authenticate, // Uncomment to restrict registration to admins
  auditMiddleware.logMutations(), // Logs the creation event
  validate(registerSchema),
  authController.register.bind(authController) as RequestHandler
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken.bind(authController) as RequestHandler
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke current refresh token)
 * @access  Public
 */
router.post(
  '/logout',
  authController.logout.bind(authController) as RequestHandler
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices (Security critical)
 * @access  Private
 */
router.post(
  '/logout-all',
  authMiddleware.authenticate,
  auditMiddleware.logMutations(), // Logs this security-critical action
  authController.logoutAll.bind(authController) as RequestHandler
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authMiddleware.authenticate as RequestHandler,
  validate(changePasswordSchema),
  auditMiddleware.logMutations(), // Logs password changes for compliance
  authController.changePassword.bind(authController) as RequestHandler
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authMiddleware.authenticate as RequestHandler,
  authController.getCurrentUser.bind(authController) as RequestHandler
);

export const authRoutes = router;
