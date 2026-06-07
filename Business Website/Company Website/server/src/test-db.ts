import sql from 'mssql';

async function testConnection(server: string) {
  console.log(`Testing connection to: ${server}`);
  try {
    const pool = await sql.connect({
      server,
      database: 'master', // Connect to master just to test
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      authentication: {
        type: 'default',
      },
    });
    console.log(`✅ Success connecting to ${server}`);
    await pool.close();
    return true;
  } catch (err: any) {
    console.log(`❌ Failed connecting to ${server}: ${err.message}`);
    return false;
  }
}

async function runTests() {
  const servers = [
    'DESKTOP-OCMOC8D\\SQLEXPRESS',
    'localhost\\SQLEXPRESS',
    'localhost',
    '127.0.0.1\\SQLEXPRESS',
    '127.0.0.1'
  ];

  for (const s of servers) {
    if (await testConnection(s)) break;
  }
}

runTests();
