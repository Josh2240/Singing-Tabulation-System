import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool } from '../../../lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.username || !body.password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }
    if (String(body.password).length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
    }

    const pool = await getPool()
    const hashed = await bcrypt.hash(String(body.password), 10)

    try {
      const result = await pool.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [String(body.username), hashed, body.role === 'admin' ? 'admin' : 'judge']
      )
      return NextResponse.json({ message: 'User created', id: result.insertId, username: body.username })
    } catch (insertErr) {
      const msg = insertErr && typeof insertErr === 'object' && 'message' in insertErr ? (insertErr as { message: string }).message : String(insertErr)
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
      throw insertErr
    }
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
