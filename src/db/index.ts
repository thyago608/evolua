import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada.");
}

const url = process.env.DATABASE_URL;

/**
 * Usa o driver HTTP da Neon em produção (detecta pela URL) e o driver
 * node-postgres (pg) para um Postgres comum em desenvolvimento local.
 */
function createDb() {
  const isNeon = /neon\.tech|neon\.db|pooler\.supabase/.test(url);
  if (isNeon) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    return drizzle(neon(url), { schema });
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  return drizzle(new Pool({ connectionString: url }), { schema });
}

export const db = createDb() as ReturnType<
  typeof import("drizzle-orm/node-postgres").drizzle<typeof schema>
>;
export { schema };
