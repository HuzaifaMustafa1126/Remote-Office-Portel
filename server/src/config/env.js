import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("remote_office_portal"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("8h"),
  FRONTEND_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).optional(),
  IP_DIAGNOSTICS: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(100).default(10),
  DB_QUEUE_LIMIT: z.coerce.number().int().min(1).max(10000).default(100),
  STARTUP_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120000).default(30000),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(5000).max(300000).default(30000),
});

const requiredProductionVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
];
if (process.env.NODE_ENV === "production") {
  const missing = requiredProductionVariables.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `Invalid environment configuration: missing required production variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const errors = Object.entries(parsed.error.flatten().fieldErrors)
    .map(([name, messages]) => `${name}: ${messages.join(", ")}`)
    .join("; ");
  console.error(`Invalid environment configuration: ${errors}`);
  process.exit(1);
}

const configuredOrigins = parsed.data.CORS_ORIGIN ?? parsed.data.FRONTEND_URL;
if (parsed.data.NODE_ENV === "production" && !configuredOrigins) {
  console.error(
    "Invalid environment configuration: FRONTEND_URL (or CORS_ORIGIN) is required in production",
  );
  process.exit(1);
}

const CORS_ORIGINS = (configuredOrigins ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export default Object.freeze({
  ...parsed.data,
  // Hostinger's managed Node application proxy is the single direct peer of
  // this process. Local development trusts no forwarding hop.
  TRUST_PROXY_HOPS: parsed.data.TRUST_PROXY_HOPS ?? (parsed.data.NODE_ENV === "production" ? 1 : 0),
  CORS_ORIGINS,
});
