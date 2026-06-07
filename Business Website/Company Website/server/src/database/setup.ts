import { getDb } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log('🚀 Starting SQLite database setup...');

    // Check if DB file exists, if we want to reset for schema change, we might want to delete it first
    // But for now, we'll try to just apply schema if it handles IF NOT EXISTS correctly.
    // However, since we added columns, existing tables won't update easily with pure SQL. 
    // It's safer to delete the file for a fresh start in DEV mode.

    const dataDbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    const rootDbPath = path.join(process.cwd(), 'database.sqlite');

    // For persistence, we should not delete the database if it already exists.
    /*
    if (fs.existsSync(dataDbPath)) {
      console.log('🗑️ Deleting existing data database...');
      fs.unlinkSync(dataDbPath);
    }
    if (fs.existsSync(rootDbPath)) {
      console.log('🗑️ Deleting existing root database...');
      fs.unlinkSync(rootDbPath);
    }
    */

    const db = await getDb();

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await db.exec(schema);

    console.log('✅ Database schema created successfully!');

    // Run seed data
    console.log('🌱 Seeding initial data...');
    await seedData(db);

    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function seedData(db: any) {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Seed Government Admin only
  await db.run(
    `INSERT OR IGNORE INTO government_admins (id, username, password) VALUES (?, ?, ?)`,
    ['admin1', 'admin', hashedPassword]
  );

  // Update government wallet to match Green Ledger India (490,196 CC)
  await db.run(
    `UPDATE government_wallet 
     SET cc_balance = ?,
         money_balance = ?,
         total_cc_generated = ?,
         total_cc_allocated = ?,
         total_cc_used = ?,
         total_cc_expired = ?
     WHERE id = 1`,
    [490196, 5560000, 490196, 0, 0, 0]
  );
}

setupDatabase();
