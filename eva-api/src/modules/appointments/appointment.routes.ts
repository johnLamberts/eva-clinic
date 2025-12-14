import { Router } from 'express';
import authMiddleware from '~/middlewares/auth.middleware';
import { validate } from '~/middlewares/validation.middleware';

// 1. Import Controller & Service
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

// 2. Import External Dependencies
import { AuditRepository } from '../audit/audit.repository';
import AuditService from '../audit/audit.service';
import { PatientRepository } from '../patients/patient.repository';
import { UserRepository } from '../users/user.repository';

// 3. Import Appointment Repositories (Split Files)
import { DentistScheduleRepository } from './appointment-dentist-schedule.repository';
import { DentistTimeOffRepository } from './appointment-dentist-time-off.repository';
import { RecurringAppointmentRepository } from './appointment-recurring.repository';
import { AppointmentWaitlistRepository } from './appointment-waiting-list.repository';
import { AppointmentRepository } from './appointment.repository';

// 4. Import Validation Schemas
import {
  availabilitySlotsSchema,
  cancelAppointmentSchema,
  createAppointmentSchema,
  createRecurringAppointmentSchema,
  createWaitlistEntrySchema,
  getAppointmentSchema,
  listAppointmentsSchema,
  monthAvailabilitySchema,
  updateAppointmentSchema,
} from './appointment.validation';

const router = Router();

// ---------------------------------------------------------
// 🏗️ MANUAL WIRING (Dependency Injection)
// ---------------------------------------------------------

// A. Create Repositories
const appointmentRepo = new AppointmentRepository();
const scheduleRepo = new DentistScheduleRepository();
const timeOffRepo = new DentistTimeOffRepository();
const recurringRepo = new RecurringAppointmentRepository();
const waitlistRepo = new AppointmentWaitlistRepository();

// External Repos
const patientRepo = new PatientRepository();
const userRepo = new UserRepository();
const auditRepo = new AuditRepository();

// B. Create Services (Injecting Dependencies)
// Explicitly inject AuditRepo into AuditService
const auditService = new AuditService(auditRepo); 

// Explicitly inject ALL repos into AppointmentService
const appointmentService = new AppointmentService(
  appointmentRepo,
  scheduleRepo,
  timeOffRepo,
  recurringRepo,
  waitlistRepo,
  patientRepo,
  userRepo,
  auditService
);

// C. Create Controller
const appointmentController = new AppointmentController(appointmentService);

// ---------------------------------------------------------
// 🟢 ROUTES
// ---------------------------------------------------------

router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/v1/appointments
 */
router.post(
  '/',
  authMiddleware.requirePermission('appointments.create'),
  validate(createAppointmentSchema),
  (req, res, next) => appointmentController.createAppointment(req, res, next)
);

/**
 * @route   GET /api/v1/appointments
 */
router.get(
  '/',
  authMiddleware.requirePermission('appointments.read'),
  validate(listAppointmentsSchema),
  (req, res, next) => appointmentController.listAppointments(req, res, next)
);

/**
 * @route   GET /api/v1/appointments/statistics
 */
router.get(
  '/statistics',
  authMiddleware.requirePermission('appointments.read'),
  (req, res, next) => appointmentController.getAppointmentStatistics(req, res, next)
);

/**
 * @route   POST /api/v1/appointments/availability
 */
router.post(
  '/availability',
  authMiddleware.requirePermission('appointments.read'),
  validate(availabilitySlotsSchema),
  (req, res, next) => appointmentController.getAvailableSlots(req, res, next)
);

/**
 * @route   POST /api/v1/appointments/recurring
 */
router.post(
  '/recurring',
  authMiddleware.requirePermission('appointments.create'),
  validate(createRecurringAppointmentSchema),
  (req, res, next) => appointmentController.createRecurringAppointments(req, res, next)
);

/**
 * @route   POST /api/v1/appointments/waitlist
 */
router.post(
  '/waitlist',
  authMiddleware.requirePermission('appointments.create'),
  validate(createWaitlistEntrySchema),
  (req, res, next) => appointmentController.addToWaitlist(req, res, next)
);

/**
 * @route   GET /api/v1/appointments/availability/month
 * @desc    Get availability summary for a specific month
 */
router.get(
  '/availability/month',
  authMiddleware.requirePermission('appointments.read'),
  validate(monthAvailabilitySchema),
  (req, res, next) => appointmentController.getMonthAvailability(req, res, next)
);

/**
 * @route   GET /api/v1/appointments/:id
 */
router.get(
  '/:id',
  authMiddleware.requirePermission('appointments.read'),
  validate(getAppointmentSchema),
  (req, res, next) => appointmentController.getAppointmentById(req, res, next)
);

/**
 * @route   PUT /api/v1/appointments/:id
 */
router.put(
  '/:id',
  authMiddleware.requirePermission('appointments.update'),
  validate(updateAppointmentSchema),
  (req, res, next) => appointmentController.updateAppointment(req, res, next)
);

/**
 * @route   POST /api/v1/appointments/:id/cancel
 */
router.post(
  '/:id/cancel',
  authMiddleware.requirePermission('appointments.cancel'),
  validate(cancelAppointmentSchema),
  (req, res, next) => appointmentController.cancelAppointment(req, res, next)
);

/**
 * @route   POST /api/v1/appointments/:id/check-in
 */
router.post(
  '/:id/check-in',
  authMiddleware.requirePermission('appointments.update'),
  validate(getAppointmentSchema),
  (req, res, next) => appointmentController.checkIn(req, res, next)
);

/**
 * @route   POST /api/v1/appointments/:id/complete
 */
router.post(
  '/:id/complete',
  authMiddleware.requirePermission('appointments.update'),
  validate(getAppointmentSchema),
  (req, res, next) => appointmentController.complete(req, res, next)
);

/**
 * @route   POST /api/v1/appointments/:id/no-show
 */
router.post(
  '/:id/no-show',
  authMiddleware.requirePermission('appointments.update'),
  validate(getAppointmentSchema),
  (req, res, next) => appointmentController.markNoShow(req, res, next)
);

export const appointmentRoutes = router;
