import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const masterConfig: sql.config = {
  server: '127.0.0.1',
  database: 'master', // CONNECT TO MASTER FIRST
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: 'SQLEXPRESS'
  },
  authentication: {
    type: 'default'
  }
};

async function createDatabase() {
  try {
    console.log('🔌 Connecting to master database...');
    const pool = await sql.connect(masterConfig);
    console.log('✅ Connected to master');

    console.log('🔨 Creating database carbon_bloom if not exists...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'carbon_bloom')
      BEGIN
        CREATE DATABASE carbon_bloom;
        PRINT 'Database carbon_bloom created';
      END
      ELSE
      BEGIN
        PRINT 'Database carbon_bloom already exists';
      END
    `);

    await pool.close();
    console.log('✅ Database creation step complete.');
  } catch (err) {
    console.error('❌ Failed to create database:', err);
    process.exit(1);
  }
}

createDatabase();
