-- ============================================
-- COMPLETE DATABASE SETUP FOR wOs PORTFOLIO
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (submit contact form)
CREATE POLICY "Allow public insert on contact_messages"
    ON contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow reading messages
CREATE POLICY "Allow public read on contact_messages"
    ON contact_messages
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow updating (mark as read)
CREATE POLICY "Allow update on contact_messages"
    ON contact_messages
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 2. PORTFOLIO PROJECTS TABLE
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_created_at ON portfolio_projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Allow public to read projects
CREATE POLICY "Allow public read on portfolio_projects"
    ON portfolio_projects
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow insert
CREATE POLICY "Allow insert on portfolio_projects"
    ON portfolio_projects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow update
CREATE POLICY "Allow update on portfolio_projects"
    ON portfolio_projects
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow delete
CREATE POLICY "Allow delete on portfolio_projects"
    ON portfolio_projects
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- 3. TEAM MEMBERS TABLE
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at DESC);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow public to read active team members
CREATE POLICY "Allow public read on team_members"
    ON team_members
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow insert
CREATE POLICY "Allow insert on team_members"
    ON team_members
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow update
CREATE POLICY "Allow update on team_members"
    ON team_members
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow delete
CREATE POLICY "Allow delete on team_members"
    ON team_members
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- 4. AUTOMATIC TIMESTAMP UPDATES
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
-- 5. INSERT SAMPLE DATA (Optional)
-- ============================================

-- Add yourself as the first team member
INSERT INTO team_members (name, role, bio, email, active)
VALUES (
    'Engr Qasim Khan',
    'Founder & Lead Developer',
    'Passionate software developer specializing in mobile and web applications. Founder of Wave Of Solution Technology (wOs), dedicated to delivering high-quality solutions for clients worldwide.',
    'engrqasimkhan001@gmail.com',
    true
);

-- Add a sample project
INSERT INTO portfolio_projects (title, description, platform, technologies)
VALUES (
    'E-Commerce Mobile App',
    'A full-featured e-commerce application for iOS and Android with real-time inventory management, secure payment integration, and user-friendly interface.',
    'Mobile App',
    'Flutter, Firebase, Stripe API'
);

-- ============================================
-- DONE! Your database is ready.
-- ============================================
