import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: [".env.local", ".env"] });

const runMigrate = async () => {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  const migrationsFolder = path.resolve(process.cwd(), "lib/drizzle");
  const migrationJournalPath = path.join(
    migrationsFolder,
    "meta",
    "_journal.json",
  );

  if (!databaseUrl) {
    console.log(
      "No DATABASE_URL/POSTGRES_URL configured. Skipping Drizzle migrations.",
    );
    return;
  }

  if (!existsSync(migrationJournalPath)) {
    console.log(
      "No Drizzle migration journal found at",
      migrationJournalPath,
      ". Skipping migrations.",
    );
    return;
  }

  const connectionString = databaseUrl.includes("sslmode=")
    ? databaseUrl
    : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=require`;
  const connection = postgres(connectionString, { max: 1 });
  const db = drizzle(connection);

  console.log("Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder });
  const end = Date.now();

  console.log("Migrations completed in", (end - start) / 1000, "seconds");
};

runMigrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
