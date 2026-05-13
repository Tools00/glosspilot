import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// .env lives at the repo root. Scripts always run with cwd=apps/api via pnpm filter.
loadEnv({ path: resolve(process.cwd(), "../../.env") });

/**
 * Zod-validated environment. Fails fast with a clear error if anything is missing.
 * Per project-standards: no silent fails on config.
 */
// dotenv reads missing values as empty string ""; treat those as undefined
// so `.optional()` and defaults work naturally.
const emptyToUndefined = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), s);

const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgres"),
  AUTH_SECRET: emptyToUndefined(z.string().min(32).optional()),
  AUTH_COOKIE_DOMAIN: emptyToUndefined(z.string().optional()),

  API_PORT: emptyToUndefined(z.coerce.number().int().positive().default(3001)),
  API_ORIGIN: emptyToUndefined(z.string().url().default("http://localhost:3001")),
  WEB_ORIGIN: emptyToUndefined(z.string().default("http://localhost:5173")),

  S3_ENDPOINT: emptyToUndefined(z.string().url().optional()),
  S3_BUCKET: emptyToUndefined(z.string().optional()),
  S3_ACCESS_KEY: emptyToUndefined(z.string().optional()),
  S3_SECRET_KEY: emptyToUndefined(z.string().optional()),

  DEFAULT_LOCALE: emptyToUndefined(z.string().default("en")),
  DEFAULT_TIMEZONE: emptyToUndefined(z.string().default("Europe/Berlin")),

  NODE_ENV: emptyToUndefined(
    z.enum(["development", "production", "test"]).default("development"),
  ),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — see errors above.");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
