const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Local SQLite DB file path. Can be overridden via CONTACTS_DB_PATH env var.
 * This keeps configuration out of code while still working out-of-the-box.
 */
const DB_PATH =
  process.env.CONTACTS_DB_PATH ||
  path.join(__dirname, '..', '..', 'data', 'contacts.sqlite');

/** @type {sqlite3.Database | null} */
let dbInstance = null;

/**
 * Promisified db.run
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Promisified db.get
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<any>}
 */
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

/**
 * Promisified db.all
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<any[]>}
 */
function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

/**
 * Ensures the contacts table exists. This acts as a lightweight migration on startup.
 * @param {sqlite3.Database} db
 * @returns {Promise<void>}
 */
async function migrate(db) {
  // Basic schema with timestamps and simple uniqueness to reduce duplicates.
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  );

  // In case older schema existed without updated_at, attempt to add it.
  // SQLite doesn't support IF NOT EXISTS for columns; we check pragma first.
  const columns = await all(db, 'PRAGMA table_info(contacts)');
  const hasUpdatedAt = columns.some((c) => c && c.name === 'updated_at');
  if (!hasUpdatedAt) {
    await run(
      db,
      'ALTER TABLE contacts ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime(\'now\'))'
    );
  }
}

/**
 * PUBLIC_INTERFACE
 * Returns a singleton SQLite connection. Initializes and migrates schema on first call.
 * @returns {Promise<sqlite3.Database>}
 */
async function getDb() {
  /** This is a public function. */
  if (dbInstance) return dbInstance;

  await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      dbInstance = db;
      resolve();
    });
  });

  await migrate(dbInstance);

  // Improve concurrency and integrity.
  await run(dbInstance, 'PRAGMA foreign_keys = ON');
  await run(dbInstance, 'PRAGMA journal_mode = WAL');

  return dbInstance;
}

/**
 * PUBLIC_INTERFACE
 * Gracefully closes the singleton DB connection.
 * @returns {Promise<void>}
 */
async function closeDb() {
  /** This is a public function. */
  if (!dbInstance) return;
  const db = dbInstance;
  dbInstance = null;

  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  getDb,
  closeDb,
  run,
  get,
  all,
  DB_PATH,
};
