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
