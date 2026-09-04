import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export interface AuthUser {
  userId: number
  username: string
  role: string
}

const SECRET = process.env.JWT_SECRET || 'fallback_secret'

function getKey() {
  return new TextEncoder().encode(SECRET)
}

export async function verifyTokenEdge(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getKey())
    return {
      userId: Number(payload.userId),
      username: String(payload.username),
      role: String(payload.role)
    }
  } catch {
    return null
  }
}

export async function getTokenEdge(req: NextRequest) {
  const cookieToken = req.cookies.get('auth-token')?.value
  if (cookieToken) return verifyTokenEdge(cookieToken)

  const header = req.headers.get('cookie')
  if (header) {
    const match = header.split(';').map(s => s.trim()).find(s => s.startsWith('auth-token='))
    if (match) return verifyTokenEdge(decodeURIComponent(match.split('=')[1]))
  }
  return null
}
