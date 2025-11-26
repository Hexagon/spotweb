import { Database, DatabaseOpenOptions } from "sqlite3";
import { resolve } from "std/path/mod.ts";

async function openDatabase(options: DatabaseOpenOptions) {
  const path = resolve(Deno.cwd(), "./db/"),
    fileName = resolve(path, "main.db");
  await Deno.mkdir(path, { recursive: true });
  const database = new Database(fileName, options);

  // Enable WAL mode for better concurrency (allows concurrent readers and writers)
  database.exec("PRAGMA journal_mode = WAL");
  // Set busy timeout to 30 seconds to wait for locks instead of failing immediately
  database.exec("PRAGMA busy_timeout = 30000");

  return database;
}

export { openDatabase };
