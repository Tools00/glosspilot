import type { FastifyInstance } from "fastify";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { requireAuth } from "../rbac/index.js";

/**
 * Minimal users endpoint — public list for picker UIs (excludes password_hash).
 * Worker info isn't sensitive within a single-tenant deployment.
 */
export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get("/users", { preHandler: requireAuth }, async (_req) => {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        initials: users.initials,
        role: users.role,
      })
      .from(users)
      .orderBy(asc(users.name));
    return rows;
  });
}
