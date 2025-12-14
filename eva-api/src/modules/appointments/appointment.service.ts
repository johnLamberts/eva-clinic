import { Service } from "decorator/service.decorator";
import { Transaction } from "~/orm/transaction.orm";
import { AppError } from "~/utils/app-error.utils";
import AuditService from "../audit/audit.service";
import { PatientRepository } from "../patients/patient.repository";
import { UserRepository } from "../users/user.repository"; // Fixed import path
import { RequestContext } from "../users/user.type";
import { DentistScheduleRepository } from "./appointment-dentist-schedule.repository";
import { DentistTimeOffRepository } from "./appointment-dentist-time-off.repository";
import { RecurringAppointmentRepository } from "./appointment-recurring.repository";
import { AppointmentWaitlistRepository } from "./appointment-waiting-list.repository";
import { AppointmentRepository } from "./appointment.repository";
import {
  Appointment,
  AppointmentResponse,
  AppointmentStatistics,
  AvailabilityRequest,
  CreateAppointmentDto,
  CreateRecurringAppointmentDto,
  CreateWaitlistEntryDto,
  TimeSlot,
  UpdateAppointmentDto
} from "./appointment.types";

@Service()
export class AppointmentService {

  
  constructor (
    private appointmentRepo: AppointmentRepository,
    private dentistScheduleRepo: DentistScheduleRepository,
    private timeOffRepo: DentistTimeOffRepository,
    private recurringRepo: RecurringAppointmentRepository,
    private waitlistRepo: AppointmentWaitlistRepository,
    private patientRepo: PatientRepository,
    private userRepo: UserRepository,
    private auditService: AuditService
  ) { 
  }

  // ---------------------------------------------------------
  // 🟢 CREATE APPOINTMENT
  // ---------------------------------------------------------
  async createAppointment(
    createDto: CreateAppointmentDto,
    context: RequestContext
  ): Promise<AppointmentResponse> {
    this.checkPermission(context, 'appointments.create');

    // 1. Validations
    const patient = await this.patientRepo.findById(createDto.patient_id);
    if (!patient) throw new AppError('Patient not found', 404);

    const dentist = await this.userRepo.findById(createDto.dentist_id);
    if (!dentist) throw new AppError('Dentist not found', 404);

    // Validate date (No past appointments)
    const appointmentDate = new Date(createDto.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      throw new AppError('Cannot create appointments in the past', 400);
    }

    // Calculate end time
    const endTime = this.calculateEndTime(createDto.start_time, createDto.duration);

    // Check conflicts
    await this.validateNoConflicts(
      createDto.dentist_id,
      createDto.appointment_date,
      createDto.start_time,
      endTime
    );

    // Check availability
    await this.validateDentistAvailability(
      createDto.dentist_id,
      createDto.appointment_date,
      createDto.start_time,
      endTime
    );

    return Transaction.transaction(async () => {
      // Generate Number
      const appointmentNumber = await this.appointmentRepo.generateAppointmentNumber();

      // Create
      const created: any = await this.appointmentRepo.create({
        ...createDto,
        appointment_number: appointmentNumber,
        end_time: endTime,
        status: 'scheduled',
        reminder_sent: false,
        confirmation_sent: false,
        created_by: context.userId,
      } as any);

      // 🟢 FIX: Capture ID safely
      let newId = created.id;
      if (!newId && created.insertId) newId = created.insertId;
      if (!newId) throw new AppError("Database failed to return Appointment ID", 500);

      // Audit
      await this.logAudit(context, 'create', 'appointments', newId, {
        appointment_number: appointmentNumber,
        patient_id: createDto.patient_id,
        date: createDto.appointment_date,
      });

      // 🟢 FIX: Manual Response Construction
      // We do NOT fetch from DB here to avoid 404 errors due to transaction isolation.
      return {
        id: newId,
        ...createDto,
        appointment_number: appointmentNumber,
        end_time: endTime,
        status: 'scheduled',
        patient_name: `${patient.first_name} ${patient.last_name}`,
        dentist_name: `${dentist.first_name} ${dentist.last_name}`,
        patient_phone: patient.phone || '',
        can_cancel: true,
        can_reschedule: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as unknown as AppointmentResponse;
    });
  }


 // ---------------------------------------------------------
  // 🗓️ MONTHLY AVAILABILITY (Fixed Type Errors)
  // ---------------------------------------------------------
  async getMonthAvailability(dentistId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); 

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const [weeklySchedule, timeOffs, appointments] = await Promise.all([
      this.dentistScheduleRepo.findAllByDentist(dentistId),
      this.timeOffRepo.findInRange(dentistId, startStr, endStr),
      this.appointmentRepo.findInRange(dentistId, startStr, endStr)
    ]);

    const result = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const dailySchedule = weeklySchedule.find(s => s.day_of_week.toLowerCase() === dayName.toLowerCase());

      // 🟢 FIX 1: Cast to (any) to allow 'instanceof Date' check
      const isDayOff = timeOffs.some(t => {
        const start = (t.start_date as any) instanceof Date 
          ? (t.start_date as any).toISOString().split('T')[0] 
          : t.start_date;
        
        const end = (t.end_date as any) instanceof Date 
          ? (t.end_date as any).toISOString().split('T')[0] 
          : t.end_date;
          
        return dateStr >= start && dateStr <= end;
      });

      if (!dailySchedule || isDayOff) {
        result.push({ 
          date: dateStr, 
          status: 'unavailable', 
          day: dayName, 
          reason: isDayOff ? 'Dentist on leave' : 'Not working day' 
        });
        continue;
      }

      const [sH, sM] = dailySchedule.start_time.split(':').map(Number);
      const [eH, eM] = dailySchedule.end_time.split(':').map(Number);
      const totalWorkMinutes = (eH * 60 + eM) - (sH * 60 + sM);

      const dayAppointments = appointments.filter(a => {
        // 🟢 FIX 2: Cast to (any) here as well
        const aDate = (a.appointment_date as any) instanceof Date 
          ? (a.appointment_date as any).toISOString().split('T')[0] 
          : a.appointment_date;
        return aDate === dateStr;
      });
      
      const bookedMinutes = dayAppointments.reduce((sum, app) => sum + app.duration, 0);
      const remainingMinutes = totalWorkMinutes - bookedMinutes;

      if (remainingMinutes < 15) {
        result.push({ date: dateStr, status: 'full', day: dayName, booked_percentage: 100 });
        continue;
      }

      result.push({ 
        date: dateStr, 
        status: 'available', 
        day: dayName,
        remaining_minutes: remainingMinutes,
        booked_percentage: Math.round((bookedMinutes / totalWorkMinutes) * 100)
      });
    }

