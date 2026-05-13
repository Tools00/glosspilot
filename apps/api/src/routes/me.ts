import type { FastifyInstance } from "fastify";
import { requireAuth } from "../rbac/index.js";

export async function meRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /me — current authenticated user.
   */
  app.get(
    "/me",
    { preHandler: requireAuth },
    async (req) => {
      const u = req.session!.user;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        initials: u.initials,
        role: u.role,
      };
    },
  );
}
