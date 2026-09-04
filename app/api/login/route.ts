import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPool } from '../../../lib/db'
import { ensureAdmin } from '../../../lib/bootstrap'

interface UserRow {
  id: number
  username: string
  password: string
  role: string
}

export async function POST(req: Request) {
  try {
    await ensureAdmin()
    const body = await req.json()
    if (!body.username || !body.password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const pool = await getPool()
    const [users] = await pool.query<UserRow>('SELECT id, username, password, role FROM users WHERE username = ?', [body.username])

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = users[0]
    const isValid = await bcrypt.compare(body.password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    )

    const res = NextResponse.json({ message: 'Login successful', username: user.username, role: user.role })
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/'
    })
    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
