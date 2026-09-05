import { db } from "./config/database.js";

async function testDatabaseConnection() {
  try {
    const result = await db.query(`
      SELECT
        current_database() AS database,
        current_user AS user_name,
        version() AS postgres_version;
    `);

    console.log("✅ PostgreSQL connection successful");
    console.log("Database:", result.rows[0].database);
    console.log("User:", result.rows[0].user_name);
    console.log("PostgreSQL:", result.rows[0].postgres_version);

  } catch (error) {
    console.error("❌ PostgreSQL connection failed");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

testDatabaseConnection();