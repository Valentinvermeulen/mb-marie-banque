import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema.js";

// Pour Vercel, nous devons utiliser une approche différente
// car SQLite n'est pas supporté en production
let db: any;

if (process.env.NODE_ENV === "production") {
  // En production (Vercel), utiliser des données en mémoire
  // Note: Ceci est temporaire, pour une vraie production il faudrait
  // utiliser PostgreSQL ou une autre base de données compatible Vercel
  db = {
    // Mock database pour Vercel
    select: () => ({
      from: () => Promise.resolve([])
    }),
    insert: () => ({
      values: () => Promise.resolve([])
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve()
      })
    }),
    delete: () => ({
      where: () => Promise.resolve()
    })
  };
} else {
  // En développement, utiliser SQLite
  const sqlite = new Database("local.db");
  db = drizzle(sqlite, { schema });
}

export { db };