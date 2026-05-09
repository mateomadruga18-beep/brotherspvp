import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "../env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL for Prisma PostgreSQL connection.");
}
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
