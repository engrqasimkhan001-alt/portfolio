-- ============================================
-- SITE CONTENT (key/value copy for public homepage)
-- Run in Supabase SQL Editor after other migrations.
-- ============================================

CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_content_updated ON site_content (updated_at DESC);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read site_content"
    ON site_content
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert site_content"
    ON site_content
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update site_content"
    ON site_content
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete site_content"
    ON site_content
    FOR DELETE
    TO anon, authenticated
    USING (true);

COMMENT ON TABLE site_content IS 'Public homepage copy; keys match data-site on index.html. Edit in Admin → Website.';
