/**
 * Demo seed: mobile car-detailing scenario.
 * 6 users (1 dispatcher + 5 workers), 5 sites, 8 calendar events,
 * 4 today-reports, tool catalog, holidays.
 *
 * Idempotent: truncates all data tables first.
 * Run with:  pnpm db:seed
 */
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db, pool } from "./client.js";
import {
  users,
  sites,
  tasks,
  materials,
  events,
  eventWorkers,
  reports,
  toolCatalog,
  holidays,
} from "./schema.js";

const DEMO_PASSWORD = "demo";

async function reset() {
  // Order respects FKs; CASCADE handles transitive deletes.
  await db.execute(sql`
    TRUNCATE TABLE
      audit_log, reports, event_workers, events,
      materials, tasks, sites, holidays, tool_catalog, users
    RESTART IDENTITY CASCADE
  `);
}

async function seedUsers() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const rows = await db
    .insert(users)
    .values([
      { email: "dispatch@glosspilot.dev", passwordHash: hash, name: "Alex Dispatcher", initials: "AD", role: "ADMIN" },
      { email: "crew1@glosspilot.dev", passwordHash: hash, name: "Sam Carter", initials: "SC", role: "WORKER" },
      { email: "crew2@glosspilot.dev", passwordHash: hash, name: "Jamie Lee", initials: "JL", role: "WORKER" },
      { email: "crew3@glosspilot.dev", passwordHash: hash, name: "Robin Park", initials: "RP", role: "WORKER" },
      { email: "crew4@glosspilot.dev", passwordHash: hash, name: "Morgan Diaz", initials: "MD", role: "WORKER" },
      { email: "crew5@glosspilot.dev", passwordHash: hash, name: "Noah Khan", initials: "NK", role: "WORKER" },
    ])
    .returning({ id: users.id, email: users.email });
  return Object.fromEntries(rows.map((r) => [r.email, r.id]));
}

async function seedSites(adminId: number) {
  const rows = await db
    .insert(sites)
    .values([
      {
        clientName: "Volker Bremer", address: "Bismarckstr. 14, Berlin",
        lat: 52.5074, lng: 13.3239, color: "#2C5F2E", status: "active",
        totalUnits: 1, doneUnits: 0,
        startDate: "2026-05-12", endDate: "2026-05-14",
        createdBy: adminId,
      },
      {
        clientName: "Henrike Brandt", address: "Lindenstr. 88, Hamburg",
        lat: 53.5567, lng: 9.9837, color: "#5B7DB1", status: "active",
        totalUnits: 1, doneUnits: 0,
        startDate: "2026-05-14", endDate: "2026-05-16",
        createdBy: adminId,
      },
      {
        clientName: "Marek Owczarek", address: "Schulstr. 4, Munich",
        lat: 48.1374, lng: 11.5755, color: "#F4A442", status: "completed",
        totalUnits: 1, doneUnits: 1,
        startDate: "2026-05-04", endDate: "2026-05-06",
        createdBy: adminId,
      },
      {
        clientName: "RentACar GmbH", address: "Hafenstr. 22, Bremen",
        lat: 53.0793, lng: 8.8017, color: "#A66A8E", status: "active",
        totalUnits: 12, doneUnits: 4,
        startDate: "2026-05-11", endDate: "2026-05-22",
        createdBy: adminId,
      },
      {
        clientName: "AutoHaus Nord SE", address: "Industriestr. 1, Kiel",
        lat: 54.3233, lng: 10.1228, color: "#6E5B8A", status: "planned",
        totalUnits: 30, doneUnits: 0,
        startDate: "2026-05-25", endDate: "2026-06-12",
        createdBy: adminId,
      },
    ])
    .returning({ id: sites.id, clientName: sites.clientName });
  return rows;
}

async function seedTasksAndMaterials(siteIds: number[]) {
  // Same task/material shape for each site — realistic for detailing.
  for (const [idx, siteId] of siteIds.entries()) {
    const totalCars = idx === 3 ? 12 : idx === 4 ? 30 : 1;
    await db.insert(tasks).values([
      { siteId, name: "Exterior wash", unit: "car", total: totalCars, done: idx === 2 ? totalCars : Math.floor(totalCars / 3), position: 0 },
      { siteId, name: "Interior detail", unit: "car", total: totalCars, done: idx === 2 ? totalCars : 0, position: 1 },
      { siteId, name: "Ceramic coating", unit: "car", total: totalCars, done: idx === 2 ? totalCars : 0, position: 2 },
    ]);
    await db.insert(materials).values([
      { siteId, name: "Shampoo concentrate", variant: "pH-neutral", neededQty: totalCars * 0.2, takenQty: idx === 2 ? totalCars * 0.2 : 0, perUnit: 0.2 },
      { siteId, name: "Microfiber cloth", variant: "300gsm", neededQty: totalCars * 4, takenQty: idx === 2 ? totalCars * 4 : totalCars, perUnit: 4 },
      { siteId, name: "Ceramic sealant", variant: "9H", neededQty: totalCars * 0.05, takenQty: idx === 2 ? totalCars * 0.05 : 0, perUnit: 0.05 },
    ]);
  }
}

