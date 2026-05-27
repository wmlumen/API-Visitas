const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'visits.db');
let db = null;
let SQL = null;

async function initSqlJsModule() {
  if (SQL) return SQL;
  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();
  return SQL;
}

function getDb() {
  if (db) return db;
  throw new Error('Database not initialized. Call initDatabase() first.');
}

async function initDatabase() {
  await initSqlJsModule();

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      api_key TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      page TEXT DEFAULT '',
      ip TEXT,
      country TEXT DEFAULT '',
      region TEXT DEFAULT '',
      city TEXT DEFAULT '',
      lat REAL,
      lon REAL,
      isp TEXT DEFAULT '',
      browser TEXT DEFAULT '',
      os TEXT DEFAULT '',
      device TEXT DEFAULT '',
      referrer TEXT DEFAULT '',
      visitor_hash TEXT,
      is_bot INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Índices (con IF NOT EXISTS implícito)
  try { db.run('CREATE INDEX idx_visits_project ON visits(project_id)'); } catch (e) {}
  try { db.run('CREATE INDEX idx_visits_created ON visits(created_at)'); } catch (e) {}
  try { db.run('CREATE INDEX idx_visits_hash ON visits(visitor_hash)'); } catch (e) {}
  try { db.run('CREATE INDEX idx_visits_bot ON visits(is_bot)'); } catch (e) {}

  // Asegurar proyecto default
  const existing = db.exec("SELECT id FROM projects WHERE name = 'default'");
  if (!existing.length || !existing[0].values.length) {
    db.run("INSERT INTO projects (name) VALUES ('default')");
  }

  saveDb();
  return db;
}

function saveDb() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('Error saving database:', e.message);
  }
}

function getProjectId(name) {
  const result = db.exec(`SELECT id FROM projects WHERE name = '${name.replace(/'/g, "''")}'`);
  if (result.length && result[0].values.length) {
    return result[0].values[0][0];
  }

  db.run(`INSERT INTO projects (name) VALUES ('${name.replace(/'/g, "''")}')`);
  saveDb();

  const inserted = db.exec("SELECT last_insert_rowid() as id");
  return inserted[0].values[0][0];
}

function insertVisit({ projectId, page, ip, country, region, city, lat, lon, isp, browser, os, device, referrer, visitorHash, isBot }) {
  const sql = `INSERT INTO visits (project_id, page, ip, country, region, city, lat, lon, isp, browser, os, device, referrer, visitor_hash, is_bot)
    VALUES (${projectId}, '${esc(page)}', '${esc(ip)}', '${esc(country)}', '${esc(region)}', '${esc(city)}', ${lat ?? 'NULL'}, ${lon ?? 'NULL'}, '${esc(isp)}', '${esc(browser)}', '${esc(os)}', '${esc(device)}', '${esc(referrer)}', '${esc(visitorHash)}', ${isBot ? 1 : 0})`;
  db.run(sql);
  saveDb();
}

function queryAll(sql, params = []) {
  // Reemplazar ? por valores escapados
  let idx = 0;
  const processed = sql.replace(/\?/g, () => {
    const val = params[idx++];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    return `'${String(val).replace(/'/g, "''")}'`;
  });

  try {
    const result = db.exec(processed);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  } catch (e) {
    console.error('Query error:', e.message, 'SQL:', processed);
    return [];
  }
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

module.exports = { initDatabase, getDb, getProjectId, insertVisit, queryAll, queryOne, saveDb };
