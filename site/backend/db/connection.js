import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '../config/env.js';
import * as schema from './schema.js';
import { SCHEMA_DDL_SQL } from './schema.js';

const require = createRequire(import.meta.url);

let sqliteInstance = null;
let dbInstance = null;

function createDatabaseInstance(targetPath) {
  try {
    const BetterSqlite = require('better-sqlite3');
    return new BetterSqlite(targetPath);
  } catch (err) {
    console.log(
      `⚠️ better-sqlite3 indisponível no ambiente (${err.message}). Utilizando driver nativo node:sqlite do Node.js...`
    );
    const { DatabaseSync } = require('node:sqlite');
    const raw = new DatabaseSync(targetPath);
    return {
      exec(sql) {
        return raw.exec(sql);
      },
      pragma(sql) {
        try {
          return raw.exec('PRAGMA ' + sql);
        } catch {
          return [];
        }
      },
      close() {
        return raw.close();
      },
      transaction(fn) {
        return function (...args) {
          raw.exec('BEGIN');
          try {
            const res = fn(...args);
            raw.exec('COMMIT');
            return res;
          } catch (e) {
            try {
              raw.exec('ROLLBACK');
            } catch {}
            throw e;
          }
        };
      },
      prepare(sql) {
        const stmt = raw.prepare(sql);
        let rawMode = false;
        const wrapped = {
          raw(val = true) {
            rawMode = val;
            return wrapped;
          },
          run(...params) {
            return stmt.run(...params);
          },
          all(...params) {
            const rows = stmt.all(...params);
            if (rawMode) {
              return rows.map((r) => Object.values(r));
            }
            return rows;
          },
          get(...params) {
            const row = stmt.get(...params);
            if (!row) return undefined;
            if (rawMode) {
              return Object.values(row);
            }
            return row;
          },
        };
        return wrapped;
      },
    };
  }
}

export function initDatabase(customDbPath = null) {
  const targetPath =
    customDbPath ??
    (process.env.NODE_ENV === 'test' ? ':memory:' : env.DATABASE_URL);

  if (targetPath !== ':memory:') {
    const absDir = path.dirname(path.resolve(process.cwd(), targetPath));
    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true });
    }
  }

  if (sqliteInstance) {
    try {
      sqliteInstance.close();
    } catch {
      // Ignora fechamento anterior
    }
  }

  sqliteInstance = createDatabaseInstance(targetPath);
  if (targetPath !== ':memory:') {
    sqliteInstance.pragma('journal_mode = WAL');
  }
  sqliteInstance.pragma('foreign_keys = ON');
  sqliteInstance.exec(SCHEMA_DDL_SQL);

  // Migrações seguras e idempotentes para colunas de entrega, pagamento e usuários
  const columnsToAdd = [
    'ALTER TABLE orders ADD COLUMN customer_phone TEXT',
    'ALTER TABLE orders ADD COLUMN payment_method TEXT',
    'ALTER TABLE orders ADD COLUMN is_paid INTEGER DEFAULT 0',
    'ALTER TABLE orders ADD COLUMN delivery_pin TEXT',
    'ALTER TABLE users ADD COLUMN name TEXT DEFAULT ""',
    'ALTER TABLE users ADD COLUMN phone TEXT',
    'ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1',
    'ALTER TABLE users ADD COLUMN updated_at TEXT',
  ];
  for (const alterSql of columnsToAdd) {
    try {
      sqliteInstance.exec(alterSql);
    } catch {
      // Coluna já existe no schema
    }
  }

  dbInstance = drizzle(sqliteInstance, { schema });
  return { sqlite: sqliteInstance, db: dbInstance };
}

export function getDb() {
  if (!dbInstance) {
    initDatabase();
  }
  return dbInstance;
}

export function getSqlite() {
  if (!sqliteInstance) {
    initDatabase();
  }
  return sqliteInstance;
}
