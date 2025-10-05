// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from "ws";
// import * as schema from "../shared/schema";
// import dotenv from 'dotenv';
// dotenv.config();


// neonConfig.webSocketConstructor = ws;

// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     "DATABASE_URL must be set. Did you forget to provision a database?",
//   );
// }

// export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle({ client: pool, schema });

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import dotenv from 'dotenv';
dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

/**
 * Connect to DB with retries
 */
export async function connectToDB(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1"); // simple query to test connection
      console.log("✅ Database connected");
      return;
    } catch (err: any) {
      console.warn(`⚠️ DB connection attempt ${i + 1} failed: ${err.message}`);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("❌ Could not connect to database after multiple attempts");
}
