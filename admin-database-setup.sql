-- Admin Panel Database Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- PORTFOLIO PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_projects (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('Mobile App', 'Web Application', 'Both')),
    technologies TEXT NOT NULL,
    image_url TEXT,
    project_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_created_at ON portfolio_projects(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read (view projects on website)
CREATE POLICY "Allow public read on portfolio_projects"
    ON portfolio_projects
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy: Allow authenticated users to insert/update/delete (admin panel)
-- Note: You'll need to set up proper authentication for this
-- For now, we'll allow authenticated users (you can restrict this later)
CREATE POLICY "Allow authenticated insert on portfolio_projects"
    ON portfolio_projects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on portfolio_projects"
    ON portfolio_projects
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on portfolio_projects"
    ON portfolio_projects
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    email TEXT,
    image_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on active status
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);

-- Create index on created_at
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read active team members
CREATE POLICY "Allow public read active team members"
    ON team_members
    FOR SELECT
    TO anon, authenticated
    USING (active = true);

-- Policy: Allow authenticated users to manage team members
CREATE POLICY "Allow authenticated insert on team_members"
    ON team_members
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on team_members"
    ON team_members
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on team_members"
    ON team_members
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- UPDATE TRIGGERS (for updated_at timestamps)
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for portfolio_projects
DROP TRIGGER IF EXISTS update_portfolio_projects_updated_at ON portfolio_projects;
CREATE TRIGGER update_portfolio_projects_updated_at
    BEFORE UPDATE ON portfolio_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for team_members
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTES FOR SECURITY
-- ============================================
-- 
-- IMPORTANT: The current policies allow any authenticated user to modify data.
-- For production, you should:
-- 
-- 1. Set up proper authentication (Supabase Auth)
-- 2. Create a user role system
-- 3. Restrict policies to only admin users
-- 
-- Example secure policy:
-- CREATE POLICY "Only admins can modify"
--     ON portfolio_projects
--     FOR ALL
--     TO authenticated
--     USING (
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- Or use a service role key in your admin panel backend
-- (never expose service role key in frontend code!)
