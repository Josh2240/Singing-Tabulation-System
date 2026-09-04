import { NextResponse } from 'next/server'
import { getToken } from '../../../lib/auth'

export async function GET(req: Request) {
  const user = await getToken(req as any)
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
  return NextResponse.json({ authenticated: true, user })
}
