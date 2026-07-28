#!/usr/bin/env node
/* Runner de migraciones SQL puro contra Postgres (Render). */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL en el entorno (.env.local).");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set(
      (await client.query("SELECT id FROM schema_migrations")).rows.map((r) => r.id),
    );

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let ranAny = false;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`-> Aplicando ${file}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
        await client.query("COMMIT");
        ranAny = true;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Error aplicando ${file}:`, err.message);
        process.exit(1);
      }
    }

    console.log(ranAny ? "Migraciones aplicadas correctamente." : "No había migraciones pendientes.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
