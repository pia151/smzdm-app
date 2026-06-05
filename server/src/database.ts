import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'smzdm.db');

let db: SqlJsDatabase | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      nickname TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id INTEGER,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      image TEXT DEFAULT '',
      platform TEXT DEFAULT '',
      current_price REAL DEFAULT 0,
      original_price REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      user_id TEXT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      price REAL DEFAULT 0,
      original_price REAL DEFAULT 0,
      platform TEXT DEFAULT '',
      platform_icon TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      coupon_info TEXT DEFAULT '',
      image TEXT DEFAULT '',
      category_id INTEGER,
      status TEXT DEFAULT 'pending',
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      deal_id TEXT,
      product_id TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (deal_id) REFERENCES deals(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS deal_comments (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id TEXT DEFAULT NULL,
      like_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (deal_id) REFERENCES deals(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      price REAL NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT,
      deal_id TEXT,
      title TEXT NOT NULL,
      url TEXT DEFAULT '',
      platform TEXT DEFAULT '',
      target_price REAL NOT NULL,
      current_price REAL DEFAULT 0,
      last_check_price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_triggered INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      triggered_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active, is_triggered);
    CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
  `);

  // 写入磁盘
  saveDb();
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function closeDb(): void {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}