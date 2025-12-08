/* eslint-disable no-useless-escape */
// src/modules/users/user.validation.ts
import { z } from 'zod';

export const createUserSchema = z.object({
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

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid user ID'),
  }),
  body: z.object({
    first_name: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name must not exceed 100 characters')
      .trim()
      .optional(),
    last_name: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(100, 'Last name must not exceed 100 characters')
      .trim()
      .optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
    role_id: z
      .number()
      .int('Role ID must be an integer')
      .positive('Role ID must be positive')
      .optional(),
    status: z
      .enum(['active', 'inactive', 'suspended', 'locked'])
      .optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid user ID'),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .optional()
      .default('10'),
    status: z
      .enum(['active', 'inactive', 'suspended', 'locked'])
      .optional(),
    role_id: z
      .string()
      .regex(/^\d+$/, 'Role ID must be a number')
      .transform(Number)
      .optional(),
    email_verified: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    search: z
      .string()
      .min(1, 'Search term must not be empty')
      .optional(),
  }),
});

export const bulkOperationSchema = z.object({
  body: z.object({
    user_ids: z
      .array(
        z.number().int().positive(),
        { required_error: 'User IDs are required' }
      )
      .min(1, 'At least one user ID is required')
      .max(100, 'Maximum 100 users can be processed at once'),
    action: z.enum(['activate', 'deactivate', 'suspend', 'delete'], {
      required_error: 'Action is required',
    }),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid user ID'),
  }),
  body: z.object({
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
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserInput = z.infer<typeof getUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
