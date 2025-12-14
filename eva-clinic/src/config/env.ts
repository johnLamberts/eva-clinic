import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_API_TIMEOUT: z.string().transform(Number).default('30000'),
  VITE_APP_NAME: z.string().default('Dental Clinic MIS'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  VITE_ENABLE_ERROR_TRACKING: z.string().transform(val => val === 'true').default('false'),
});


const parseEnv = () => {
  try {
    return envSchema.parse(import.meta.env);
  }  catch (error) {
    console.error('Invalid environment variables', error)
    throw new Error('Invalid .env variables');
  }
}

export const env = parseEnv();

export const isDevelopment = env.VITE_APP_ENV === 'development';
export const isProduction = env.VITE_APP_ENV === 'production';
export const isStaging = env.VITE_APP_ENV === 'staging';
