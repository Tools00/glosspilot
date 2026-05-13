import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSchema } from "@glosspilot/shared";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import {
  createSession,
  deleteSession,
  SESSION_COOKIE,
} from "../lib/sessions.js";
import { audit } from "../lib/audit.js";
import { requireAuth } from "../rbac/index.js";
import { env } from "../env.js";

const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /auth/login
   * Body: { email, password }
   * Sets session cookie, returns the public user.
   */
  app.post(
    "/auth/login",
    { schema: { body: loginSchema } },
    async (req, reply) => {
      const { email, password } = req.body as { email: string; password: string };

      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      const user = rows[0];

      // Use a fixed-cost compare even on miss to mitigate timing oracles.
      const dummyHash = "$2b$10$abcdefghijklmnopqrstuv.WyzWyzWyzWyzWyzWyzWyzWyzWyzWy";
      const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

      if (!user || !ok) {
        return reply.code(401).send({ error: "Invalid email or password" });
      }

      const session = await createSession(user.id);
      reply.setCookie(SESSION_COOKIE, session.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        maxAge: SEVEN_DAYS_SEC,
      });

      await audit({
        userId: user.id,
        action: "login",
        entity: "user",
        entityId: user.id,
      });

      return reply.send({
        id: user.id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        role: user.role,
      });
    },
  );

  /**
   * POST /auth/logout
   * Clears session.
   */
  app.post(
    "/auth/logout",
    { preHandler: requireAuth },
    async (req, reply) => {
      const sid = req.session!.sessionId;
      const userId = req.session!.user.id;
      await deleteSession(sid);
      reply.clearCookie(SESSION_COOKIE, { path: "/" });
      await audit({ userId, action: "logout", entity: "user", entityId: userId });
      return reply.send({ ok: true });
    },
  );
}
