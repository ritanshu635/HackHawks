import fs from 'fs';
import path from 'path';

async function backup() {
  const source = path.join(process.cwd(), 'database.sqlite');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = path.join(process.cwd(), `backups/database_${timestamp}.sqlite`);

  if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
    fs.mkdirSync(path.join(process.cwd(), 'backups'));
  }

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
    console.log(`✅ Database backed up to: ${destination}`);
  } else {
    console.error('❌ Source database.sqlite not found!');
  }
}

backup();
