// src/modules/users/user.routes.ts
import { Container } from 'decorator/di.container';
import { Router } from 'express';
import authMiddleware from '~/middlewares/auth.middleware';
import { validate } from '~/middlewares/validation.middleware';
import UserController from './user.controller';
import {
  bulkOperationSchema,
  createUserSchema,
  getUserSchema,
  listUsersSchema,
  resetPasswordSchema,
  updateUserSchema,
} from './user.validation';

const router = Router();
const userController = Container.resolve(UserController);

// All user routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (requires users.create permission)
 */
router.post(
  '/',
  authMiddleware.requirePermission('users.create'),
  validate(createUserSchema),
  userController.createUser
);

/**
 * @route   GET /api/v1/users
 * @desc    List all users with filters and pagination
 * @access  Private (requires users.read permission)
 */
router.get(
  '/',
  authMiddleware.requirePermission('users.read'),
  validate(listUsersSchema),
  userController.listUsers
);

/**
 * @route   GET /api/v1/users/statistics
 * @desc    Get user statistics
 * @access  Private (requires users.read permission)
 */
router.get(
  '/statistics',
  authMiddleware.requirePermission('users.read'),
  userController.getUserStatistics
);

/**
 * @route   GET /api/v1/users/export
 * @desc    Export users to CSV
 * @access  Private (requires users.read permission)
 */
router.get(
  '/export',
  authMiddleware.requirePermission('users.read'),
  userController.exportUsers
);

/**
 * @route   POST /api/v1/users/bulk
 * @desc    Bulk operation on multiple users
 * @access  Private (requires users.update permission)
 */
router.post(
  '/bulk',
  authMiddleware.requirePermission('users.update'),
  validate(bulkOperationSchema),
  userController.bulkOperation
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (requires users.read permission or own profile)
 */
router.get(
  '/:id',
  validate(getUserSchema),
  userController.getUserById
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user by ID
 * @access  Private (requires users.update permission or own profile)
 */
router.put(
  '/:id',
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (requires users.delete permission)
 */
router.delete(
  '/:id',
  authMiddleware.requirePermission('users.delete'),
  validate(getUserSchema),
  userController.deleteUser
);

/**
 * @route   POST /api/v1/users/:id/reset-password
 * @desc    Reset user password (admin)
 * @access  Private (requires users.update permission)
 */
router.post(
  '/:id/reset-password',
  authMiddleware.requirePermission('users.update'),
  validate(resetPasswordSchema),
  userController.resetUserPassword
);

/**
 * @route   GET /api/v1/users/:id/activity
 * @desc    Get user activity log
 * @access  Private (requires users.read permission or own profile)
 */
router.get(
  '/:id/activity',
  validate(getUserSchema),
  userController.getUserActivity
);

/**
 * @route   GET /api/v1/users/:id/sessions
 * @desc    Get user's active sessions
 * @access  Private (requires users.read permission or own profile)
 */
router.get(
  '/:id/sessions',
  validate(getUserSchema),
  userController.getUserSessions
);

/**
 * @route   DELETE /api/v1/users/:id/sessions/:sessionId
 * @desc    Revoke user session
 * @access  Private (requires users.update permission or own profile)
 */
router.delete(
  '/:id/sessions/:sessionId',
  userController.revokeUserSession
);

export const userRoutes = router;
