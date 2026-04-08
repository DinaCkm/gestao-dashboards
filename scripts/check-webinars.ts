import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [statusCounts] = await conn.execute("SELECT status, COUNT(*) as total FROM scheduled_webinars GROUP BY status");
  console.log("=== STATUS COUNTS ===");
  console.log(JSON.stringify(statusCounts, null, 2));
  
  const [upcoming] = await conn.execute("SELECT COUNT(*) as total FROM scheduled_webinars WHERE status = 'published' AND eventDate >= NOW()");
  console.log("\n=== UPCOMING (published + future) ===");
  console.log(JSON.stringify(upcoming, null, 2));
  
  const [past] = await conn.execute("SELECT COUNT(*) as total FROM scheduled_webinars WHERE status IN ('published', 'completed') AND eventDate < NOW()");
  console.log("\n=== PAST (published/completed + past) ===");
  console.log(JSON.stringify(past, null, 2));
  
  const [latest] = await conn.execute("SELECT id, title, status, eventDate FROM scheduled_webinars ORDER BY eventDate DESC LIMIT 5");
  console.log("\n=== LATEST 5 ===");
  console.log(JSON.stringify(latest, null, 2));
  
  await conn.end();
}

main().catch(console.error);
