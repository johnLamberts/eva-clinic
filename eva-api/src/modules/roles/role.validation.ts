import { z } from 'zod';

const common = {
  id: z.string().regex(/^\d+$/, 'Invalid ID'),
  name: z.string().min(2).max(50).regex(/^[a-z_]+$/, 'Name must be lowercase with underscores'),
  display_name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.number().int().positive())
};

export const createRoleSchema = z.object({
  body: z.object({
    name: common.name,
    display_name: common.display_name,
    description: common.description,
    permission_ids: common.permissions.default([]),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({ id: common.id }),
  body: z.object({
    display_name: common.display_name.optional(),
    description: common.description,
    permission_ids: common.permissions.optional(),
  }),
});

export const assignRoleSchema = z.object({
  params: z.object({ userId: common.id }),
  body: z.object({
    role_id: z.number().int().positive(),
  }),
});