async function seedEvents(siteIds: number[], workerIds: number[]) {
  const eventRows = await db
    .insert(events)
    .values([
      { siteId: siteIds[0]!, title: "Volker Bremer — Ceramic", note: "BMW M3, indoor bay", startDate: "2026-05-12", endDate: "2026-05-14", color: "#2C5F2E" },
      { siteId: siteIds[1]!, title: "Henrike Brandt — Full detail", note: "Audi Q5", startDate: "2026-05-14", endDate: "2026-05-16", color: "#5B7DB1" },
      { siteId: siteIds[3]!, title: "RentACar — Batch 1", note: "6 cars, day shift", startDate: "2026-05-11", endDate: "2026-05-13", color: "#A66A8E" },
      { siteId: siteIds[3]!, title: "RentACar — Batch 2", note: "6 cars, day shift", startDate: "2026-05-18", endDate: "2026-05-20", color: "#A66A8E" },
      { siteId: siteIds[1]!, title: "Henrike Brandt — Sealant", note: "Second visit", startDate: "2026-05-21", endDate: "2026-05-22", color: "#5B7DB1" },
      { siteId: siteIds[0]!, title: "Volker Bremer — Polish", note: "Stage 2 follow-up", startDate: "2026-05-25", endDate: "2026-05-26", color: "#2C5F2E" },
      { siteId: siteIds[4]!, title: "AutoHaus Nord — Kickoff", note: "Site survey + first 5 cars", startDate: "2026-05-25", endDate: "2026-05-29", color: "#6E5B8A" },
      { siteId: siteIds[4]!, title: "AutoHaus Nord — Wave 2", note: "Cars 6–15", startDate: "2026-06-01", endDate: "2026-06-05", color: "#6E5B8A" },
    ])
    .returning({ id: events.id });

  // Assign workers (round-robin-ish).
  const assignments: { eventId: number; userId: number }[] = [];
  eventRows.forEach((e, i) => {
    assignments.push({ eventId: e.id, userId: workerIds[i % workerIds.length]! });
    if (i % 2 === 0) {
      assignments.push({ eventId: e.id, userId: workerIds[(i + 1) % workerIds.length]! });
    }
  });
  await db.insert(eventWorkers).values(assignments);
}

async function seedReports(siteIds: number[], workerIds: number[]) {
  await db.insert(reports).values([
    { siteId: siteIds[0]!, userId: workerIds[0]!, summary: "Exterior wash done, prepped for ceramic." },
    { siteId: siteIds[1]!, userId: workerIds[1]!, summary: "Interior 60% complete; leather conditioner reordered." },
    { siteId: siteIds[3]!, userId: workerIds[2]!, summary: "Batch 1 cars 1–3 finished, photos uploaded." },
    { siteId: siteIds[3]!, userId: workerIds[3]!, summary: "Microfiber stock running low — flagged dispatch." },
  ]);
}

async function seedCatalog() {
  await db.insert(toolCatalog).values([
    { category: "Wash", name: "Foam cannon", recommended: "1 per crew" },
    { category: "Wash", name: "Pressure washer 150 bar", recommended: "1 per crew" },
    { category: "Wash", name: "Wash mitt (microfiber)", recommended: "2 per car" },
    { category: "Interior", name: "Steam cleaner", recommended: "1 per crew" },
    { category: "Interior", name: "Detail brush set", recommended: null },
    { category: "Polish", name: "Dual-action polisher", recommended: "1 per crew" },
    { category: "Polish", name: "Polishing pads (cutting/finishing)", recommended: null },
    { category: "PPE", name: "Nitrile gloves", recommended: null },
    { category: "PPE", name: "Respirator (organic vapor)", recommended: null },
  ]);
}

async function seedHolidays() {
  await db.insert(holidays).values([
    { date: "2026-05-01", name: "Labour Day", locale: "de" },
    { date: "2026-05-14", name: "Ascension Day", locale: "de" },
    { date: "2026-05-25", name: "Whit Monday", locale: "de" },
    { date: "2026-10-03", name: "German Unity Day", locale: "de" },
  ]);
}

async function main() {
  console.log("seed: truncating...");
  await reset();

  console.log("seed: users...");
  const userIds = await seedUsers();
  const adminId = userIds["dispatch@glosspilot.dev"]!;
  const workerIds = [
    userIds["crew1@glosspilot.dev"]!,
    userIds["crew2@glosspilot.dev"]!,
    userIds["crew3@glosspilot.dev"]!,
    userIds["crew4@glosspilot.dev"]!,
    userIds["crew5@glosspilot.dev"]!,
  ];

  console.log("seed: sites...");
  const sitesCreated = await seedSites(adminId);
  const siteIds = sitesCreated.map((s) => s.id);

  console.log("seed: tasks + materials...");
  await seedTasksAndMaterials(siteIds);

  console.log("seed: events + assignments...");
  await seedEvents(siteIds, workerIds);

  console.log("seed: reports...");
  await seedReports(siteIds, workerIds);

  console.log("seed: tool catalog + holidays...");
  await seedCatalog();
  await seedHolidays();

  console.log("seed: done.");
  console.log("login as ADMIN:  dispatch@glosspilot.dev / demo");
  console.log("login as WORKER: crew1@glosspilot.dev    / demo");
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
