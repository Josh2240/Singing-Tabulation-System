'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary"
      onClick={handleLogout}
      style={{ minHeight: '2.4rem', padding: '0.35rem 0.9rem', borderRadius: '0.6rem' }}
    >
      <i className="bi bi-box-arrow-right me-1" />
      Sign out
    </button>
  )
}
