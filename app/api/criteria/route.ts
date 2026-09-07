import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'
import { getToken } from '../../../lib/auth'

interface CriteriaRow {
  id: number
  name: string
  description: string | null
  percentage: number
  maxScore: number
}

export async function GET() {
  try {
    const pool = await getPool()
    const [rows] = await pool.query<CriteriaRow>('SELECT id, name, description, percentage, maxScore FROM criteria ORDER BY id')
    return NextResponse.json(rows)
  } catch (err) {
    console.error('GET criteria error:', err)
    return NextResponse.json({ error: 'Failed to load criteria' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can manage scoring criteria' }, { status: 403 })

    const body = await req.json()
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: 'Criterion name is required' }, { status: 400 })
    }
    const pool = await getPool()
    const percentage = Number(body.percentage) || 0
    const maxScore = Number(body.maxScore) || 10
    const res = await pool.run(
      'INSERT INTO criteria (name, description, percentage, maxScore) VALUES (?, ?, ?, ?)',
      [String(body.name).trim(), body.description || null, percentage, maxScore]
    )
    return NextResponse.json({
      id: res.insertId,
      name: String(body.name).trim(),
      description: body.description || null,
      percentage,
      maxScore
    })
  } catch (err) {
    console.error('POST criteria error:', err)
    return NextResponse.json({ error: 'Failed to save criterion' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can manage scoring criteria' }, { status: 403 })

    const body = await req.json()
    if (!body.id || !body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: 'Criterion id and name are required' }, { status: 400 })
    }
    const pool = await getPool()
    const percentage = Number(body.percentage) || 0
    const maxScore = Number(body.maxScore) || 10
    await pool.run(
      'UPDATE criteria SET name = ?, description = ?, percentage = ?, maxScore = ? WHERE id = ?',
      [String(body.name).trim(), body.description || null, percentage, maxScore, Number(body.id)]
    )
    return NextResponse.json({
      id: Number(body.id),
      name: String(body.name).trim(),
      description: body.description || null,
      percentage,
      maxScore
    })
  } catch (err) {
    console.error('PUT criteria error:', err)
    return NextResponse.json({ error: 'Failed to update criterion' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can manage scoring criteria' }, { status: 403 })

    const body = await req.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Criterion id is required' }, { status: 400 })
    }
    const pool = await getPool()
    await pool.run('DELETE FROM criteria WHERE id = ?', [Number(body.id)])
    return NextResponse.json({ message: 'Criterion deleted' })
  } catch (err) {
    console.error('DELETE criteria error:', err)
    return NextResponse.json({ error: 'Failed to delete criterion' }, { status: 500 })
  }
}
