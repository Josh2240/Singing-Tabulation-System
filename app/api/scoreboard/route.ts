import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

interface Singer {
  id: number
  name: string
  song: string | null
  genre: string | null
}

interface Criteria {
  id: number
  name: string
  description: string | null
  percentage: number
  maxScore: number
}

interface ScoreDetail {
  scoreId: number
  criteriaId: number
  score: number
}

interface ScoreboardRow {
  id: number
  name: string
  song: string | null
  genre: string | null
  total: number
  avg: number
  count: number
  criteriaScores: Record<number, number>
}

export async function GET() {
  try {
    const pool = await getPool()

    const [singers] = await pool.query<Singer>('SELECT id, name, song, genre FROM singers')
    const [criteria] = await pool.query<Criteria>('SELECT id, name, description, percentage, maxScore FROM criteria ORDER BY id')
    const [scoreDetails] = await pool.query<ScoreDetail>('SELECT scoreId, criteriaId, score FROM score_details')

    const detailsByScore = new Map<number, ScoreDetail[]>()
    for (const sd of scoreDetails) {
      if (!detailsByScore.has(sd.scoreId)) detailsByScore.set(sd.scoreId, [])
      detailsByScore.get(sd.scoreId)!.push(sd)
    }

    const totals: ScoreboardRow[] = []

    for (const s of singers) {
      const [scores] = await pool.query<{ id: number; score: number }>('SELECT id, score FROM scores WHERE singerId = ?', [s.id])
      let totalWeighted = 0
      const criteriaScores: Record<number, number> = {}

      for (const sc of scores) {
        const details = detailsByScore.get(sc.id) || []
        let scoreSum = 0
        for (const d of details) {
          const crit = criteria.find(cr => cr.id === d.criteriaId)
          if (crit) {
            const contribution = (d.score / crit.maxScore) * crit.percentage
            scoreSum += contribution
            criteriaScores[crit.id] = (criteriaScores[crit.id] || 0) + d.score
          }
        }
        totalWeighted += scoreSum
      }

      totals.push({
        id: s.id,
        name: s.name,
        song: s.song,
        genre: s.genre,
        total: totalWeighted,
        avg: scores.length ? totalWeighted / scores.length : 0,
        count: scores.length,
        criteriaScores
      })
    }

    totals.sort((a, b) => b.total - a.total)
    return NextResponse.json(totals)
  } catch (err) {
    console.error('GET scoreboard error:', err)
    return NextResponse.json({ error: 'Failed to load scoreboard' }, { status: 500 })
  }
}
