import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

export async function GET() {
  try {
    const pool = await getPool()
    const [rows] = await pool.query('SELECT id, singerId, judge, score, createdAt FROM scores ORDER BY createdAt DESC')
    return NextResponse.json(rows)
  } catch (err) {
    console.error('GET scores error:', err)
    return NextResponse.json({ error: 'Failed to load scores' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.singerId || body.score === undefined || body.score === null) {
      return NextResponse.json({ error: 'singerId and score are required' }, { status: 400 })
    }
    const pool = await getPool()
    const res = await pool.run(
      'INSERT INTO scores (singerId, judge, score) VALUES (?, ?, ?)',
      [Number(body.singerId), body.judge ? String(body.judge).trim() : 'Anonymous', Number(body.score)]
    )
    const insertId = res.insertId

    if (Array.isArray(body.criteriaScores)) {
      for (const cs of body.criteriaScores) {
        if (cs && cs.criteriaId && cs.score !== undefined && cs.score !== null) {
          await pool.run(
            'INSERT INTO score_details (scoreId, criteriaId, score) VALUES (?, ?, ?)',
            [Number(insertId), Number(cs.criteriaId), Number(cs.score)]
          )
        }
      }
    }

    return NextResponse.json({
      id: insertId,
      singerId: Number(body.singerId),
      judge: body.judge ? String(body.judge).trim() : 'Anonymous',
      score: Number(body.score)
    })
  } catch (err) {
    console.error('POST score error:', err)
    return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
