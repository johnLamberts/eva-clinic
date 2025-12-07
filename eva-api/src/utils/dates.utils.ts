export class DateUtil {
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  static isDateInPast(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
  }

  static isDateInFuture(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d > new Date();
  }

  static getDaysBetween(start: Date | string, end: Date | string): number {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getAge(dateOfBirth: Date | string): number {
    const today = new Date();
    const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  static getStartOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    const result = new Date(d);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static getEndOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    const result = new Date(d);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  static getStartOfMonth(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  static getEndOfMonth(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  static isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }

  static getWeekNumber(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  static getDayName(date: Date | string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = typeof date === 'string' ? new Date(date) : date;
    return days[d.getDay()];
  }

  static getMonthName(date: Date | string): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const d = typeof date === 'string' ? new Date(date) : date;
    return months[d.getMonth()];
  }

  static parseTime(timeString: string): { hours: number; minutes: number; seconds: number } {
    const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
    return { hours, minutes, seconds };
  }

  static formatTime(hours: number, minutes: number, seconds: number = 0): string {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
