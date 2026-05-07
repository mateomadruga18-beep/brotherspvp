import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Supabase pooled URL is used at runtime via Prisma adapter.
    // Prisma migrations should use DIRECT_URL when available.
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});
