import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, asc, eq, inArray, lte, gte, sql } from "drizzle-orm";
import {
  createEventSchema,
  eventRangeQuerySchema,
  updateEventSchema,
} from "@glosspilot/shared";
import { db } from "../db/client.js";
import { events, eventWorkers, sites, users } from "../db/schema.js";
import { requireAuth, requireRole } from "../rbac/index.js";
import { audit } from "../lib/audit.js";

const idParam = z.object({ id: z.coerce.number().int().positive() });

export async function eventRoutes(app: FastifyInstance): Promise<void> {
  // ─── GET /events?from&to[&userId] ───────────────────────────────────────────
  app.get(
    "/events",
    {
      preHandler: requireAuth,
      schema: { querystring: eventRangeQuerySchema },
    },
    async (req) => {
      const q = req.query as z.infer<typeof eventRangeQuerySchema>;

      // Overlap predicate: event.start <= range.to AND event.end >= range.from
      const overlap = and(lte(events.startDate, q.to), gte(events.endDate, q.from));

      const baseRows = q.userId
        ? await db
            .select({ event: events })
            .from(events)
            .innerJoin(eventWorkers, eq(eventWorkers.eventId, events.id))
            .where(and(overlap, eq(eventWorkers.userId, q.userId)))
            .orderBy(asc(events.startDate))
        : await db
            .select({ event: events })
            .from(events)
            .where(overlap)
            .orderBy(asc(events.startDate));

      const rows = baseRows.map((r) => r.event);
      if (rows.length === 0) return [];

      // Fetch workers for these events in one go
      const eventIds = rows.map((r) => r.id);
      const workerRows = await db
        .select({
          eventId: eventWorkers.eventId,
          userId: users.id,
          name: users.name,
          initials: users.initials,
          role: users.role,
        })
        .from(eventWorkers)
        .innerJoin(users, eq(users.id, eventWorkers.userId))
        .where(inArray(eventWorkers.eventId, eventIds));

      const workersByEvent = new Map<number, typeof workerRows>();
      for (const w of workerRows) {
        const list = workersByEvent.get(w.eventId) ?? [];
        list.push(w);
        workersByEvent.set(w.eventId, list);
      }

      return rows.map((e) => ({
        ...e,
        workers: (workersByEvent.get(e.id) ?? []).map(({ eventId: _, userId, ...rest }) => ({
          id: userId,
          ...rest,
        })),
      }));
    },
  );

  // ─── GET /events/:id ────────────────────────────────────────────────────────
  app.get(
    "/events/:id",
    { preHandler: requireAuth, schema: { params: idParam } },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const rows = await db
        .select({ event: events, site: sites })
        .from(events)
        .innerJoin(sites, eq(sites.id, events.siteId))
        .where(eq(events.id, id))
        .limit(1);
      const row = rows[0];
      if (!row) return reply.code(404).send({ error: "Event not found" });

      const workerRows = await db
        .select({
          id: users.id,
          name: users.name,
          initials: users.initials,
          role: users.role,
        })
        .from(eventWorkers)
        .innerJoin(users, eq(users.id, eventWorkers.userId))
        .where(eq(eventWorkers.eventId, id));

      return {
        ...row.event,
        site: {
          id: row.site.id,
          clientName: row.site.clientName,
          address: row.site.address,
          color: row.site.color,
          status: row.site.status,
        },
        workers: workerRows,
      };
    },
  );

  // ─── POST /events (ADMIN) ───────────────────────────────────────────────────
  app.post(
    "/events",
    {
      preHandler: [requireAuth, requireRole("ADMIN")],
      schema: { body: createEventSchema },
    },
    async (req, reply) => {
      const body = req.body as z.infer<typeof createEventSchema>;
      const userId = req.session!.user.id;

      // Ensure site exists; inherit its color if none given.
      const siteRow = await db.select().from(sites).where(eq(sites.id, body.siteId)).limit(1);
      if (!siteRow[0]) return reply.code(400).send({ error: "Site does not exist" });

      const color = body.color ?? siteRow[0].color;

      const created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(events)
          .values({
            siteId: body.siteId,
            title: body.title,
            note: body.note ?? null,
            startDate: body.startDate,
            endDate: body.endDate,
            color,
          })
          .returning();
        if (!row) throw new Error("Failed to insert event");

        if (body.workerIds.length > 0) {
          await tx
            .insert(eventWorkers)
            .values(body.workerIds.map((uid) => ({ eventId: row.id, userId: uid })));
        }
        return row;
      });

      await audit({
        userId,
        action: "create",
        entity: "event",
        entityId: created.id,
        payload: { siteId: body.siteId, workerCount: body.workerIds.length },
      });

      return reply.code(201).send(created);
    },
  );

  // ─── PATCH /events/:id (ADMIN) ──────────────────────────────────────────────
  app.patch(
    "/events/:id",
    {
      preHandler: [requireAuth, requireRole("ADMIN")],
      schema: { params: idParam, body: updateEventSchema },
    },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const body = req.body as z.infer<typeof updateEventSchema>;
      const userId = req.session!.user.id;

      const existing = await db.select().from(events).where(eq(events.id, id)).limit(1);
      if (!existing[0]) return reply.code(404).send({ error: "Event not found" });

      const updated = await db.transaction(async (tx) => {
        const updateData: Record<string, unknown> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.note !== undefined) updateData.note = body.note;
        if (body.startDate !== undefined) updateData.startDate = body.startDate;
        if (body.endDate !== undefined) updateData.endDate = body.endDate;
        if (body.color !== undefined) updateData.color = body.color;

        let row = existing[0]!;
        if (Object.keys(updateData).length > 0) {
          const [r] = await tx.update(events).set(updateData).where(eq(events.id, id)).returning();
          if (r) row = r;
        }

        if (body.workerIds !== undefined) {
          await tx.delete(eventWorkers).where(eq(eventWorkers.eventId, id));
          if (body.workerIds.length > 0) {
            await tx
              .insert(eventWorkers)
              .values(body.workerIds.map((uid) => ({ eventId: id, userId: uid })));
          }
        }
        return row;
      });

      await audit({
        userId,
        action: "update",
        entity: "event",
        entityId: id,
        payload: body as Record<string, unknown>,
      });

      return updated;
    },
  );

  // ─── DELETE /events/:id (ADMIN, hard-delete) ────────────────────────────────
  app.delete(
    "/events/:id",
    { preHandler: [requireAuth, requireRole("ADMIN")], schema: { params: idParam } },
    async (req, reply) => {
      const { id } = req.params as { id: number };
      const userId = req.session!.user.id;

      const existing = await db.select().from(events).where(eq(events.id, id)).limit(1);
      if (!existing[0]) return reply.code(404).send({ error: "Event not found" });

      await db.delete(events).where(eq(events.id, id)); // CASCADE removes event_workers

      await audit({
        userId,
        action: "delete",
        entity: "event",
        entityId: id,
        payload: { title: existing[0].title, siteId: existing[0].siteId },
      });

      return { ok: true, id };
    },
  );

  // ─── GET /me/today ──────────────────────────────────────────────────────────
  app.get("/me/today", { preHandler: requireAuth }, async (req) => {
    const userId = req.session!.user.id;
    const today = new Date().toISOString().slice(0, 10);

    const rows = await db
      .select({
        event: events,
        site: sites,
      })
      .from(eventWorkers)
      .innerJoin(events, eq(events.id, eventWorkers.eventId))
      .innerJoin(sites, eq(sites.id, events.siteId))
      .where(
        and(
          eq(eventWorkers.userId, userId),
          lte(events.startDate, today),
          gte(events.endDate, today),
        ),
      )
      .orderBy(asc(events.startDate));

    return rows.map((r) => ({
      ...r.event,
      site: {
        id: r.site.id,
        clientName: r.site.clientName,
        address: r.site.address,
        color: r.site.color,
        status: r.site.status,
      },
    }));
  });
}
