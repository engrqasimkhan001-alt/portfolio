-- ========================================================
-- WEBSITE ANALYTICS & VISITOR HISTORY TABLE
-- Run this script in the Supabase SQL Editor.
-- ========================================================

CREATE TABLE IF NOT EXISTS visitor_sessions (
    id BIGSERIAL PRIMARY KEY,
    visitor_token TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    country TEXT DEFAULT 'Unknown',
    city TEXT DEFAULT 'Unknown',
    browser TEXT DEFAULT 'Unknown',
    os TEXT DEFAULT 'Unknown',
    device_type TEXT DEFAULT 'Unknown',
    screen_resolution TEXT DEFAULT 'Unknown',
    language TEXT DEFAULT 'Unknown',
    timezone TEXT DEFAULT 'Unknown',
    referrer TEXT DEFAULT 'Direct',
    landing_page TEXT DEFAULT '/',
    current_page TEXT DEFAULT '/',
    pages_viewed INTEGER DEFAULT 1,
    session_duration INTEGER DEFAULT 0, -- in seconds
    blogs_viewed JSONB DEFAULT '[]'::jsonb,
    projects_viewed JSONB DEFAULT '[]'::jsonb,
    contact_submitted BOOLEAN DEFAULT FALSE,
    resume_downloaded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for speed
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_created_at ON visitor_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_token ON visitor_sessions(visitor_token);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_id ON visitor_sessions(session_id);

-- Enable RLS
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated insertions (everyone visiting the site generates logs)
CREATE POLICY "Allow public insert visitor_sessions"
    ON visitor_sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow updates (duration heartbeats, form submission, and downloads)
CREATE POLICY "Allow public update visitor_sessions"
    ON visitor_sessions
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow reading logs for dashboard display
CREATE POLICY "Allow read visitor_sessions"
    ON visitor_sessions
    FOR SELECT
    TO anon, authenticated
    USING (true);
