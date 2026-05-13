import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { getSession, SESSION_COOKIE, type SessionWithUser } from "../lib/sessions.js";

declare module "fastify" {
  interface FastifyRequest {
    session?: SessionWithUser;
  }
}

/** preHandler: ensures the request has a valid session. */
export const requireAuth: preHandlerAsyncHookHandler = async (req, reply) => {
  const sid = req.cookies[SESSION_COOKIE];
  if (!sid) {
    return reply.code(401).send({ error: "Not authenticated" });
  }
  const sess = await getSession(sid);
  if (!sess) {
    return reply.code(401).send({ error: "Session expired" });
  }
  req.session = sess;
};

/** preHandler factory: ensures the authenticated user has one of the given roles. */
export function requireRole(...roles: ("ADMIN" | "WORKER")[]): preHandlerAsyncHookHandler {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.session) {
      return reply.code(401).send({ error: "Not authenticated" });
    }
    if (!roles.includes(req.session.user.role)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
  };
}
