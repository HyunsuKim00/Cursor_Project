import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../db';

async function runMigrations() {
  console.log('Migration started...');
  
  try {
    await migrate(db, {
      migrationsFolder: 'drizzle',
    });
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 