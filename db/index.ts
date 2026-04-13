import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Supabase wymaga transaction pooler (port 5432) dla Server Actions
// i session pooler (port 5432) dla migracji — używamy jednego stringa
const client = postgres(process.env.DATABASE_URL, {
  prepare: false, // wymagane dla Supabase transaction pooler
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
