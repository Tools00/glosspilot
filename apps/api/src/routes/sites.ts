import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  createSiteSchema,
  siteListQuerySchema,
  updateSiteSchema,
} from "@glosspilot/shared";
import { db } from "../db/client.js";
import { materials, sites, tasks } from "../db/schema.js";
import { requireAuth, requireRole } from "../rbac/index.js";
import { audit } from "../lib/audit.js";

const idParam = z.object({ id: z.coerce.number().int().positive() });

export async function siteRoutes(app: FastifyInstance): Promise<void> {
  // ─── GET /sites ─────────────────────────────────────────────────────────────
  app.get(
    "/sites",
    {
      preHandler: requireAuth,
      schema: { querystring: siteListQuerySchema },
    },
    async (req) => {
      const q = req.query as z.infer<typeof siteListQuerySchema>;
      const offset = (q.page - 1) * q.pageSize;
      const whereClause = q.status ? eq(sites.status, q.status) : undefined;

      const [rows, totalRows] = await Promise.all([
        db
          .select()
          .from(sites)
          .where(whereClause)
          .orderBy(desc(sites.updatedAt))
          .limit(q.pageSize)
          .offset(offset),
        db
          .select({ c: sql<number>`count(*)::int` })
          .from(sites)
          .where(whereClause),
      ]);

      return {
        items: rows,
        page: q.page,
        pageSize: q.pageSize,
        total: totalRows[0]?.c ?? 0,
      };
    },
  );

  // ─── GET /sites/:id ─────────────────────────────────────────────────────────
  app.get(
    "/sites/:id",
    {
      preHandler: requireAuth,
      schema: { params: idParam },
    },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const siteRows = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
      const site = siteRows[0];
      if (!site) return reply.code(404).send({ error: "Site not found" });

      const [taskRows, materialRows] = await Promise.all([
        db
          .select()
          .from(tasks)
          .where(eq(tasks.siteId, id))
          .orderBy(asc(tasks.position), asc(tasks.id)),
        db
          .select()
          .from(materials)
          .where(eq(materials.siteId, id))
          .orderBy(asc(materials.id)),
      ]);

      return { ...site, tasks: taskRows, materials: materialRows };
    },
  );

  // ─── POST /sites (ADMIN) ────────────────────────────────────────────────────
  app.post(
    "/sites",
    {
      preHandler: [requireAuth, requireRole("ADMIN")],
      schema: { body: createSiteSchema },
    },
    async (req, reply) => {
      const body = req.body as z.infer<typeof createSiteSchema>;
      const userId = req.session!.user.id;

      const created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(sites)
          .values({
            clientName: body.clientName,
            address: body.address,
            lat: body.lat ?? null,
            lng: body.lng ?? null,
            color: body.color,
            status: body.status,
            totalUnits: body.totalUnits,
            doneUnits: 0,
            startDate: body.startDate ?? null,
            endDate: body.endDate ?? null,
            createdBy: userId,
          })
          .returning();
        if (!row) throw new Error("Failed to insert site");

        if (body.tasks.length > 0) {
          await tx.insert(tasks).values(
            body.tasks.map((t) => ({
              siteId: row.id,
              name: t.name,
              unit: t.unit,
              total: t.total,
              done: 0,
              position: t.position,
            })),
          );
        }
        if (body.materials.length > 0) {
          await tx.insert(materials).values(
            body.materials.map((m) => ({
              siteId: row.id,
              name: m.name,
              variant: m.variant ?? null,
              neededQty: m.neededQty,
              takenQty: 0,
              perUnit: m.perUnit,
            })),
          );
        }
        return row;
      });

      await audit({
        userId,
        action: "create",
        entity: "site",
        entityId: created.id,
        payload: {
          clientName: created.clientName,
          taskCount: body.tasks.length,
          materialCount: body.materials.length,
        },
      });

      return reply.code(201).send(created);
    },
  );

  // ─── PATCH /sites/:id (ADMIN) ───────────────────────────────────────────────
  app.patch(
    "/sites/:id",
    {
      preHandler: [requireAuth, requireRole("ADMIN")],
      schema: { params: idParam, body: updateSiteSchema },
    },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const body = req.body as z.infer<typeof updateSiteSchema>;
      const userId = req.session!.user.id;

      const existing = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
      if (!existing[0]) return reply.code(404).send({ error: "Site not found" });

      const [updated] = await db
        .update(sites)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(sites.id, id))
        .returning();

      await audit({
        userId,
        action: "update",
        entity: "site",
        entityId: id,
        payload: body as Record<string, unknown>,
      });

      return updated;
    },
  );

  // ─── DELETE /sites/:id (ADMIN — archive, not hard-delete) ───────────────────
  app.delete(
    "/sites/:id",
    {
      preHandler: [requireAuth, requireRole("ADMIN")],
      schema: { params: idParam },
    },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const userId = req.session!.user.id;

      const existing = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
      if (!existing[0]) return reply.code(404).send({ error: "Site not found" });

      await db
        .update(sites)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(sites.id, id));

      await audit({
        userId,
        action: "archive",
        entity: "site",
        entityId: id,
        payload: { previousStatus: existing[0].status },
      });

      return { ok: true, id, status: "archived" as const };
    },
  );
}
