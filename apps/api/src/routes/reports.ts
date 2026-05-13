import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  createReportSchema,
  reportListQuerySchema,
} from "@glosspilot/shared";
import { db } from "../db/client.js";
import { reports, sites, users } from "../db/schema.js";
import { requireAuth, requireRole } from "../rbac/index.js";
import { audit } from "../lib/audit.js";

const idParam = z.object({ id: z.coerce.number().int().positive() });

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  // ─── GET /reports ───────────────────────────────────────────────────────────
  app.get(
    "/reports",
    {
      preHandler: requireAuth,
      schema: { querystring: reportListQuerySchema },
    },
    async (req) => {
      const q = req.query as z.infer<typeof reportListQuerySchema>;
      const offset = (q.page - 1) * q.pageSize;

      const conds = [];
      if (q.siteId) conds.push(eq(reports.siteId, q.siteId));
      if (q.userId) conds.push(eq(reports.userId, q.userId));
      if (q.from) conds.push(gte(reports.reportedAt, new Date(`${q.from}T00:00:00Z`)));
      if (q.to) conds.push(lte(reports.reportedAt, new Date(`${q.to}T23:59:59Z`)));
      const whereClause = conds.length > 0 ? and(...conds) : undefined;

      const [rows, totalRows] = await Promise.all([
        db
          .select({
            id: reports.id,
            siteId: reports.siteId,
            userId: reports.userId,
            summary: reports.summary,
            reportedAt: reports.reportedAt,
            userName: users.name,
            userInitials: users.initials,
            userRole: users.role,
            siteClientName: sites.clientName,
            siteAddress: sites.address,
            siteColor: sites.color,
            siteStatus: sites.status,
          })
          .from(reports)
          .innerJoin(users, eq(users.id, reports.userId))
          .innerJoin(sites, eq(sites.id, reports.siteId))
          .where(whereClause)
          .orderBy(desc(reports.reportedAt))
          .limit(q.pageSize)
          .offset(offset),
        db
          .select({ c: sql<number>`count(*)::int` })
          .from(reports)
          .where(whereClause),
      ]);

      return {
        items: rows.map((r) => ({
          id: r.id,
          siteId: r.siteId,
          userId: r.userId,
          summary: r.summary,
          reportedAt: r.reportedAt,
          user: {
            id: r.userId,
            name: r.userName,
            initials: r.userInitials,
            role: r.userRole,
          },
          site: {
            id: r.siteId,
            clientName: r.siteClientName,
            address: r.siteAddress,
            color: r.siteColor,
            status: r.siteStatus,
          },
        })),
        page: q.page,
        pageSize: q.pageSize,
        total: totalRows[0]?.c ?? 0,
      };
    },
  );

  // ─── GET /reports/:id ───────────────────────────────────────────────────────
  app.get(
    "/reports/:id",
    { preHandler: requireAuth, schema: { params: idParam } },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const rows = await db
        .select({ report: reports, user: users, site: sites })
        .from(reports)
        .innerJoin(users, eq(users.id, reports.userId))
        .innerJoin(sites, eq(sites.id, reports.siteId))
        .where(eq(reports.id, id))
        .limit(1);
      const row = rows[0];
      if (!row) return reply.code(404).send({ error: "Report not found" });
      return {
        ...row.report,
        user: {
          id: row.user.id,
          name: row.user.name,
          initials: row.user.initials,
          role: row.user.role,
        },
        site: {
          id: row.site.id,
          clientName: row.site.clientName,
          address: row.site.address,
          color: row.site.color,
          status: row.site.status,
        },
      };
    },
  );

  // ─── POST /reports (any authed user) ────────────────────────────────────────
  app.post(
    "/reports",
    { preHandler: requireAuth, schema: { body: createReportSchema } },
    async (req, reply) => {
      const body = req.body as z.infer<typeof createReportSchema>;
      const userId = req.session!.user.id;

      const siteRow = await db.select().from(sites).where(eq(sites.id, body.siteId)).limit(1);
      if (!siteRow[0]) return reply.code(400).send({ error: "Site does not exist" });

      const [created] = await db
        .insert(reports)
        .values({ siteId: body.siteId, userId, summary: body.summary })
        .returning();
      if (!created) throw new Error("Failed to insert report");

      await audit({
        userId,
        action: "create",
        entity: "report",
        entityId: created.id,
        payload: { siteId: body.siteId },
      });

      return reply.code(201).send(created);
    },
  );

  // ─── DELETE /reports/:id (ADMIN) ────────────────────────────────────────────
  app.delete(
    "/reports/:id",
    {
      preHandler: [requireAuth, requireRole("ADMIN")],
      schema: { params: idParam },
    },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const userId = req.session!.user.id;

      const existing = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
      if (!existing[0]) return reply.code(404).send({ error: "Report not found" });

      await db.delete(reports).where(eq(reports.id, id));

      await audit({
        userId,
        action: "delete",
        entity: "report",
        entityId: id,
        payload: { siteId: existing[0].siteId, authorId: existing[0].userId },
      });

      return { ok: true, id };
    },
  );
}
