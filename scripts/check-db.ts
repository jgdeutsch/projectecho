import { db } from "../db/index";
import { runs, likers } from "../db/schema";
import { sql } from "drizzle-orm";

async function checkDatabase() {
  try {
    console.log("Checking database connection...");
    
    // Try to query the runs table
    const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('runs', 'likers')`);
    console.log("Tables found:", result);
    
    // Try a simple query
    const count = await db.select().from(runs).limit(1);
    console.log("Database connection successful!");
    console.log("Runs table exists and is accessible");
    
    process.exit(0);
  } catch (error) {
    console.error("Database error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

checkDatabase();

