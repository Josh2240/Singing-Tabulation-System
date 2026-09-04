'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-layout">
      <div className="login-wrapper">
        <div className="login-form-container">
          <div className="login-logo text-center mb-4">
            <i className="bi bi-music-note-beamed login-logo-icon" />
            <h1 className="login-title">Singing Contest Tabulation</h1>
            <p className="login-subtitle">Sign in to start scoring performers</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="form-control login-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="form-control login-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            {error && <div className="alert alert-danger login-error">{error}</div>}
            <button className="btn btn-brand w-100 login-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="login-hint">
              Default admin: <strong>admin</strong> / <strong>admin123</strong>
              <br />
              (Set <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> in your environment to change this.)
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
