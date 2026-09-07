import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'
import { getToken } from '../../../lib/auth'

export async function GET() {
  try {
    const pool = await getPool()
    const [rows] = await pool.query('SELECT id, name, song, genre FROM singers ORDER BY id')
    return NextResponse.json(rows)
  } catch (err) {
    console.error('GET singers error:', err)
    return NextResponse.json({ error: 'Failed to load singers' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can manage performers' }, { status: 403 })

    const body = await req.json()
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: 'Singer name is required' }, { status: 400 })
    }
    const pool = await getPool()
    const res = await pool.run(
      'INSERT INTO singers (name, song, genre) VALUES (?, ?, ?)',
      [String(body.name).trim(), body.song ? String(body.song).trim() : null, body.genre ? String(body.genre).trim() : null]
    )
    return NextResponse.json({
      id: res.insertId,
      name: String(body.name).trim(),
      song: body.song ? String(body.song).trim() : null,
      genre: body.genre ? String(body.genre).trim() : null
    })
  } catch (err) {
    console.error('POST singer error:', err)
    return NextResponse.json({ error: 'Failed to add singer' }, { status: 500 })
  }
}
