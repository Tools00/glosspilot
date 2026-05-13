import "dotenv/config";
import { z } from "zod";

/**
 * Zod-validated environment. Fails fast with a clear error if anything is missing.
 * Per project-standards: no silent fails on config.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgres"),
  AUTH_SECRET: z.string().min(32).optional(), // required from v0.2.0
  AUTH_COOKIE_DOMAIN: z.string().optional(),

  API_PORT: z.coerce.number().int().positive().default(3001),
  API_ORIGIN: z.string().url().default("http://localhost:3001"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),

  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  DEFAULT_LOCALE: z.string().default("en"),
  DEFAULT_TIMEZONE: z.string().default("Europe/Berlin"),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — see errors above.");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
