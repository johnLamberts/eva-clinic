import { z } from 'zod';

const common = {
  // Use coerce to handle string IDs ("15") sent by mistake
  id: z.coerce.number().int().positive(),
  
  // Allow simple names (letters, numbers, underscores)
  name: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/, 'Name must be lowercase alphanumeric with underscores'),
  
  display_name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  
  // Use coerce here too! Handles ["1", "2"] as [1, 2]
  permissions: z.array(z.coerce.number().int().positive())
};

export const createRoleSchema = z.object({
  body: z.object({
    name: common.name,
    display_name: common.display_name,
    description: common.description,
    permission_ids: common.permissions.optional().default([]),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }), // Param is always a string
  body: z.object({
    display_name: common.display_name.optional(),
    description: common.description,
    permission_ids: common.permissions.optional(),
  }),
});

export const assignRoleSchema = z.object({
  params: z.object({ userId: z.string().regex(/^\d+$/) }),
  body: z.object({
    role_id: common.id,
  }),
});
