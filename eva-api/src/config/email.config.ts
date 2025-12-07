export const emailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASS || '',
  from: process.env.EMAIL_FROM || 'noreply@clinic.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Dental Clinic',
};
