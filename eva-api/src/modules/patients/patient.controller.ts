import { Service } from "decorator/service.decorator";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "~/utils/api-response.utils";
import { AuthSecurity } from "../auth/auth.security";
import { RequestContext } from "../users/user.type";
import { PatientService } from "./patient.service";
import { CreateDentalRecordDto, CreateMedicalHistoryDto, CreatePatientDto, CreatePatientNoteDto, UpdatePatientDto } from "./patient.types";
import { ListPatientsInput } from "./patient.validation";

@Service()
export class PatientController {
  
  
  
  constructor(private patientService: PatientService) { }


  private getContext(req: Request): RequestContext {
    const user = req.user!;
    return {
      userId: user.userId,
      email: user.email || '',
      roleId: user.roleId || 0,
      permissions: user.permissions || [],
      ip: AuthSecurity.extractIP(req),
      userAgent: AuthSecurity.sanitizeUserAgent(req.headers['user-agent']),
    };
  }

  async createPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreatePatientDto = req.body;
      const result = await this.patientService.createPatient(dto, this.getContext(req));
      return ApiResponse.created(res, result, 'Patient created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdatePatientDto = req.body;
      const result = await this.patientService.updatePatient(id, dto, this.getContext(req));
      return ApiResponse.success(res, result, 'Patient updated successfully');
    } catch (error) {
      next(error);
    }
  }
  
  async deletePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await this.patientService.deletePatient(id, this.getContext(req));
      return ApiResponse.success(res, null, 'Patient deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPatientById(req: Request, res: Response, next: NextFunction)  {
    try {
      const id = parseInt(req.params.id);
      const result = await this.patientService.getPatientById(id, this.getContext(req));
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  searchPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm || searchTerm.length < 2) {
        return ApiResponse.created(res, null, 'Search term must be at least 2 characters');
      }
      const result = await this.patientService.searchPatients(searchTerm, this.getContext(req));
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  listPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Zod middleware already validated & transformed these types
      const query = req.query as unknown as ListPatientsInput['query'];

      const filters = {
        status: query.status,
        gender: query.gender,
        search: query.search,
        minAge: query.min_age, // Zod transformed 'min_age' -> Number
        maxAge: query.max_age,
      };

      const pagination = {
        page: query.page || 1,
        limit: query.limit || 10,
      };

      const result = await this.patientService.listPatients(filters as any, pagination, this.getContext(req));
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  getPatientStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.patientService.getPatientStatistics(this.getContext(req));
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  createDentalRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateDentalRecordDto = req.body;
      const result = await this.patientService.createDentalRecord(dto, this.getContext(req));
      return ApiResponse.created(res, result, 'Dental record created successfully');
    } catch (error) {
      next(error);
    }
  };

  getDentalRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.patientService.getDentalRecords(id, this.getContext(req));
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  createMedicalHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateMedicalHistoryDto = req.body;
      const result = await this.patientService.createMedicalHistory(dto, this.getContext(req));
      return ApiResponse.created(res, result, 'Medical history created successfully');
    } catch (error) {
      next(error);
    }
  };

  getMedicalHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.patientService.getMedicalHistory(id, this.getContext(req));
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  createNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreatePatientNoteDto = req.body;
      const result = await this.patientService.createNote(dto, this.getContext(req));
      return ApiResponse.created(res, result, 'Note created successfully');
    } catch (error) {
      next(error);
    }
  };

  getNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.patientService.getNotes(id, this.getContext(req));
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  // ---------------------------------------------------------
  // 📂 EXPORT
  // ---------------------------------------------------------
  
  exportPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Reuse logic from listPatients but with high limit
      const result = await this.patientService.listPatients({}, { page: 1, limit: 10000 }, this.getContext(req));

      const csvHeader = 'Patient Number,Name,Age,Gender,Phone,Email,Status,Total Visits,Last Visit\n';
      const csvRows = result.data.map(p =>
        `${p.patient_number},"${p.full_name}",${p.age},${p.gender},${p.phone},${p.email || ''},${p.status},${p.total_visits},${p.last_visit_date || ''}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
      res.send(csvHeader + csvRows);
    } catch (error) {
      next(error);
    }
  };
}
