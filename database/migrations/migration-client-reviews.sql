-- ============================================
-- CLIENT REVIEWS TABLE (for Admin-managed reviews)
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS client_reviews (
    id BIGSERIAL PRIMARY KEY,
    client_name TEXT NOT NULL,
    review_text TEXT NOT NULL,
    role_or_location TEXT,
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_reviews_created_at ON client_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_reviews_visible ON client_reviews(visible) WHERE visible = TRUE;

ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read all rows (main site will filter by visible in the query)
CREATE POLICY "Allow read client_reviews"
    ON client_reviews
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow all operations for anon/authenticated (admin uses anon key; restrict in app if needed)
CREATE POLICY "Allow insert client_reviews"
    ON client_reviews
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update client_reviews"
    ON client_reviews
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete client_reviews"
    ON client_reviews
    FOR DELETE
    TO anon, authenticated
    USING (true);
