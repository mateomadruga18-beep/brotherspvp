import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function datasourceUrl(): string {
  const direct = process.env.DIRECT_URL;
  const pooled = process.env.DATABASE_URL;
  if (direct) return direct;
  if (pooled) return pooled;
  // `prisma generate` does not open a DB connection; a valid URL shape is enough for config load.
  return "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Supabase: prefer DIRECT_URL for migrations; pooled DATABASE_URL matches runtime adapter.
    url: datasourceUrl(),
  },
});
