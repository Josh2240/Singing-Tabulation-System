import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  userId: number
  username: string
  role: string
}

const SECRET = process.env.JWT_SECRET || 'fallback_secret'

export function signToken(user: AuthUser) {
  return jwt.sign(user, SECRET, { expiresIn: '8h' })
}

export async function getToken(req?: Request) {
  const store = cookies()
  const c = store.get('auth-token')?.value
  if (c) return verifyToken(c)
  if (req) {
    const header = req.headers.get('cookie')
    if (header) {
      const match = header.split(';').map(s => s.trim()).find(s => s.startsWith('auth-token='))
      if (match) return verifyToken(decodeURIComponent(match.split('=')[1]))
    }
  }
  return null
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, SECRET) as AuthUser
  } catch {
    return null
  }
}