    return result;
  }

  // ---------------------------------------------------------
  // 🟡 UPDATE APPOINTMENT
  // ---------------------------------------------------------
  async updateAppointment(
    appointmentId: number,
    updateDto: UpdateAppointmentDto,
    context: RequestContext
  ): Promise<AppointmentResponse> {
    this.checkPermission(context, 'appointments.update');

    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new AppError('Appointment not found', 404);

    if (['cancelled', 'completed'].includes(appointment.status)) {
      throw new AppError(`Cannot update ${appointment.status} appointments`, 400);
    }

    const finalUpdateData: any = { ...updateDto };

    // Handle Rescheduling
    if (updateDto.appointment_date || updateDto.start_time || updateDto.duration) {
      const date = updateDto.appointment_date || appointment.appointment_date;
      const startTime = updateDto.start_time || appointment.start_time;
      const duration = updateDto.duration || appointment.duration;
      const endTime = this.calculateEndTime(startTime, duration);
      const dentistId = updateDto.dentist_id || appointment.dentist_id;

      await this.validateNoConflicts(dentistId, date, startTime, endTime, appointmentId);
      await this.validateDentistAvailability(dentistId, date, startTime, endTime);

      finalUpdateData.end_time = endTime;
    }

    await this.appointmentRepo.update(appointmentId, finalUpdateData, context.userId);

    await this.logAudit(context, 'update', 'appointments', appointmentId, updateDto, { 
      status: appointment.status 
    });

    // For updates, it's safer to fetch fresh data as the transaction context is usually simpler here
    const updated = await this.appointmentRepo.findById(appointmentId);
    return this.mapToAppointmentResponse(updated!);
  }

  // ---------------------------------------------------------
  // 🔵 READ METHODS (List & Get By ID)
  // ---------------------------------------------------------
  async listAppointments(context: RequestContext): Promise<AppointmentResponse[]> {
    this.checkPermission(context, 'appointments.read');
    // Note: You should pass query params (filters) here in a real scenario
    const appointments = await this.appointmentRepo.findAll(); 
    return Promise.all(appointments.map(apt => this.mapToAppointmentResponse(apt)));
  }

  async getAppointmentById(id: number, context: RequestContext): Promise<AppointmentResponse> {
    this.checkPermission(context, 'appointments.read');
    const appointment = await this.appointmentRepo.findById(id);
    if (!appointment) throw new AppError('Appointment not found', 404);
    return this.mapToAppointmentResponse(appointment);
  }

  // ---------------------------------------------------------
  // 🔴 CANCEL APPOINTMENT
  // ---------------------------------------------------------
  async cancelAppointment(
    appointmentId: number,
    reason: string,
    context: RequestContext
  ): Promise<void> {
    this.checkPermission(context, 'appointments.cancel');

    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new AppError('Appointment not found', 404);

    if (appointment.status === 'cancelled') {
      throw new AppError('Appointment is already cancelled', 400);
    }

    await this.appointmentRepo.update(appointmentId, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: context.userId,
      cancellation_reason: reason,
    } as any, context.userId);

    await this.logAudit(context, 'cancel', 'appointments', appointmentId, { reason });
  }

  // ---------------------------------------------------------
  // 🗓️ AVAILABILITY & SLOTS
  // ---------------------------------------------------------
  async getAvailableSlots(request: AvailabilityRequest): Promise<TimeSlot[]> {
    const { dentist_id, date, duration } = request;

    const dayOfWeek = this.getDayOfWeek(date);
    const schedule = await this.dentistScheduleRepo.findByDentistAndDay(dentist_id, dayOfWeek);

    // Dentist not working this day OR not active
    if (!schedule || !schedule.is_active) return [];

    // Dentist on leave
    const timeOff = await this.timeOffRepo.findConflicting(dentist_id, date);
    if (timeOff) return [];

    const existingAppointments = await this.appointmentRepo.findByDentist(dentist_id, date);

    // Generate Slots
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = schedule.end_time.split(':').map(Number);

    let currentTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    while (currentTimeMinutes + duration <= endTimeMinutes) {
      const slotStart = this.minutesToTime(currentTimeMinutes);
      const slotEnd = this.minutesToTime(currentTimeMinutes + duration);

      // Check Breaks
      const isBreak = schedule.break_start_time && schedule.break_end_time &&
        this.hasTimeOverlap(slotStart, slotEnd, schedule.break_start_time, schedule.break_end_time);

      if (!isBreak) {
        // Check Appointments
        const conflict = existingAppointments.find(apt =>
          apt.status !== 'cancelled' &&
          apt.status !== 'no_show' &&
          this.hasTimeOverlap(slotStart, slotEnd, apt.start_time, apt.end_time)
        );

        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          available: !conflict,
          conflicting_appointment_id: conflict?.id,
        });
      }

      currentTimeMinutes += 30; // 30 min intervals
    }

    return slots;
  }

  // ---------------------------------------------------------
  // 🔄 RECURRING APPOINTMENTS
  // ---------------------------------------------------------
  async createRecurringAppointments(
    createDto: CreateRecurringAppointmentDto,
    context: RequestContext
  ): Promise<{ created: number; failed: number; errors: string[] }> {
    this.checkPermission(context, 'appointments.create');

    // Save Pattern
    await this.recurringRepo.create({
      ...createDto,
      is_active: true,
      created_by: context.userId,
    } as any);

    const dates = this.generateRecurringDates(createDto);
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    // Try creating individual appointments
    for (const dateStr of dates) {
      try {
        await this.createAppointment({
          patient_id: createDto.patient_id,
          dentist_id: createDto.dentist_id,
          appointment_date: dateStr,
          start_time: createDto.start_time,
          duration: createDto.duration,
          appointment_type: createDto.appointment_type,
          reason: createDto.reason,
        }, context);
        created++;
      } catch (error: any) {
        failed++;
        errors.push(`${dateStr}: ${error.message}`);
      }
    }

    return { created, failed, errors };
  }

  // ---------------------------------------------------------
  // ⏳ WAITLIST
  // ---------------------------------------------------------
  async addToWaitlist(
    createDto: CreateWaitlistEntryDto,
    context: RequestContext
  ): Promise<any> {
    this.checkPermission(context, 'appointments.create');

    // Calculate Expiry (30 days from now)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const mysqlDateString = expires.toISOString().slice(0, 19).replace('T', ' ');

    const waitlistId = await this.waitlistRepo.create({
      ...createDto,
      priority: createDto.priority || 'medium',
      status: 'waiting',
      expires_at: mysqlDateString,
    } as any);

    // Capture ID logic
    let newId = waitlistId.id;
    if (!newId && (waitlistId as any).insertId) newId = (waitlistId as any).insertId;

    return this.waitlistRepo.findById(newId!);
  }

  // ---------------------------------------------------------
  // 📊 STATISTICS
  // ---------------------------------------------------------
  async getAppointmentStatistics(context: RequestContext): Promise<AppointmentStatistics> {
    this.checkPermission(context, 'appointments.read');

    const allAppointments = await this.appointmentRepo.findAll(false); 

    const stats: AppointmentStatistics = {
      total: allAppointments.length,
      scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0,
      by_type: {}, by_dentist: {}, avg_duration: 0, completion_rate: 0,
    };

    let totalDuration = 0;

    for (const a of allAppointments) {
      // Counts
      if (a.status === 'scheduled') stats.scheduled++;
      if (a.status === 'confirmed') stats.confirmed++;
      if (a.status === 'completed') stats.completed++;
      if (a.status === 'cancelled') stats.cancelled++;
      if (a.status === 'no_show') stats.no_show++;

      // Groups
      stats.by_type[a.appointment_type] = (stats.by_type[a.appointment_type] || 0) + 1;
      stats.by_dentist[a.dentist_id] = (stats.by_dentist[a.dentist_id] || 0) + 1;
      
      totalDuration += a.duration;
    }

    stats.avg_duration = allAppointments.length ? Math.round(totalDuration / allAppointments.length) : 0;
    
    const validCount = stats.completed + stats.scheduled + stats.confirmed;
    stats.completion_rate = validCount > 0 
      ? Math.round((stats.completed / validCount) * 100) 
      : 0;

    return stats;
  }

  // =========================================================
  // 🛠️ HELPERS
  // =========================================================

  private checkPermission(ctx: RequestContext, permission: string) {
    if (!ctx.permissions.includes(permission)) {
      throw new AppError(`Permission denied: ${permission}`, 403);
    }
  }

  private async logAudit(ctx: RequestContext, action: string, type: string, id: number, newV?: any, oldV?: any) {
    this.auditService.log({
      user_id: ctx.userId,
      action,
      entity_type: type,
      entity_id: id,
      new_values: newV,
      old_values: oldV,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent
    });
  }

  private async validateNoConflicts(dentistId: number, date: string, start: string, end: string, excludeId?: number) {
    const conflicts = await this.appointmentRepo.findConflicting(dentistId, date, start, end, excludeId);
    if (conflicts.length > 0) {
      throw new AppError(`Dentist conflict: Appointment overlaps with another booking.`, 409);
    }
  }

  private async validateDentistAvailability(dentistId: number, date: string, start: string, end: string) {
    const dayOfWeek = this.getDayOfWeek(date);
    const schedule = await this.dentistScheduleRepo.findByDentistAndDay(dentistId, dayOfWeek);

    if (!schedule || !schedule.is_active) throw new AppError(`Dentist not working on ${dayOfWeek}s`, 400);
    
    // Simple string comparison for time (HH:MM:SS) works well
    if (start < schedule.start_time || end > schedule.end_time) {
      throw new AppError(`Time is outside working hours (${schedule.start_time} - ${schedule.end_time})`, 400);
    }

    const timeOff = await this.timeOffRepo.findConflicting(dentistId, date);
    if (timeOff) throw new AppError('Dentist is on leave', 400);
  }

  private calculateEndTime(start: string, duration: number): string {
    const [h, m] = start.split(':').map(Number);
    return this.minutesToTime(h * 60 + m + duration);
  }

  private minutesToTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  }

  // 🟢 CRITICAL FIX: Use getDay() (0-6) not getDate() (1-31)
  private getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new AppError(`Invalid Date: ${dateStr}`, 400);
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private hasTimeOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
    return s1 < e2 && e1 > s2;
  }

  private generateRecurringDates(dto: CreateRecurringAppointmentDto): string[] {
    const dates: string[] = [];
    const current = new Date(dto.start_date);

    // Default end date: 1 year from start if not provided
    const end = dto.end_date ? new Date(dto.end_date) : new Date(current.getTime() + 365 * 24 * 60 * 60 * 1000);
    const max = dto.max_occurrences || 52;

    while (current <= end && dates.length < max) {
      dates.push(current.toISOString().split('T')[0]);

      // Increment logic
      const interval = dto.recurrence_interval || 1;

      if (dto.recurrence_pattern === 'daily') {
        current.setDate(current.getDate() + interval);
      } else if (dto.recurrence_pattern === 'weekly') {
        current.setDate(current.getDate() + (7 * interval));
      } else if (dto.recurrence_pattern === 'biweekly') {
        current.setDate(current.getDate() + (14 * interval));
      } else if (dto.recurrence_pattern === 'monthly') {
        current.setMonth(current.getMonth() + interval);
      }
    }

    return dates;
  }

  private async mapToAppointmentResponse(apt: Appointment): Promise<AppointmentResponse> {
    const patient = await this.patientRepo.findById(apt.patient_id);
    const dentist = await this.userRepo.findById(apt.dentist_id);

    const aptDate = new Date(apt.appointment_date);
    const hoursDiff = (aptDate.getTime() - Date.now()) / (3600 * 1000);

    return {
      ...apt,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown patient',
      dentist_name: dentist ? `${dentist.first_name} ${dentist.last_name}` : 'Unknown dentist',
      patient_phone: patient?.phone || '',
      can_cancel: hoursDiff > 24 && apt.status !== 'cancelled',
      can_reschedule: hoursDiff > 24 && ['scheduled', 'confirmed'].includes(apt.status),
    } as unknown as AppointmentResponse;
  }
}
