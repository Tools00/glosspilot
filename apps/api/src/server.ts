import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { siteRoutes } from "./routes/sites.js";
import { eventRoutes } from "./routes/events.js";
import { userRoutes } from "./routes/users.js";
import { reportRoutes } from "./routes/reports.js";
import { dashboardRoutes } from "./routes/dashboard.js";

async function build() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cookie);
  await app.register(cors, {
    origin: env.WEB_ORIGIN.split(","),
    credentials: true,
  });

  app.get("/health", async () => ({ ok: true, version: "0.5.0" }));

  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(siteRoutes);
  await app.register(eventRoutes);
  await app.register(userRoutes);
  await app.register(reportRoutes);
  await app.register(dashboardRoutes);

  app.setErrorHandler((err: unknown, _req, reply) => {
    const e = err as { validation?: unknown; statusCode?: number; name?: string; message?: string };
    if (e.validation) {
      return reply.code(400).send({ error: "ValidationError", details: e.validation });
    }
    app.log.error(err);
    return reply.code(e.statusCode ?? 500).send({
      error: e.name ?? "InternalServerError",
      message: env.NODE_ENV === "production" ? "Something went wrong" : e.message,
    });
  });

  return app;
}

const app = await build();
try {
  await app.listen({ port: env.API_PORT, host: "127.0.0.1" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
