import { Container } from "decorator/di.container";
import { Router } from "express";
import authMiddleware from "~/middlewares/auth.middleware";
import { validate } from "~/middlewares/validation.middleware";
import RoleController from "./role.controller";
import { assignRoleSchema, createRoleSchema, updateRoleSchema } from "./role.validation";


const router = Router();
const roleController = Container.resolve(RoleController );

/**
 * @route   POST /api/v1/roles
 * @desc    Create new role
 * @access  Private (requires users.manage_roles permission)
 */
router.post(
  '/',
  authMiddleware.requirePermission('users.manage_roles'),
  validate(createRoleSchema),
  roleController.createRole
);

/**
 * @route   GET /api/v1/roles
 * @desc    List all roles
 * @access  Private (requires users.read permission)
 */
router.get(
  '/',
  authMiddleware.requirePermission('users.read'),
  roleController.listRoles
);

/**
 * @route   GET /api/v1/roles/permissions
 * @desc    Get all available permissions
 * @access  Private (requires users.read permission)
 */
router.get(
  '/permissions',
  authMiddleware.requirePermission('users.read'),
  roleController.getAllPermissions
);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID
 * @access  Private (requires users.read permission)
 */
router.get(
  '/:id',
  authMiddleware.requirePermission('users.read'),
  roleController.getRoleById
);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Update role
 * @access  Private (requires users.manage_roles permission)
 */
router.put(
  '/:id',
  authMiddleware.requirePermission('users.manage_roles'),
  validate(updateRoleSchema),
  roleController.updateRole
);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Delete role
 * @access  Private (requires users.manage_roles permission)
 */
router.delete(
  '/:id',
  authMiddleware.requirePermission('users.manage_roles'),
  roleController.deleteRole
);

/**
 * @route   POST /api/v1/roles/assign/:userId
 * @desc    Assign role to user
 * @access  Private (requires users.manage_roles permission)
 */
router.post(
  '/assign/:userId',
  authMiddleware.requirePermission('users.manage_roles'),
  validate(assignRoleSchema),
  roleController.assignRoleToUser
);

export default router;
