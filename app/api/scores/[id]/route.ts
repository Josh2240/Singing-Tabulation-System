import { NextResponse } from 'next/server'
import { getPool } from '../../../../lib/db'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const pool = await getPool()
    await pool.run('DELETE FROM score_details WHERE scoreId = ?', [id])
    await pool.run('DELETE FROM scores WHERE id = ?', [id])
    return NextResponse.json({ message: 'Score deleted' })
  } catch (err) {
    console.error('DELETE score error:', err)
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 })
  }
}
