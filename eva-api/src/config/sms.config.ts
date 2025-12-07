export const smsConfig = {
  enabled: process.env.SMS_ENABLED === 'true',
  provider: process.env.SMS_PROVIDER || 'twilio', // twilio, nexmo, etc.
  
  // Twilio
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
};
