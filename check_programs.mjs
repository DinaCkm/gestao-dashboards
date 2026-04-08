import { createClient } from "@libsql/client";

const client = createClient({ url: process.env.DATABASE_URL });
const result = await client.execute("SELECT id, name, code FROM programs");
console.log(JSON.stringify(result.rows, null, 2));
