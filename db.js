import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const file = process.env.DATABASE_FILE || "./data/mydupegolden.sqlite";
fs.mkdirSync(path.dirname(file), { recursive: true });
export const db = new Database(file);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url TEXT NOT NULL,
  source_title TEXT,
  source_price REAL,
  category TEXT NOT NULL,
  max_price REAL,
  min_savings REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  retailer TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  price REAL NOT NULL,
  similarity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_search ON products(search_id);
`);
