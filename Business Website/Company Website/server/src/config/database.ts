import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';

import fs from 'fs';

let db: any = null;

export async function getDb() {
  if (db) return db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = await open({
    filename: path.join(dataDir, 'database.sqlite'),
    driver: sqlite3.Database,
  });

  // Enable WAL mode for better concurrency in production
  await db.exec('PRAGMA journal_mode = WAL;');

  const hashedPass = await bcrypt.hash('password123', 10);

  // Initialize schema (Safe migrations) - Just ensure basic tables exist if not seeded
  await db.exec(`
    CREATE TABLE IF NOT EXISTS government_admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'government'
    );

    CREATE TABLE IF NOT EXISTS government_wallet (
      id INTEGER PRIMARY KEY DEFAULT 1,
      cc_balance REAL DEFAULT 0,
      money_balance REAL DEFAULT 0,
      total_cc_generated REAL DEFAULT 0,
      total_farmers_paid REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS farmers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      mobile TEXT,
      password TEXT,
      aadhaar TEXT,
      land_size REAL DEFAULT 0,
      land_id TEXT,
      current_crop TEXT,
      role TEXT DEFAULT 'farmer',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      mobile TEXT,
      password TEXT,
      registration_number TEXT,
      required_cc REAL DEFAULT 0,
      allocated_cc REAL DEFAULT 0,
      role TEXT DEFAULT 'company',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_entity TEXT,
      to_entity TEXT,
      cc_amount REAL,
      money_amount REAL,
      amount REAL,
      transaction_type TEXT,
      type TEXT,
      status TEXT DEFAULT 'pending',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Function to safely add columns
  const addColumnSafely = async (table: string, col: string, type: string) => {
    try {
      const tableInfo = await db.all(`PRAGMA table_info(${table})`);
      if (tableInfo.length > 0 && !tableInfo.some((c: any) => c.name === col)) {
        await db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type};`);
      }
    } catch (e: any) {
      console.log(`Note: ${e.message}`);
    }
  };

  // Resilient column addition for government_wallet
  const walletCols = [
    { name: 'total_cc_allocated', type: 'REAL DEFAULT 0' },
    { name: 'total_cc_allocated', type: 'REAL DEFAULT 0' },
    { name: 'total_cc_used', type: 'REAL DEFAULT 0' },
    { name: 'total_cc_expired', type: 'REAL DEFAULT 0' }
  ];

  for (const col of walletCols) {
    await addColumnSafely('government_wallet', col.name, col.type);
  }

  // Resilient column addition for farmers
  const farmerCols = [
    { name: 'bank_details', type: 'TEXT' },
    { name: 'wallet_balance', type: 'REAL DEFAULT 0' },
    { name: 'sowing_year', type: 'INTEGER DEFAULT 2024' },
    { name: 'aadhaar_doc', type: 'TEXT' },
    { name: 'land_doc', type: 'TEXT' },
    { name: 'bank_doc', type: 'TEXT' },
    { name: 'registered_at', type: "TEXT DEFAULT CURRENT_TIMESTAMP" },
    { name: 'disaster_status', type: "TEXT DEFAULT 'none'" },
    { name: 'disaster_description', type: "TEXT" },
    { name: 'december_logged', type: "INTEGER DEFAULT 0" },
    { name: 'insurance_fund', type: "REAL DEFAULT 0" }
  ];

  for (const col of farmerCols) {
    await addColumnSafely('farmers', col.name, col.type);
  }

  // Resilient column addition for companies
  const companyCols = [
    { name: 'used_cc', type: 'REAL DEFAULT 0' },
    { name: 'wallet_balance', type: 'REAL DEFAULT 0' },
    { name: 'approved', type: 'INTEGER DEFAULT 0' },
    { name: 'compliance_year', type: 'INTEGER DEFAULT 2024' },
    { name: 'registration_doc', type: 'TEXT' },
    { name: 'request_status', type: "TEXT DEFAULT 'none'" },
    { name: 'payment_status', type: "TEXT DEFAULT 'unpaid'" },
    { name: 'status', type: "TEXT DEFAULT 'pending'" },
    { name: 'registered_at', type: "TEXT DEFAULT CURRENT_TIMESTAMP" }
  ];

  for (const col of companyCols) {
    await addColumnSafely('companies', col.name, col.type);
  }

  // Ensure updated_at column exists for all tables
  await addColumnSafely('farmers', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  await addColumnSafely('companies', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');

  // Ensure default admin exists
  const adminHashedPass = await bcrypt.hash('password123', 10);
  await db.run(
    `INSERT OR IGNORE INTO government_admins (id, username, password, role) VALUES (?, ?, ?, ?)`,
    ['admin_1', 'admin', adminHashedPass, 'government']
  );
  // Also add with email-style username if that's what user expects
  await db.run(
    `INSERT OR IGNORE INTO government_admins (id, username, password, role) VALUES (?, ?, ?, ?)`,
    ['admin_2', 'admin@government.in', adminHashedPass, 'government']
  );

  await db.exec(`INSERT OR IGNORE INTO government_wallet (id, cc_balance, money_balance) VALUES (1, 2423, 0);`);

  // Update existing government wallet to have proper balance if it exists but has 0 balance
  await db.run(`UPDATE government_wallet SET cc_balance = 2423 WHERE id = 1 AND cc_balance = 0;`);

  return db;
}

