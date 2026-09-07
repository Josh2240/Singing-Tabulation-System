# DEVELOPER NOTES

## First-run behaviour

- `lib/bootstrap.ts` runs on the first `POST /api/login` and inserts a default
  `admin` user if none exists. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in
  `.env` before first boot to override the defaults.
- `lib/db.ts` creates the `singers`, `scores`, `users`, `criteria`, and
  `score_details` tables on first connection.
- Default singing criteria are seeded automatically when the `criteria` table
  is empty.

## Score formula

For each score entry:

```scoring
weightedScoreEntry = Σ (criteriaRawScore / criteriaMaxScore) × criteriaWeight
```

`total` on the scoreboard is the sum of all `weightedScoreEntry` for that
performer; `avg` is `total / numberOfJudges`.

## Common gotchas

- If you change `JWT_SECRET` after issuing tokens, users will be silently
  logged out — that is expected.
- Deleting a performer cascades to their scores (FK with `ON DELETE CASCADE`).
- If the SQLite file is locked, stop the dev server before deleting
  `data.sqlite`.

## Passwords

- For recording passwords
password
admin username: admin
admin password: admin123.
- Optional for development only.
