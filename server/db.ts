import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

let db: any;

// Use SQLite for local development if no DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found, using SQLite for local development");
  const sqlite = new Database('local.db');
  db = drizzle(sqlite, { schema });
} else {
  // Use PostgreSQL for production
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const ws = require("ws");
  
  neonConfig.webSocketConstructor = ws;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db };