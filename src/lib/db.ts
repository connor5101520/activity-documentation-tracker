import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

let migrated = false;

export async function ensureMigrated() {
  if (migrated) return;
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      notification_time TEXT NOT NULL DEFAULT '17:00',
      notification_enabled INTEGER NOT NULL DEFAULT 1,
      weekly_summary_day INTEGER NOT NULL DEFAULT 5,
      weekly_summary_time TEXT NOT NULL DEFAULT '09:00'
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'task',
      completed INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
  `);
  migrated = true;
}
