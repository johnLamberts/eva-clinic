/* eslint-disable no-useless-escape */
// src/modules/auth/auth.validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(1, 'Password is required'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'Password must contain at least one special character'
      ),
    first_name: z
      .string({
        required_error: 'First name is required',
      })
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name must not exceed 100 characters')
      .trim(),
    last_name: z
      .string({
        required_error: 'Last name is required',
      })
      .min(2, 'Last name must be at least 2 characters')
      .max(100, 'Last name must not exceed 100 characters')
      .trim(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
    role_id: z
      .number({
        required_error: 'Role ID is required',
      })
      .int('Role ID must be an integer')
      .positive('Role ID must be positive'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({
        required_error: 'Refresh token is required',
      })
      .min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z
      .string({
        required_error: 'Current password is required',
      })
      .min(1, 'Current password is required'),
    new_password: z
      .string({
        required_error: 'New password is required',
      })
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'Password must contain at least one special character'
      ),
    confirm_password: z
      .string({
        required_error: 'Password confirmation is required',
      })
      .min(1, 'Password confirmation is required'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
