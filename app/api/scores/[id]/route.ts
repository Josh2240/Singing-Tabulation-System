import { NextResponse } from 'next/server'
import { getPool } from '../../../../lib/db'
import { getToken } from '../../../../lib/auth'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can delete scores' }, { status: 403 })

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
