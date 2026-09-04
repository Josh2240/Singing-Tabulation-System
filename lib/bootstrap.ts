import bcrypt from 'bcryptjs'
import { getPool } from './db'
import { signToken } from './auth'

export async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  try {
    const pool = await getPool()
    const [rows] = await pool.query<{ id: number }>('SELECT id FROM users WHERE username = ?', [username])
    if (rows.length === 0) {
      const hash = await bcrypt.hash(password, 10)
      await pool.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, 'admin'])
      console.log(`[singing-tabulation] Default admin created (${username} / ${password})`)
    }
  } catch (err) {
    const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : String(err)
    console.warn('[singing-tabulation] ensureAdmin failed:', msg)
  }
}

export { signToken }
