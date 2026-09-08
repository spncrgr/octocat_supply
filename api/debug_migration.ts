import { closeDatabase, getDatabase } from './src/db/sqlite.ts';
import { runMigrations } from './src/db/migrate.ts';

async function main() {
  await closeDatabase();
  const db = await getDatabase(true);
  await runMigrations(true);
  const tables = await db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('TABLES', tables.map(t => t.name));
  const schema = await db.get<{ sql: string }>("SELECT sql FROM sqlite_master WHERE name='purchase_orders'");
  console.log('SCHEMA', schema?.sql);
  await closeDatabase();
}
main().catch((e)=>{ console.error(e); process.exit(1); });
