import * as mysql from 'mysql2/promise'
import type { ResultSetHeader } from 'mysql2/promise'
import * as path from 'node:path'

interface Pool {
  query: <T = any>(sql: string, params?: any[]) => Promise<[T[], null]>
  run: (sql: string, params?: any[]) => Promise<{ insertId?: number; affectedRows?: number }>
}

let pool: Pool | null = null

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message
  }
  return String(err)
}

const SCHEMA_MYSQL: string[] = [
  `CREATE TABLE IF NOT EXISTS singers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    song VARCHAR(255),
    genre VARCHAR(120),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    singerId INT,
    judge VARCHAR(255),
    score DOUBLE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (singerId) REFERENCES singers(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'judge',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    percentage DOUBLE NOT NULL DEFAULT 0,
    maxScore DOUBLE NOT NULL DEFAULT 10.0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS score_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scoreId INT,
    criteriaId INT,
    score DOUBLE NOT NULL,
    FOREIGN KEY (scoreId) REFERENCES scores(id) ON DELETE CASCADE,
    FOREIGN KEY (criteriaId) REFERENCES criteria(id)
  )`
]

const SCHEMA_SQLITE: string[] = [
  `CREATE TABLE IF NOT EXISTS singers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    song TEXT,
    genre TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    singerId INTEGER,
    judge TEXT,
    score REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (singerId) REFERENCES singers(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'judge',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS criteria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    percentage REAL NOT NULL DEFAULT 0,
    maxScore REAL NOT NULL DEFAULT 10.0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS score_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scoreId INTEGER,
    criteriaId INTEGER,
    score REAL NOT NULL,
    FOREIGN KEY (scoreId) REFERENCES scores(id) ON DELETE CASCADE,
    FOREIGN KEY (criteriaId) REFERENCES criteria(id)
  )`
]

const DEFAULT_CRITERIA: Array<{ name: string; description: string; percentage: number; maxScore: number }> = [
  { name: 'Vocal Quality', description: 'Tone, control, and clarity of the voice', percentage: 30, maxScore: 10 },
  { name: 'Pitch Accuracy', description: 'Staying in tune throughout the performance', percentage: 25, maxScore: 10 },
  { name: 'Stage Presence', description: 'Confidence, charisma, and audience engagement', percentage: 20, maxScore: 10 },
  { name: 'Song Interpretation', description: 'Emotional delivery and expression of lyrics', percentage: 15, maxScore: 10 },
  { name: 'Overall Impact', description: 'Memorability and artistic impression', percentage: 10, maxScore: 10 }
]

export async function getPool(): Promise<Pool> {
  if (pool) return pool

  const mysqlHost = process.env.MYSQL_HOST
  const mysqlUser = process.env.MYSQL_USER

  if (mysqlHost && mysqlUser) {
    try {
      const p = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'singing_tabulation',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      })

      await p.query('SELECT 1')
      for (const stmt of SCHEMA_MYSQL) {
        await p.query(stmt)
      }

      const mysqlAdapter: Pool = {
        query: async <T = any>(sql: string, params: any[] = []): Promise<[T[], null]> => {
          const [rows] = await p.query(sql, params)
          return [rows as T[], null]
        },
        run: async (sql: string, params: any[] = []) => {
          const [res] = await p.query<ResultSetHeader>(sql, params)
          return { insertId: res.insertId, affectedRows: res.affectedRows }
        }
      }

      await seedCriteriaIfEmpty(mysqlAdapter, 'mysql')

      pool = mysqlAdapter
      return pool
    } catch (err) {
      console.warn('MySQL connection failed, falling back to SQLite:', getErrorMessage(err))
    }
  }

  const sqlite3Mod = await import('sqlite3')
  const sqlite3 = (sqlite3Mod.default || sqlite3Mod).verbose()
  const dbFile = path.join(process.cwd(), 'data.sqlite')
  const db = new sqlite3.Database(dbFile)

  function allAsync(sql: string, params: any[] = []) {
    return new Promise<any[]>((resolve, reject) => {
      db.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) return reject(err)
        resolve(rows)
      })
    })
  }

  function runAsync(sql: string, params: any[] = []) {
    return new Promise<{ lastID: number; changes: number }>((resolve, reject) => {
      db.run(sql, params, function (err: Error | null) {
        if (err) return reject(err)
        resolve({ lastID: this.lastID, changes: this.changes })
      })
    })
  }

  await new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      let pending = SCHEMA_SQLITE.length
      let errored = false
      for (const stmt of SCHEMA_SQLITE) {
        db.run(stmt, (err: Error | null) => {
          if (errored) return
          if (err) { errored = true; return reject(err) }
          pending -= 1
          if (pending === 0) resolve()
        })
      }
    })
  })

  pool = {
    query: async <T = any>(sql: string, params: any[] = []): Promise<[T[], null]> => {
      const rows = await allAsync(sql, params)
      return [rows as T[], null]
    },
    run: async (sql: string, params: any[] = []): Promise<{ insertId?: number; affectedRows?: number }> => {
      const result = await runAsync(sql, params)
      return { insertId: result.lastID, affectedRows: result.changes }
    }
  }

  await seedCriteriaIfEmpty(pool, 'sqlite')

  return pool
}

async function seedCriteriaIfEmpty(p: Pool, kind: 'mysql' | 'sqlite') {
  try {
    const [rows] = await p.query<{ c: number }>('SELECT COUNT(*) as c FROM criteria')
    const count = Number(rows[0]?.c ?? 0)
    if (count === 0) {
      for (const c of DEFAULT_CRITERIA) {
        await p.run('INSERT INTO criteria (name, description, percentage, maxScore) VALUES (?, ?, ?, ?)', [
          c.name,
          c.description,
          c.percentage,
          c.maxScore
        ])
      }
    }
  } catch (err) {
    console.warn(`Could not seed default criteria (${kind}):`, getErrorMessage(err))
  }
}
