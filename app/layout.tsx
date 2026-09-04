import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import LogoutButton from './components/LogoutButton'

export const metadata = {
  title: 'Singing Contest Tabulation System',
  description: 'Real-time scoreboard and judge scoring for singing contests.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell">
        <header className="site-header">
          <nav className="navbar navbar-expand-lg site-navbar">
            <div className="container">
              <a className="navbar-brand brand-lockup" href="/" aria-label="Singing Contest Tabulation home">
                <span className="brand-seal" aria-hidden="true">
                  <i className="bi bi-music-note-beamed" />
                </span>
                <span className="brand-copy">
                  <span className="brand-title">Singing Contest Tabulation</span>
                  <span className="brand-subtitle">Live Scoreboard</span>
                </span>
              </a>
              <div className="d-none d-md-flex align-items-center gap-3">
                <div className="nav-status" aria-label="System status">
                  <span className="status-dot" aria-hidden="true" />
                  Ready for scoring
                </div>
                <LogoutButton />
              </div>
            </div>
          </nav>
        </header>

        <main className="container app-content">{children}</main>

        <footer className="site-footer">
          <div className="footer-brand">Singing Contest Tabulation System</div>
          <div className="footer-meta">
            <span>© {new Date().getFullYear()} Singing Contest Organizers</span>
            <span className="footer-divider" aria-hidden="true">•</span>
            <span>Built for live vocal competitions</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
