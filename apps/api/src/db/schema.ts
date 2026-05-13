/**
 * Drizzle schema — mirrors ADR 003 exactly.
 * Any change here must be reflected in `docs/adr/003-schema.md`.
 */
import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  date,
  timestamp,
  doublePrecision,
  real,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRole = pgEnum("user_role", ["ADMIN", "WORKER"]);
export const siteStatus = pgEnum("site_status", [
  "planned",
  "active",
  "completed",
  "archived",
]);

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    initials: varchar("initials", { length: 4 }).notNull(),
    role: userRole("role").notNull().default("WORKER"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailUk: uniqueIndex("users_email_uk").on(t.email),
  }),
);

// ─── sites ────────────────────────────────────────────────────────────────────

export const sites = pgTable(
  "sites",
  {
    id: serial("id").primaryKey(),
    clientName: varchar("client_name", { length: 200 }).notNull(),
    address: varchar("address", { length: 300 }).notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    color: varchar("color", { length: 16 }).notNull().default("#6E5B8A"),
    status: siteStatus("status").notNull().default("planned"),
    totalUnits: integer("total_units").notNull().default(0),
    doneUnits: integer("done_units").notNull().default(0),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    statusIdx: index("sites_status_idx").on(t.status),
  }),
);

// ─── tasks ────────────────────────────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 16 }).notNull().default("unit"),
  total: integer("total").notNull().default(0),
  done: integer("done").notNull().default(0),
  position: integer("position").notNull().default(0),
});

// ─── materials ────────────────────────────────────────────────────────────────

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  variant: varchar("variant", { length: 80 }),
  neededQty: real("needed_qty").notNull().default(0),
  takenQty: real("taken_qty").notNull().default(0),
  perUnit: real("per_unit").notNull().default(0),
});

// ─── events ───────────────────────────────────────────────────────────────────

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    note: text("note"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    color: varchar("color", { length: 16 }).notNull().default("#6E5B8A"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    rangeIdx: index("events_range_idx").on(t.startDate, t.endDate),
  }),
);

// ─── event_workers (M:N) ──────────────────────────────────────────────────────

export const eventWorkers = pgTable(
  "event_workers",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.eventId, t.userId] }),
    userIdx: index("event_workers_user_idx").on(t.userId),
  }),
);

// ─── reports ──────────────────────────────────────────────────────────────────

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    summary: text("summary").notNull(),
    reportedAt: timestamp("reported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    recentIdx: index("reports_recent_idx").on(t.reportedAt),
  }),
);

// ─── tool_catalog ─────────────────────────────────────────────────────────────

export const toolCatalog = pgTable("tool_catalog", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 120 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  recommended: varchar("recommended", { length: 80 }),
});

// ─── holidays ─────────────────────────────────────────────────────────────────

export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  locale: varchar("locale", { length: 8 }).notNull().default("en"),
});

// ─── audit_log ────────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 80 }).notNull(),
    entity: varchar("entity", { length: 80 }).notNull(),
    entityId: integer("entity_id").notNull(),
    payload: jsonb("payload"),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index("audit_log_entity_idx").on(t.entity, t.entityId),
  }),
);

// ─── Relations (for typed query builder) ──────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  createdSites: many(sites),
  reports: many(reports),
  eventAssignments: many(eventWorkers),
  auditEntries: many(auditLog),
}));

export const sitesRelations = relations(sites, ({ many, one }) => ({
  creator: one(users, { fields: [sites.createdBy], references: [users.id] }),
  tasks: many(tasks),
  materials: many(materials),
  events: many(events),
  reports: many(reports),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  site: one(sites, { fields: [tasks.siteId], references: [sites.id] }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  site: one(sites, { fields: [materials.siteId], references: [sites.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  site: one(sites, { fields: [events.siteId], references: [sites.id] }),
  workers: many(eventWorkers),
}));

export const eventWorkersRelations = relations(eventWorkers, ({ one }) => ({
  event: one(events, { fields: [eventWorkers.eventId], references: [events.id] }),
  user: one(users, { fields: [eventWorkers.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  site: one(sites, { fields: [reports.siteId], references: [sites.id] }),
  author: one(users, { fields: [reports.userId], references: [users.id] }),
}));

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
