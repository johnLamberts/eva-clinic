import { Router } from 'express';
import authMiddleware from '~/middlewares/auth.middleware';
import { validate } from '~/middlewares/validation.middleware';

// 1. Import all classes (Controllers, Services, Repositories)
import { DentalRecordRepository } from './patient-dental-record.repository';
import { PatientDocumentRepository } from './patient-document.repository';
import { MedicalHistoryRepository } from './patient-medical-history.repository';
import { PatientNoteRepository } from './patient-notes.repository';
import { PatientController } from './patient.controller';
import { PatientRepository } from './patient.repository';
import { PatientService } from './patient.service';

// 2. Import Audit Dependencies
import { AuditRepository } from '../audit/audit.repository';
import AuditService from '../audit/audit.service';

// 3. Import Validation Schemas
import {
  createDentalRecordSchema,
  createMedicalHistorySchema,
  createPatientNoteSchema,
  createPatientSchema,
  getPatientSchema,
  listPatientsSchema,
  updatePatientSchema,
} from './patient.validation';

const router = Router();


const patientRepo = new PatientRepository();
const dentalRepo = new DentalRecordRepository();
const medicalRepo = new MedicalHistoryRepository();
const noteRepo = new PatientNoteRepository();
const docRepo = new PatientDocumentRepository();
const auditRepo = new AuditRepository(); // ✅ Created manually

const auditService = new AuditService(auditRepo); // ✅ Injected correctly

const patientService = new PatientService(
  patientRepo,
  medicalRepo,
  dentalRepo,
  docRepo,
  noteRepo,
  auditService 
);

const patientController = new PatientController(patientService);


// ---------------------------------------------------------

router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/v1/patients
 * @desc    Create new patient
 */
router.post(
  '/',
  authMiddleware.requirePermission('patients.create'),
  validate(createPatientSchema),
  (req, res, next) => patientController.createPatient(req, res, next)
);

/**
 * @route   GET /api/v1/patients
 * @desc    List all patients
 */
router.get(
  '/',
  authMiddleware.requirePermission('patients.read'),
  validate(listPatientsSchema),
  (req, res, next) => patientController.listPatients(req, res, next)
);

/**
 * @route   GET /api/v1/patients/search
 * @desc    Search patients
 */
router.get(
  '/search',
  authMiddleware.requirePermission('patients.read'),
  (req, res, next) => patientController.searchPatients(req, res, next)
);

/**
 * @route   GET /api/v1/patients/statistics
 * @desc    Get patient statistics
 */
router.get(
  '/statistics',
  authMiddleware.requirePermission('patients.read'),
  (req, res, next) => patientController.getPatientStatistics(req, res, next)
);

/**
 * @route   GET /api/v1/patients/export
 * @desc    Export patients
 */
router.get(
  '/export',
  authMiddleware.requirePermission('patients.read'),
  (req, res, next) => patientController.exportPatients(req, res, next)
);

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get patient by ID
 */
router.get(
  '/:id',
  authMiddleware.requirePermission('patients.read'),
  validate(getPatientSchema),
  (req, res, next) => patientController.getPatientById(req, res, next)
);

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    Update patient
 */
router.put(
  '/:id',
  authMiddleware.requirePermission('patients.update'),
  validate(updatePatientSchema),
  (req, res, next) => patientController.updatePatient(req, res, next)
);

/**
 * @route   DELETE /api/v1/patients/:id
 * @desc    Delete patient
 */
router.delete(
  '/:id',
  authMiddleware.requirePermission('patients.delete'),
  validate(getPatientSchema),
  (req, res, next) => patientController.deletePatient(req, res, next)
);

// 🦷 SUB-MODULES

router.post(
  '/dental-records',
  authMiddleware.requirePermission('patients.update'),
  validate(createDentalRecordSchema),
  (req, res, next) => patientController.createDentalRecord(req, res, next)
);

router.get(
  '/:id/dental-records',
  authMiddleware.requirePermission('patients.read'),
  validate(getPatientSchema),
  (req, res, next) => patientController.getDentalRecords(req, res, next)
);

router.post(
  '/medical-history',
  authMiddleware.requirePermission('patients.update'),
  validate(createMedicalHistorySchema),
  (req, res, next) => patientController.createMedicalHistory(req, res, next)
);

router.get(
  '/:id/medical-history',
  authMiddleware.requirePermission('patients.view_medical_history'),
  validate(getPatientSchema),
  (req, res, next) => patientController.getMedicalHistory(req, res, next)
);

router.post(
  '/notes',
  authMiddleware.requirePermission('patients.update'),
  validate(createPatientNoteSchema),
  (req, res, next) => patientController.createNote(req, res, next)
);

router.get(
  '/:id/notes',
  authMiddleware.requirePermission('patients.read'),
  validate(getPatientSchema),
  (req, res, next) => patientController.getNotes(req, res, next)
);

export const patientRoutes = router;
