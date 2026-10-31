import { parseEnv } from "@neon/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import neonConfig from "../../neon";

// App traffic uses the pooled Neon connection (DATABASE_URL) through node-postgres.
// Migrations use the direct DATABASE_URL_UNPOOLED, configured in prisma/schema.prisma.
function createClient() {
  const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"]);
  const pool = new Pool({ connectionString: postgres.databaseUrl });
  // On Vercel Fluid compute, close idle connections before the function is suspended.
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
