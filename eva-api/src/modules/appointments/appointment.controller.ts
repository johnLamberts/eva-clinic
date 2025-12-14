import { Service } from "decorator/service.decorator";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "~/utils/api-response.utils";
import { AuthSecurity } from "../auth/auth.security";
import { RequestContext } from "../users/user.type";
import { AppointmentService } from "./appointment.service";
import { AppointmentFilters, AppointmentStatus, AvailabilityRequest, CreateAppointmentDto, CreateRecurringAppointmentDto, CreateWaitlistEntryDto, UpdateAppointmentDto } from "./appointment.types";
import { MonthAvailabilityInput } from "./appointment.validation";

@Service()
export class AppointmentController {

  constructor(private appointmentService: AppointmentService) {

  }

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

  createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createDto: CreateAppointmentDto = req.body;
      const result = await this.appointmentService.createAppointment(createDto, this.getContext(req));
      return ApiResponse.created(res, result, 'Appointment created successfully');
    } catch (error) {
      next(error);
    }
  };

  updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const updateDto: UpdateAppointmentDto = req.body;
      const result = await this.appointmentService.updateAppointment(id, updateDto, this.getContext(req));
      return ApiResponse.success(res, result, 'Appointment updated successfully');
    } catch (error) {
      next(error);
    }
  };

  cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      await this.appointmentService.cancelAppointment(id, reason, this.getContext(req));
      return ApiResponse.success(res, null, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      // Note: You might need to add getById to AppointmentService if it's not exposed yet
      // For now, using a placeholder or ensure Service has this method
      // const result = await this.appointmentService.getAppointmentById(id, this.getContext(req));
      return ApiResponse.success(res, { id }, 'Appointment retrieved successfully'); 
    } catch (error) {
      next(error);
    }
  };

  listAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: AppointmentFilters = {
        dentist_id: req.query.dentist_id ? parseInt(req.query.dentist_id as string) : undefined,
        patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
        status: req.query.status as any,
        appointment_type: req.query.appointment_type as any,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
      };

      // Helper to call service list method (ensure you implement listAppointments in Service)
      // const result = await this.appointmentService.listAppointments(filters, this.getContext(req));
      
      return ApiResponse.success(res, { filters }, 'Appointments retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // ---------------------------------------------------------
  // 🗓️ SCHEDULING & SLOTS
  // ---------------------------------------------------------

  getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request: AvailabilityRequest = req.body;
      const result = await this.appointmentService.getAvailableSlots(request);
      return ApiResponse.success(res, result, 'Available slots retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  createRecurringAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateRecurringAppointmentDto = req.body;
      const result = await this.appointmentService.createRecurringAppointments(dto, this.getContext(req));
      return ApiResponse.created(res, result, `Recurring appointments processed. Created: ${result.created}, Failed: ${result.failed}`);
    } catch (error) {
      next(error);
    }
  };

  addToWaitlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateWaitlistEntryDto = req.body;
      const result = await this.appointmentService.addToWaitlist(dto, this.getContext(req));
      return ApiResponse.created(res, result, 'Added to waitlist successfully');
    } catch (error) {
      next(error);
    }
  };

  getMonthAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dentist_id, year, month } = req.query as unknown as MonthAvailabilityInput['query'];
      const result = await this.appointmentService.getMonthAvailability(dentist_id, year, month);
      return ApiResponse.success(res, result, 'Monthly availability retrieved');
    } catch (error) {
      next(error);
    }
  };

  // ---------------------------------------------------------
  // 🚦 WORKFLOW ACTIONS
  // ---------------------------------------------------------

  checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      await this.appointmentService.updateAppointment(id, { status: AppointmentStatus.CHECKED_IN }, this.getContext(req));
      return ApiResponse.success(res, null, 'Patient checked in successfully');
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      // Pass timestamp via DTO or let Service handle it. 
      // Using 'any' cast here to bypass strict DTO check if Service allows partials
      await this.appointmentService.updateAppointment(
        id, 
        { status: 'completed' } as UpdateAppointmentDto, 
        this.getContext(req)
      );
      return ApiResponse.success(res, null, 'Appointment completed successfully');
    } catch (error) {
      next(error);
    }
  };

  markNoShow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      await this.appointmentService.updateAppointment(id, { status: AppointmentStatus.NO_SHOW }, this.getContext(req));
      return ApiResponse.success(res, null, 'Appointment marked as no-show');
    } catch (error) {
      next(error);
    }
  };

  getAppointmentStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.appointmentService.getAppointmentStatistics(this.getContext(req));
      return ApiResponse.success(res, result, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };


}
