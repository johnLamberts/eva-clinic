import { Router } from "express";
import authMiddleware from "~/middlewares/auth.middleware";
import { validate } from "~/middlewares/validation.middleware";

// 1. Import Dependencies
import RoleController from "./role.controller";
import { RoleRepository } from "./role.repository";
import { RoleService } from "./role.service";

// 2. Import External Dependencies (The ones causing crashes if missing)
import { AuditRepository } from "../audit/audit.repository";
import AuditService from "../audit/audit.service";
import { UserRepository } from "../users/user.repository";

import { assignRoleSchema, createRoleSchema, updateRoleSchema } from "./role.validation";

const router = Router();

// ---------------------------------------------------------
// 🏗️ MANUAL WIRING (Prevents "undefined" crashes)
// ---------------------------------------------------------

// A. Create Repositories
const roleRepo = new RoleRepository();
const userRepo = new UserRepository();
const auditRepo = new AuditRepository(); // <--- Needed for AuditService

// B. Create Services
// We explicitly pass 'auditRepo' so AuditService.log() works!
const auditService = new AuditService(auditRepo); 

const roleService = new RoleService(roleRepo, userRepo, auditService);

// C. Create Controller
const roleController = new RoleController(roleService);

// ---------------------------------------------------------
// 🟢 ROUTES
// ---------------------------------------------------------

// 🛑 AUTHENTICATION: Required for all routes below
router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/v1/roles
 */
router.post(
  '/',
  authMiddleware.requirePermission('users.manage_roles'),
  validate(createRoleSchema),
  // ⚠️ ARROW FUNCTION WRAPPER: Essential to keep 'this' context!
  (req, res, next) => roleController.createRole(req, res, next)
);

/**
 * @route   GET /api/v1/roles
 */
router.get(
  '/',
  authMiddleware.requirePermission('users.read'),
  (req, res, next) => roleController.listRoles(req, res, next)
);

/**
 * @route   GET /api/v1/roles/permissions
 */
router.get(
  '/permissions',
  authMiddleware.requirePermission('users.read'),
  (req, res, next) => roleController.getAllPermissions(req, res, next)
);

/**
 * @route   GET /api/v1/roles/:id
 */
router.get(
  '/:id',
  authMiddleware.requirePermission('users.read'),
  (req, res, next) => roleController.getRoleById(req, res, next)
);

/**
 * @route   PUT /api/v1/roles/:id
 */
router.put(
  '/:id',
  authMiddleware.requirePermission('users.manage_roles'),
  validate(updateRoleSchema),
  (req, res, next) => roleController.updateRole(req, res, next)
);

/**
 * @route   DELETE /api/v1/roles/:id
 */
router.delete(
  '/:id',
  authMiddleware.requirePermission('users.manage_roles'),
  (req, res, next) => roleController.deleteRole(req, res, next)
);

/**
 * @route   POST /api/v1/roles/assign/:userId
 */
router.post(
  '/assign/:userId',
  authMiddleware.requirePermission('users.manage_roles'),
  validate(assignRoleSchema),
  (req, res, next) => roleController.assignRoleToUser(req, res, next)
);

export const roleRoutes = router;
