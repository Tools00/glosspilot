/**
 * Shared zod schemas + TS types. Imported by both API (validation) and web (forms).
 */
import { z } from "zod";

// ─── Roles ────────────────────────────────────────────────────────────────────

export const Role = { ADMIN: "ADMIN", WORKER: "WORKER" } as const;
export type Role = (typeof Role)[keyof typeof Role];

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ─── User (public shape — never returns password_hash) ────────────────────────

export const userPublicSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string(),
  initials: z.string(),
  role: z.enum(["ADMIN", "WORKER"]),
});
export type UserPublic = z.infer<typeof userPublicSchema>;

// ─── Sites + Tasks + Materials ────────────────────────────────────────────────

export const SiteStatus = {
  planned: "planned",
  active: "active",
  completed: "completed",
  archived: "archived",
} as const;
export type SiteStatus = (typeof SiteStatus)[keyof typeof SiteStatus];

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #2C5F2E");

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date YYYY-MM-DD");

export const taskInputSchema = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(16).default("unit"),
  total: z.number().int().min(0),
  position: z.number().int().min(0).default(0),
});
export type TaskInput = z.infer<typeof taskInputSchema>;

export const materialInputSchema = z.object({
  name: z.string().min(1).max(200),
  variant: z.string().max(80).optional().nullable(),
  neededQty: z.number().min(0),
  perUnit: z.number().min(0).default(0),
});
export type MaterialInput = z.infer<typeof materialInputSchema>;

export const createSiteSchema = z.object({
  clientName: z.string().min(1).max(200),
  address: z.string().min(1).max(300),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  color: hexColor.default("#6E5B8A"),
  status: z.enum(["planned", "active", "completed"]).default("planned"),
  totalUnits: z.number().int().min(0).default(0),
  startDate: dateStr.optional().nullable(),
  endDate: dateStr.optional().nullable(),
  tasks: z.array(taskInputSchema).default([]),
  materials: z.array(materialInputSchema).default([]),
});
export type CreateSiteInput = z.infer<typeof createSiteSchema>;

export const updateSiteSchema = z
  .object({
    clientName: z.string().min(1).max(200).optional(),
    address: z.string().min(1).max(300).optional(),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
    color: hexColor.optional(),
    status: z.enum(["planned", "active", "completed"]).optional(),
    totalUnits: z.number().int().min(0).optional(),
    doneUnits: z.number().int().min(0).optional(),
    startDate: dateStr.nullable().optional(),
    endDate: dateStr.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

export const siteListQuerySchema = z.object({
  status: z.enum(["planned", "active", "completed", "archived"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SiteListQuery = z.infer<typeof siteListQuerySchema>;

export const taskSchema = z.object({
  id: z.number().int().positive(),
  siteId: z.number().int().positive(),
  name: z.string(),
  unit: z.string(),
  total: z.number().int(),
  done: z.number().int(),
  position: z.number().int(),
});
export type Task = z.infer<typeof taskSchema>;

export const materialSchema = z.object({
  id: z.number().int().positive(),
  siteId: z.number().int().positive(),
  name: z.string(),
  variant: z.string().nullable(),
  neededQty: z.number(),
  takenQty: z.number(),
  perUnit: z.number(),
});
export type Material = z.infer<typeof materialSchema>;

export const siteSchema = z.object({
  id: z.number().int().positive(),
  clientName: z.string(),
  address: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  color: z.string(),
  status: z.enum(["planned", "active", "completed", "archived"]),
  totalUnits: z.number().int(),
  doneUnits: z.number().int(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdBy: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Site = z.infer<typeof siteSchema>;

export const siteWithChildrenSchema = siteSchema.extend({
  tasks: z.array(taskSchema),
  materials: z.array(materialSchema),
});
export type SiteWithChildren = z.infer<typeof siteWithChildrenSchema>;

// ─── Events (calendar) ────────────────────────────────────────────────────────

export const eventSchema = z.object({
  id: z.number().int().positive(),
  siteId: z.number().int().positive(),
  title: z.string(),
  note: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string(),
  createdAt: z.string(),
});
export type Event = z.infer<typeof eventSchema>;

export const eventWithWorkersSchema = eventSchema.extend({
  workers: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string(),
      initials: z.string(),
      role: z.enum(["ADMIN", "WORKER"]),
    }),
  ),
  site: z.object({
    id: z.number().int().positive(),
    clientName: z.string(),
    address: z.string(),
    color: z.string(),
    status: z.enum(["planned", "active", "completed", "archived"]),
  }),
});
export type EventWithWorkers = z.infer<typeof eventWithWorkersSchema>;

export const createEventSchema = z
  .object({
    siteId: z.number().int().positive(),
    title: z.string().min(1).max(200),
    note: z.string().max(2000).optional().nullable(),
    startDate: dateStr,
    endDate: dateStr,
    color: hexColor.optional(),
    workerIds: z.array(z.number().int().positive()).default([]),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    note: z.string().max(2000).nullable().optional(),
    startDate: dateStr.optional(),
    endDate: dateStr.optional(),
    color: hexColor.optional(),
    workerIds: z.array(z.number().int().positive()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const eventRangeQuerySchema = z
  .object({
    from: dateStr,
    to: dateStr,
    userId: z.coerce.number().int().positive().optional(),
  })
  .refine((v) => v.from <= v.to, {
    message: "to must be on or after from",
    path: ["to"],
  });
export type EventRangeQuery = z.infer<typeof eventRangeQuerySchema>;
