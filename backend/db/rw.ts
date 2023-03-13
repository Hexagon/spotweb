import { Database, DatabaseOpenOptions } from "sqlite3";
import { resolve } from "std/path/mod.ts";

async function openDatabase(options: DatabaseOpenOptions) {
    const path = resolve(Deno.cwd(), "./db/"),
        fileName = resolve(path, "main.db");
    await Deno.mkdir(path, { recursive: true });
    const database = new Database(fileName, options);
    return database;
}

export { openDatabase }