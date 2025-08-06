import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

let db: any;

// For Vercel deployment, we'll use an in-memory database
if (process.env.VERCEL) {
  console.log("Running on Vercel, using in-memory database");
  const sqlite = new Database(':memory:');
  db = drizzle(sqlite, { schema });
  
  // Initialize with sample data
  const initDb = async () => {
    try {
      // Create tables
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL DEFAULT 'client',
          pin TEXT,
          advisor_id TEXT,
          is_approved INTEGER DEFAULT 0,
          created_at INTEGER
        )
      `);
      
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          balance REAL NOT NULL DEFAULT 0,
          overdraft_limit REAL DEFAULT 0,
          created_at INTEGER
        )
      `);
      
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS cards (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          card_number TEXT NOT NULL UNIQUE,
          holder_name TEXT NOT NULL,
          expiry_date TEXT NOT NULL,
          cvv TEXT NOT NULL,
          pin TEXT NOT NULL,
          is_virtual INTEGER DEFAULT 1,
          is_blocked INTEGER DEFAULT 0,
          created_by TEXT
        )
      `);
      
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          from_account_id TEXT,
          to_account_id TEXT,
          amount REAL NOT NULL,
          description TEXT,
          recipient_name TEXT,
          recipient_iban TEXT,
          sender_name TEXT,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'completed',
          created_at INTEGER
        )
      `);
      
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user_ribs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          iban TEXT NOT NULL UNIQUE,
          bank_name TEXT NOT NULL DEFAULT 'CIC - Crédit Industriel et Commercial',
          bank_code TEXT NOT NULL DEFAULT '30027',
          branch_code TEXT NOT NULL DEFAULT '10000',
          account_number TEXT NOT NULL,
          rib_key TEXT NOT NULL DEFAULT '76',
          bic TEXT NOT NULL DEFAULT 'CMCIFR2A',
          created_at INTEGER,
          updated_at INTEGER
        )
      `);
      
      // Insert sample data
      const advisorId = '05cfc0b4-1788-47bd-ae8e-8abc7220c221';
      const clientId = '1ab3111e-d28f-42d1-b49b-b0582704eb08';
      const accountId = '4249b382-490f-4df5-9c58-b3b547563347';
      const cardId = '6976a922-37f9-4016-942b-8788a10a987b';
      const now = Date.now();
      
      // Insert advisor
      sqlite.exec(`
        INSERT OR IGNORE INTO users (id, username, password, name, email, role, is_approved, created_at)
        VALUES ('${advisorId}', 'conseiller', 'password123', 'Marie Dupont', 'conseiller@mb-banque.fr', 'advisor', 1, ${now})
      `);
      
      // Insert client
      sqlite.exec(`
        INSERT OR IGNORE INTO users (id, username, password, name, email, role, pin, advisor_id, is_approved, created_at)
        VALUES ('${clientId}', 'client', 'password123', 'Jean Martin', 'jean.martin@email.com', 'client', '123456', '${advisorId}', 1, ${now})
      `);
      
      // Insert account
      sqlite.exec(`
        INSERT OR IGNORE INTO accounts (id, user_id, type, name, balance, created_at)
        VALUES ('${accountId}', '${clientId}', 'courant', 'Compte Principal', 2500.00, ${now})
      `);
      
      // Insert card
      sqlite.exec(`
        INSERT OR IGNORE INTO cards (id, account_id, card_number, holder_name, expiry_date, cvv, pin, created_by)
        VALUES ('${cardId}', '${accountId}', '1234567890123456', 'JEAN MARTIN', '12/25', '123', '1234', '${advisorId}')
      `);
      
      // Insert RIB
      sqlite.exec(`
        INSERT OR IGNORE INTO user_ribs (id, user_id, iban, account_number, created_at, updated_at)
        VALUES ('rib-${clientId}', '${clientId}', 'FR7630001007941234567890185', '12345678901', ${now}, ${now})
      `);
      
      console.log('Vercel database initialized with sample data');
    } catch (error) {
      console.error('Error initializing Vercel database:', error);
    }
  };
  
  initDb();
} else if (!process.env.DATABASE_URL) {
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