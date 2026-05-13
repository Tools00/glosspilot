import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  eventWorkers,
  events,
  materials,
  reports,
  sites,
  users,
} from "../db/schema.js";
import { requireAuth, requireRole } from "../rbac/index.js";

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/dashboard",
    { preHandler: [requireAuth, requireRole("ADMIN")] },
    async () => {
      const today = new Date().toISOString().slice(0, 10);
      const dayStart = new Date(`${today}T00:00:00Z`);
      const dayEnd = new Date(`${today}T23:59:59Z`);

      const [
        activeCount,
        plannedCount,
        todaysReportsCount,
        todaysEventsCount,
        lowStockRows,
        recentRows,
      ] = await Promise.all([
        db.select({ c: sql<number>`count(*)::int` }).from(sites).where(eq(sites.status, "active")),
        db.select({ c: sql<number>`count(*)::int` }).from(sites).where(eq(sites.status, "planned")),
        db
          .select({ c: sql<number>`count(*)::int` })
          .from(reports)
          .where(and(gte(reports.reportedAt, dayStart), lte(reports.reportedAt, dayEnd))),
        db
          .select({ c: sql<number>`count(*)::int` })
          .from(events)
          .where(and(lte(events.startDate, today), gte(events.endDate, today))),
        db
          .select({
            id: materials.id,
            name: materials.name,
            variant: materials.variant,
            neededQty: materials.neededQty,
            takenQty: materials.takenQty,
            remainingPct: sql<number>`((${materials.neededQty} - ${materials.takenQty}) / NULLIF(${materials.neededQty}, 0))::float`,
            siteId: sites.id,
            siteClientName: sites.clientName,
            siteColor: sites.color,
          })
          .from(materials)
          .innerJoin(sites, eq(sites.id, materials.siteId))
          .where(
            sql`${materials.neededQty} > 0 AND ((${materials.neededQty} - ${materials.takenQty}) / ${materials.neededQty}) < 0.2 AND ${sites.status} <> 'archived'`,
          )
          .orderBy(sql`((${materials.neededQty} - ${materials.takenQty}) / ${materials.neededQty}) ASC`)
          .limit(10),
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
          .orderBy(desc(reports.reportedAt))
          .limit(10),
      ]);

      return {
        activeSitesCount: activeCount[0]?.c ?? 0,
        plannedSitesCount: plannedCount[0]?.c ?? 0,
        todaysReportsCount: todaysReportsCount[0]?.c ?? 0,
        todaysActiveEvents: todaysEventsCount[0]?.c ?? 0,
        lowStockMaterials: lowStockRows.map((m) => ({
          id: m.id,
          name: m.name,
          variant: m.variant,
          neededQty: m.neededQty,
          takenQty: m.takenQty,
          remainingPct: m.remainingPct,
          site: { id: m.siteId, clientName: m.siteClientName, color: m.siteColor },
        })),
        recentReports: recentRows.map((r) => ({
          id: r.id,
          siteId: r.siteId,
          userId: r.userId,
          summary: r.summary,
          reportedAt: r.reportedAt,
          user: { id: r.userId, name: r.userName, initials: r.userInitials, role: r.userRole },
          site: {
            id: r.siteId,
            clientName: r.siteClientName,
            address: r.siteAddress,
            color: r.siteColor,
            status: r.siteStatus,
          },
        })),
      };
    },
  );
}
