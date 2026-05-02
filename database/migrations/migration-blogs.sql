-- ============================================
-- BLOGS TABLE (admin CRUD + public published posts)
-- Run in Supabase SQL Editor after other migrations.
-- ============================================

CREATE TABLE IF NOT EXISTS blogs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    "type" TEXT NOT NULL DEFAULT 'Article',
    cover_image_url TEXT,
    cover_image_urls JSONB,
    author_name TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    reading_time INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT blogs_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_blogs_status_created ON blogs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs (slug);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs (featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs (status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs (category);
CREATE INDEX IF NOT EXISTS idx_blogs_type ON blogs ("type");

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Public + admin client use anon key; app filters published on the site. Admin lists all rows.
CREATE POLICY "Allow read blogs"
    ON blogs
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert blogs"
    ON blogs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update blogs"
    ON blogs
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete blogs"
    ON blogs
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- Optional: keep updated_at in sync (requires pg extensions off by default — app sets updated_at too)
COMMENT ON TABLE blogs IS 'Blog posts; run migration-blogs.sql. Public site queries status=published.';
