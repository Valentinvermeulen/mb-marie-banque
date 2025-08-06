import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('local.db');

async function initDatabase() {
  console.log('Initializing database...');

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
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'EUR',
      iban TEXT,
      bic TEXT,
      created_at INTEGER
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      card_number TEXT NOT NULL,
      card_type TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      cvv TEXT NOT NULL,
      is_blocked INTEGER DEFAULT 0,
      daily_limit REAL DEFAULT 1000,
      created_at INTEGER
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_account_id TEXT,
      to_account_id TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_ribs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_name TEXT NOT NULL,
      iban TEXT NOT NULL,
      bic TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      created_at INTEGER
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
    INSERT OR IGNORE INTO accounts (id, user_id, type, balance, currency, iban, bic, created_at)
    VALUES ('${accountId}', '${clientId}', 'Compte Courant', 2500.50, 'EUR', 'FR7630001007941234567890185', 'BNPAFRPP', ${now})
  `);

  // Insert card
  sqlite.exec(`
    INSERT OR IGNORE INTO cards (id, user_id, account_id, card_number, card_type, expiry_date, cvv, created_at)
    VALUES ('${cardId}', '${clientId}', '${accountId}', '4532 **** **** 1234', 'Visa', '12/26', '123', ${now})
  `);

  // Insert RIB
  sqlite.exec(`
    INSERT OR IGNORE INTO user_ribs (id, user_id, account_name, iban, bic, bank_name, created_at)
    VALUES ('rib-1', '${clientId}', 'Compte Courant Jean Martin', 'FR7630001007941234567890185', 'BNPAFRPP', 'MB Marie Banque', ${now})
  `);

  console.log('Database initialized successfully!');
  console.log('Sample data inserted:');
  console.log('- Advisor: conseiller / password123');
  console.log('- Client: client / password123 (PIN: 123456)');
}

initDatabase().catch(console.error); 