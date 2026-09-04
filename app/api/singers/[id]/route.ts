import { NextResponse } from 'next/server'
import { getPool } from '../../../../lib/db'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: 'Singer name is required' }, { status: 400 })
    }
    const id = Number(params.id)
    const pool = await getPool()
    await pool.run(
      'UPDATE singers SET name = ?, song = ?, genre = ? WHERE id = ?',
      [String(body.name).trim(), body.song ? String(body.song).trim() : null, body.genre ? String(body.genre).trim() : null, id]
    )
    return NextResponse.json({ id, name: String(body.name).trim(), song: body.song ?? null, genre: body.genre ?? null })
  } catch (err) {
    console.error('PUT singer error:', err)
    return NextResponse.json({ error: 'Failed to update singer' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const pool = await getPool()
    await pool.run('DELETE FROM singers WHERE id = ?', [id])
    return NextResponse.json({ message: 'Singer deleted' })
  } catch (err) {
    console.error('DELETE singer error:', err)
    return NextResponse.json({ error: 'Failed to delete singer' }, { status: 500 })
  }
}
