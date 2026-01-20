import fs from "fs";
import path from "path";

import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runUsersAuthMigration = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });

  console.log("⏳ Running users auth migration...");

  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "lib/drizzle/0005_add_users_remove_execution_plans.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await connection.unsafe(migrationSQL);

    console.log("✅ Users auth migration completed successfully");
    console.log("   - Added Users table for authentication");
    console.log("   - Removed ExecutionPlan and PlanStep tables");
    console.log("   - Updated foreign key constraints to reference Users table");
  } catch (error: any) {
    // If tables/columns already exist, that's okay
    if (error.message?.includes("already exists") || error.code === "42701" || error.code === "42P07") {
      console.log("⚠️  Some tables/columns may already exist, continuing...");
    } else {
      console.error("❌ Users auth migration failed:", error);
      throw error;
    }
  } finally {
    await connection.end();
    process.exit(0);
  }
};

runUsersAuthMigration().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});



