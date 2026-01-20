import fs from "fs";
import path from "path";

import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runGroupChatMigration = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });

  console.log("⏳ Running group chat migration...");

  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "lib/drizzle/0004_add_group_chat_tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await connection.unsafe(migrationSQL);

    console.log("✅ Group chat migration completed successfully");
    console.log("   - Added isGroupChat column to Chat table");
    console.log("   - Created ChatMembers table");
    console.log("   - Created ChatInvites table");
    console.log("   - Migrated existing chat owners to ChatMembers");
  } catch (error: any) {
    // If tables/columns already exist, that's okay
    if (error.message?.includes("already exists") || error.code === "42701" || error.code === "42P07") {
      console.log("⚠️  Some tables/columns may already exist, continuing...");
    } else {
      console.error("❌ Group chat migration failed:", error);
      throw error;
    }
  } finally {
    await connection.end();
    process.exit(0);
  }
};

runGroupChatMigration().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});


