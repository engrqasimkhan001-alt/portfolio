# Database

- **`schema.sql`** — Baseline schema (full setup). Run in Supabase SQL Editor for a fresh project.
- **`migrations/`** — Incremental scripts (reviews, job applications, `image_urls`, storage policies, etc.). Run each once when upgrading an existing database.
- **`migrations/seed-portfolio-complete.sql`** — Optional: insert all portfolio rows in Supabase SQL Editor.
- **Admin:** **Projects → Import site portfolio** adds the same projects from the browser (needs `image_urls`; run `migration-project-images.sql` if inserts fail).

See also **`docs/SUPABASE_SETUP.md`**.
