# Singing Contest Tabulation System

A fullstack tabulation web app for **singing contests**, modeled after the
[CIT-Pageant-Tabulation-System](https://github.com/Josh2240/CIT-Pageant-Tabulation-System)
project but redesigned end-to-end for vocal performances.

- Register performers with their song and genre
- Define weighted vocal criteria (Vocal Quality, Pitch Accuracy, Stage Presence,
  Song Interpretation, Overall Impact — pre-seeded, fully editable)
- Judges submit scores per criterion and the scoreboard re-ranks in real time
- Admin and judge accounts (JWT cookie auth, bcrypt password hashing)
- Judges can only submit scores under their own account; admins manage performers,
  scoring criteria, and score corrections
- MySQL when configured, automatic SQLite fallback (`data.sqlite`)

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Bootstrap 5, Bootstrap Icons, Tailwind CSS
- **Backend:** Next.js API routes, `mysql2` (with `sqlite3` fallback), `jsonwebtoken`, `bcryptjs`
- **Auth:** HttpOnly cookie + JWT (8h)

## Quick start

```bash
npm install
cp .env.example .env       # edit MySQL credentials if you have them
npm run dev
```

Open <http://localhost:3000> and sign in.

### Default admin

On first start, the app seeds a default admin account:

| Username | Password   |
| -------- | ---------- |
| `admin`  | `admin123` |

You can change these by setting `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
**before** the first run. Authenticated admins can create judge accounts through
`/api/register`.

### Database

- Set `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` in `.env`
  to use MySQL. Tables and the default criteria are created automatically.
- If MySQL env vars are missing or the connection fails, the app falls back to
  a local `data.sqlite` file so you can run the system with zero setup.

## Project layout

```files
app/
  api/                # Next.js route handlers
    singers/          # CRUD for performers
    criteria/         # CRUD for scoring criteria
    scores/           # Score submissions
    scoreboard/       # Aggregated, weighted rankings
    login/ register/ logout/ me/
  components/         # LogoutButton
  login/page.tsx      # Login page
  layout.tsx          # Root layout with navbar + footer
  page.tsx            # Renders <App />
  globals.css         # Singing-themed styles
src/
  App.tsx             # Tabulation workspace UI
lib/
  db.ts               # MySQL pool + SQLite fallback
  auth.ts             # JWT helpers
  bootstrap.ts        # Auto-create default admin
middleware.ts         # Protects routes (redirects to /login)
```

## Notes

- Weighted totals use the formula
  `Σ (criteriaScore / maxScore) × criteriaWeight` per submission, summed
  across all judges. This keeps every weight comparable regardless of how
  many judges have submitted.
- The "Clear" button on each row deletes **all** scores for that performer.
- Judges submit scores with their authenticated username; the score API ignores
  client-supplied judge names.
- The criteria editor and score/performer management actions are restricted to
  users with `role === 'admin'`. Score submission is restricted to judges.

## Singing-Tabulation-System
