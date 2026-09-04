'use client'

import { useEffect, useState } from 'react'

type Singer = { id: number; name: string; song: string | null; genre: string | null }
type ScoreRow = {
  id: number
  name: string
  song: string | null
  genre: string | null
  total: number
  avg: number
  count: number
  criteriaScores: Record<number, number>
}
type ScoreEntry = { id: number; singerId: number; judge: string; score: number; createdAt: string }
type Criteria = { id: number; name: string; description: string | null; percentage: number; maxScore: number }
type User = { id: number; username: string; role: string }

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [singers, setSingers] = useState<Singer[]>([])
  const [scoreboard, setScoreboard] = useState<ScoreRow[]>([])
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [criteria, setCriteria] = useState<Criteria[]>([])

  const [name, setName] = useState('')
  const [song, setSong] = useState('')
  const [genre, setGenre] = useState('')
  const [editingSingerId, setEditingSingerId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editSong, setEditSong] = useState('')
  const [editGenre, setEditGenre] = useState('')

  const [selectedSinger, setSelectedSinger] = useState<string | number>('')
  const [judge, setJudge] = useState('')
  const [score, setScore] = useState('')
  const [criteriaScores, setCriteriaScores] = useState<Record<number, string>>({})

  const [criteriaName, setCriteriaName] = useState('')
  const [criteriaDesc, setCriteriaDesc] = useState('')
  const [criteriaPercentage, setCriteriaPercentage] = useState('0')
  const [criteriaMax, setCriteriaMax] = useState('10')
  const [editingCriteriaId, setEditingCriteriaId] = useState<number | null>(null)

  async function loadSingers() {
    try {
      const res = await fetch('/api/singers')
      if (!res.ok) throw new Error('Failed to load singers')
      setSingers(await res.json())
    } catch (err) {
      console.error('Error loading singers:', err)
    }
  }
  async function loadScoreboard() {
    try {
      const res = await fetch('/api/scoreboard')
      if (!res.ok) throw new Error('Failed to load scoreboard')
      setScoreboard(await res.json())
    } catch (err) {
      console.error('Error loading scoreboard:', err)
    }
  }
  async function loadScores() {
    try {
      const res = await fetch('/api/scores')
      if (!res.ok) throw new Error('Failed to load scores')
      setScores(await res.json())
    } catch (err) {
      console.error('Error loading scores:', err)
    }
  }
  async function loadCriteria() {
    try {
      const res = await fetch('/api/criteria')
      if (!res.ok) throw new Error('Failed to load criteria')
      setCriteria(await res.json())
    } catch (err) {
      console.error('Error loading criteria:', err)
    }
  }
  async function loadUser() {
    try {
      const res = await fetch('/api/me')
      if (!res.ok) throw new Error('Failed to load user')
      const data = await res.json()
      if (data.authenticated) setUser(data.user)
    } catch (err) {
      console.error('Error loading user:', err)
    }
  }

  useEffect(() => {
    loadSingers()
    loadScoreboard()
    loadScores()
    loadCriteria()
    loadUser()
  }, [])

  async function addSinger(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const res = await fetch('/api/singers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, song, genre })
      })
      if (!res.ok) throw new Error('Failed to add singer')
      setName('')
      setSong('')
      setGenre('')
      await loadSingers()
      await loadScoreboard()
    } catch (err) {
      console.error('Error adding singer:', err)
    }
  }

  async function updateSinger(id: number) {
    if (!editName.trim()) return
    try {
      const res = await fetch(`/api/singers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, song: editSong, genre: editGenre })
      })
      if (!res.ok) throw new Error('Failed to update singer')
      setEditingSingerId(null)
      await loadSingers()
      await loadScoreboard()
    } catch (err) {
      console.error('Error updating singer:', err)
    }
  }

  async function deleteSinger(id: number) {
    if (!confirm('Delete this performer and all of their scores?')) return
    try {
      const res = await fetch(`/api/singers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete singer')
      await loadSingers()
      await loadScoreboard()
      await loadScores()
    } catch (err) {
      console.error('Error deleting singer:', err)
    }
  }

  async function deleteScore(id: number) {
    if (!confirm('Delete this score entry?')) return
    try {
      const res = await fetch(`/api/scores/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete score')
      await loadScoreboard()
      await loadScores()
    } catch (err) {
      console.error('Error deleting score:', err)
    }
  }

  async function submitScore(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSinger || score === '') return
    const numericScore = Number(score)
    if (Number.isNaN(numericScore)) return

    const criteriaScoreList = criteria.map(c => ({
      criteriaId: c.id,
      score: Number(criteriaScores[c.id]) || 0
    }))

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singerId: Number(selectedSinger),
          judge,
          score: numericScore,
          criteriaScores: criteriaScoreList
        })
      })
      if (!res.ok) throw new Error('Failed to submit score')
      setJudge('')
      setScore('')
      setCriteriaScores({})
      await loadScoreboard()
      await loadScores()
    } catch (err) {
      console.error('Error submitting score:', err)
    }
  }

  async function saveCriteria(e: React.FormEvent) {
    e.preventDefault()
    if (!criteriaName.trim()) return
    try {
      const res = await fetch('/api/criteria', {
        method: editingCriteriaId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCriteriaId,
          name: criteriaName,
          description: criteriaDesc,
          percentage: Number(criteriaPercentage),
          maxScore: Number(criteriaMax)
        })
      })
      if (!res.ok) throw new Error('Failed to save criteria')
      setCriteriaName('')
      setCriteriaDesc('')
      setCriteriaPercentage('0')
      setCriteriaMax('10')
      setEditingCriteriaId(null)
      await loadCriteria()
    } catch (err) {
      console.error('Error saving criteria:', err)
    }
  }

  async function deleteCriteria(id: number) {
    if (!confirm('Delete this scoring criterion?')) return
    try {
      const res = await fetch('/api/criteria', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Failed to delete criteria')
      await loadCriteria()
    } catch (err) {
      console.error('Error deleting criteria:', err)
    }
  }

  const totalCriteriaPercentage = criteria.reduce((sum, c) => sum + Number(c.percentage || 0), 0)

  return (
    <div className="tabulation-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> Singing contest management
          </p>
          <h1>Every <span>note</span> scored with precision.</h1>
          <p className="hero-description">
            Register performers, capture judge scores by vocal criteria, and watch the live leaderboard update as the night unfolds.
          </p>
          <div className="hero-stats" aria-label="Current tabulation summary">
            <div className="hero-stat">
              <strong>{singers.length}</strong>
              <span>Performers</span>
            </div>
            <div className="hero-stat">
              <strong>{scoreboard.length}</strong>
              <span>On the board</span>
            </div>
            <div className="hero-stat">
              <strong>{scores.length}</strong>
              <span>Scores logged</span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-rings" />
          <i className="bi bi-music-note-beamed hero-trophy" />
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-5">
          <section className="card panel-card singers-card mb-4">
            <div className="panel-heading">
              <div className="panel-heading-copy">
                <span className="panel-icon panel-icon--violet" aria-hidden="true">
                  <i className="bi bi-mic-fill" />
                </span>
                <div>
                  <h2 className="panel-title">Manage performers</h2>
                  <p className="panel-description">Add each singer and the song they will perform.</p>
                </div>
              </div>
            </div>
            <form onSubmit={addSinger} className="singer-form">
              <div className="singer-form-field">
                <label className="form-label" htmlFor="singer-name">Singer</label>
                <input id="singer-name" className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Performer name" />
              </div>
              <div className="singer-form-field">
                <label className="form-label" htmlFor="singer-song">Song</label>
                <input id="singer-song" className="form-control" value={song} onChange={e => setSong(e.target.value)} placeholder="Song title" />
              </div>
              <div className="singer-form-field">
                <label className="form-label" htmlFor="singer-genre">Genre</label>
                <input id="singer-genre" className="form-control" value={genre} onChange={e => setGenre(e.target.value)} placeholder="Pop, OPM, etc." />
              </div>
              <button className="btn btn-brand" type="submit">
                <i className="bi bi-plus-lg" /> Add performer
              </button>
            </form>
          </section>

          {user?.role === 'admin' && (
            <section className="card panel-card criteria-card mb-4">
              <div className="panel-heading">
                <div className="panel-heading-copy">
                  <span className="panel-icon panel-icon--pink" aria-hidden="true">
                    <i className="bi bi-sliders" />
                  </span>
                  <div>
                    <h2 className="panel-title">Scoring criteria</h2>
                    <p className="panel-description">Define categories, weights, and maximum scores for judges.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={saveCriteria} className="criteria-form">
                <div className="row g-2 mb-3">
                  <div className="col-12">
                    <label className="form-label">Criterion</label>
                    <input className="form-control form-control-sm" value={criteriaName} onChange={e => setCriteriaName(e.target.value)} placeholder="e.g. Vocal Quality" required />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label">Weight (%)</label>
                    <input className="form-control form-control-sm" type="number" step="1" min="0" max="100" value={criteriaPercentage} onChange={e => setCriteriaPercentage(e.target.value)} placeholder="20" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Max score</label>
                    <input className="form-control form-control-sm" type="number" value={criteriaMax} onChange={e => setCriteriaMax(e.target.value)} placeholder="10" />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-brand" type="submit">
                    <i className="bi bi-plus-lg" /> {editingCriteriaId ? 'Update' : 'Add'} criterion
                  </button>
                  {editingCriteriaId && (
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setEditingCriteriaId(null); setCriteriaName(''); setCriteriaDesc(''); setCriteriaPercentage('0'); setCriteriaMax('10') }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {criteria.length > 0 && (
                <div className="table-responsive mt-3">
                  <table className="table criteria-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Criterion</th>
                        <th style={{ width: 140 }}>Weight</th>
                        <th style={{ width: 90 }}>Max</th>
                        <th style={{ width: 90 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((c, idx) => (
                        <tr key={c.id}>
                          <td className="text-center"><span className="criteria-index">{idx + 1}</span></td>
                          <td>
                            <strong>{c.name}</strong>
                            {c.description && <div className="text-muted small">{c.description}</div>}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: 8 }}>
                                <div className="progress-bar" role="progressbar" style={{ width: `${Math.min(Number(c.percentage), 100)}%` }} aria-valuenow={Number(c.percentage)} aria-valuemin={0} aria-valuemax={100} />
                              </div>
                              <span className="badge bg-primary rounded-pill">{c.percentage}%</span>
                            </div>
                          </td>
                          <td className="text-center">{c.maxScore}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => { setEditingCriteriaId(c.id); setCriteriaName(c.name); setCriteriaDesc(c.description || ''); setCriteriaPercentage(String(c.percentage)); setCriteriaMax(String(c.maxScore)) }}>
                                <i className="bi bi-pencil" />
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCriteria(c.id)}>
                                <i className="bi bi-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-active">
                        <td colSpan={2} className="fw-bold">Total weight</td>
                        <td className="fw-bold text-center">{totalCriteriaPercentage}%</td>
                        <td className="fw-bold text-center">{criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          )}

          <section className="card panel-card submit-score-card">
            <div className="panel-heading">
              <div className="panel-heading-copy">
                <span className="panel-icon panel-icon--gold" aria-hidden="true">
                  <i className="bi bi-pencil-square" />
                </span>
                <div>
                  <h2 className="panel-title">Submit a score</h2>
                  <p className="panel-description">Record a judge&apos;s evaluation for the current performer.</p>
                </div>
              </div>
            </div>
            <form onSubmit={submitScore} className="score-form">
              <label className="form-label" htmlFor="singer-select">Performer</label>
              <select id="singer-select" className="form-select" value={selectedSinger} onChange={e => setSelectedSinger(e.target.value)}>
                <option value="">Select performer</option>
                {singers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.song ? ` — ${s.song}` : ''}
                  </option>
                ))}
              </select>
              <div className="score-input-grid">
                <div>
                  <label className="form-label" htmlFor="judge-name">Judge <span>(optional)</span></label>
                  <input id="judge-name" className="form-control" value={judge} onChange={e => setJudge(e.target.value)} placeholder="Judge name" />
                </div>
                <div>
                  <label className="form-label" htmlFor="score-value">Total score</label>
                  <input id="score-value" className="form-control" value={score} onChange={e => setScore(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00" />
                </div>
              </div>

              {criteria.length > 0 && (
                <div className="criteria-scores mt-3">
                  <label className="form-label fw-bold">Criteria scores</label>
                  {criteria.map(c => (
                    <div key={c.id} className="row g-2 mb-2 align-items-center">
                      <div className="col-6">
                        <label className="form-label mb-0 small">{c.name} {c.description && <span className="text-muted">({c.description})</span>}</label>
                      </div>
                      <div className="col-4">
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          step="0.01"
                          min="0"
                          max={Number(c.maxScore)}
                          value={criteriaScores[c.id] || ''}
                          onChange={e => setCriteriaScores(prev => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder={`0 / ${c.maxScore}`}
                        />
                      </div>
                      <div className="col-2 text-end text-muted small">
                        {c.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn btn-submit" type="submit">
                <i className="bi bi-check2-circle" /> Submit score
              </button>
            </form>
          </section>
        </div>

        <div className="col-lg-7">
          <section className="card panel-card scoreboard-card">
            <div className="panel-heading scoreboard-heading">
              <div className="panel-heading-copy">
                <span className="panel-icon panel-icon--gold" aria-hidden="true">
                  <i className="bi bi-trophy-fill" />
                </span>
                <div>
                  <h2 className="panel-title">Live scoreboard</h2>
                  <p className="panel-description">Weighted totals ranked highest to lowest.</p>
                </div>
              </div>
              <span className="scoreboard-status">
                <i className="bi bi-bar-chart-fill" /> Score totals
              </span>
            </div>
            {scoreboard.length === 0 ? (
              <div className="scoreboard-empty">
                <span className="empty-icon" aria-hidden="true">
                  <i className="bi bi-music-note-list" />
                </span>
                <h3>The stage is set</h3>
                <p>Add performers and submit the first score to see live rankings here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table scoreboard-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 58 }}>Rank</th>
                      <th>Performer</th>
                      {criteria.map(c => (
                        <th key={c.id} className="text-end" title={c.description || c.name}>{c.name} ({c.percentage}%)</th>
                      ))}
                      <th className="text-end">Total</th>
                      <th className="text-end">Avg</th>
                      <th className="text-end">Votes</th>
                      <th style={{ width: 110 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreboard.map((s, i) => (
                      <tr key={s.id} className={i < 3 ? `leader-row leader-row--${i + 1}` : undefined}>
                        <td><span className="rank-chip">{i + 1}</span></td>
                        <td>
                          {editingSingerId === s.id ? (
                            <div className="d-flex flex-column gap-1">
                              <input className="form-control form-control-sm" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" autoFocus />
                              <div className="d-flex gap-1">
                                <input className="form-control form-control-sm" value={editSong} onChange={e => setEditSong(e.target.value)} placeholder="Song" />
                                <input className="form-control form-control-sm" value={editGenre} onChange={e => setEditGenre(e.target.value)} placeholder="Genre" />
                              </div>
                              <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-success" onClick={() => updateSinger(s.id)}>
                                  <i className="bi bi-check" /> Save
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditingSingerId(null)}>
                                  <i className="bi bi-x" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="d-flex align-items-start gap-2">
                              <div>
                                <div className="singer-name">{s.name}</div>
                                {s.song && <div className="singer-song"><i className="bi bi-music-note" /> {s.song}{s.genre ? ` · ${s.genre}` : ''}</div>}
                              </div>
                              <button className="btn btn-sm btn-outline-primary ms-auto" onClick={() => { setEditingSingerId(s.id); setEditName(s.name); setEditSong(s.song || ''); setEditGenre(s.genre || '') }} aria-label="Edit performer">
                                <i className="bi bi-pencil" />
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteSinger(s.id)} aria-label="Delete performer">
                                <i className="bi bi-trash" />
                              </button>
                            </div>
                          )}
                        </td>
                        {criteria.map(c => (
                          <td key={c.id} className="text-end">
                            {s.criteriaScores[c.id] != null ? Number(s.criteriaScores[c.id]).toFixed(2) : '-'}
                          </td>
                        ))}
                        <td className="text-end"><span className="score-value">{s.total.toFixed(2)}</span></td>
                        <td className="text-end">{s.avg.toFixed(2)}</td>
                        <td className="text-end">{s.count}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteScore(s.id)} aria-label="Delete all scores for this performer">
                            <i className="bi bi-trash" /> Clear
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card panel-card all-scores-card mt-4 mb-4">
            <div className="panel-heading">
              <div className="panel-heading-copy">
                <span className="panel-icon panel-icon--cyan" aria-hidden="true">
                  <i className="bi bi-list-ul" />
                </span>
                <div>
                  <h2 className="panel-title">All score entries</h2>
                  <p className="panel-description">Individual score submissions. Remove mistakes here.</p>
                </div>
              </div>
            </div>
            {scores.length === 0 ? (
              <div className="scoreboard-empty">
                <span className="empty-icon" aria-hidden="true">
                  <i className="bi bi-inbox-fill" />
                </span>
                <h3>No scores yet</h3>
                <p>Submit a score above to start building the scoreboard.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Performer</th>
                      <th>Judge</th>
                      <th className="text-end">Score</th>
                      <th className="text-end">Date</th>
                      <th style={{ width: 80 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map(sc => {
                      const singer = singers.find(s => s.id === sc.singerId)
                      return (
                        <tr key={sc.id}>
                          <td>{singer?.name ?? `#${sc.singerId}`}</td>
                          <td>{sc.judge || '—'}</td>
                          <td className="text-end">{Number(sc.score).toFixed(2)}</td>
                          <td className="text-end">{new Date(sc.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteScore(sc.id)} aria-label="Delete score">
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
