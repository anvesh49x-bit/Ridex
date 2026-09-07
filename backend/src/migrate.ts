import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "./config/database.js";

const migrationsDirectory = path.resolve(
  process.cwd(),
  "database/migrations"
);

async function runMigrations() {
  console.log("🚀 RIDEX database migration started");

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const files = await fs.readdir(migrationsDirectory);

  const migrationFiles = files
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (migrationFiles.length === 0) {
    console.log("ℹ️ No migration files found");
    return;
  }

  for (const filename of migrationFiles) {
    const alreadyApplied = await db.query(
      `
        SELECT 1
        FROM schema_migrations
        WHERE filename = $1
        LIMIT 1;
      `,
      [filename]
    );

    if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
      console.log(`⏭️ Skipping ${filename} (already applied)`);
      continue;
    }

    const filePath = path.join(migrationsDirectory, filename);
    const sql = await fs.readFile(filePath, "utf8");

    console.log(`▶️ Applying ${filename}`);

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(sql);

      await client.query(
        `
          INSERT INTO schema_migrations (filename)
          VALUES ($1);
        `,
        [filename]
      );

      await client.query("COMMIT");

      console.log(`✅ Applied ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(`❌ Migration failed: ${filename}`);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("🎉 RIDEX database migration completed");
}

runMigrations()
  .catch((error) => {
    console.error("Migration error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });