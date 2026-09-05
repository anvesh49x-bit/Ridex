import { db } from "./config/database.js";

async function testRideRequestTable() {
  try {
    const result = await db.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ride_requests'
      ORDER BY ordinal_position;
    `);

    console.log("✅ ride_requests table verified");
    console.table(result.rows);

  } catch (error) {
    console.error("❌ ride_requests table verification failed");

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

testRideRequestTable();