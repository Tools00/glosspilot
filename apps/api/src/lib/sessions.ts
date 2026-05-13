/**
 * Session management.
 *
 * Hand-rolled rather than via better-auth — for v0.2.0 the surface area is small
 * enough that owning the code beats fighting a library's Fastify adapter.
 * See private notes 02-tech-stack.md for the trade-off.
 */
import { randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "../db/client.js";
import { sessions, users, type User } from "../db/schema.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionWithUser = {
  sessionId: string;
  user: User;
  expiresAt: Date;
};

/** Cryptographically-random opaque token, 32 bytes base64url-encoded. */
export function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: number): Promise<{ id: string; expiresAt: Date }> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

export async function getSession(sessionId: string): Promise<SessionWithUser | null> {
  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await deleteSession(sessionId);
    return null;
  }
  return { sessionId: row.sessionId, user: row.user, expiresAt: row.expiresAt };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/** Housekeeping — call from a cron in prod. */
export async function purgeExpired(): Promise<number> {
  const r = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  return r.rowCount ?? 0;
}

export const SESSION_COOKIE = "glosspilot_session";
