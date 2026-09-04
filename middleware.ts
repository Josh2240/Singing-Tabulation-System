import { NextRequest, NextResponse } from 'next/server'
import { getTokenEdge } from './lib/auth-edge'

const PUBLIC_PATHS = ['/login', '/api/login', '/api/register', '/favicon.ico']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/logout') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const user = await getTokenEdge(req)

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
