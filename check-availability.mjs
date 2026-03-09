import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  const [rows] = await conn.execute("SELECT id, consultorId, dayOfWeek, startTime, endTime, slotDurationMinutes, isActive FROM mentor_availability ORDER BY consultorId, dayOfWeek LIMIT 30");
  console.log('\n=== Mentor Availability ===');
  console.table(rows);
  
  // Check if there are any rows where startTime === endTime
  const [sameTime] = await conn.execute("SELECT id, consultorId, dayOfWeek, startTime, endTime FROM mentor_availability WHERE startTime = endTime");
  console.log('\n=== Rows where startTime === endTime ===');
  console.table(sameTime);
  
  await conn.end();
}

main().catch(console.error);
