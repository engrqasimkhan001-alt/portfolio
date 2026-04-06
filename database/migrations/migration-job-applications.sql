-- Create job applications table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS job_applications (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    experience_years INTEGER,
    resume_url TEXT,
    cover_letter TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_position ON job_applications(position);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (submit applications)
CREATE POLICY "Allow public insert on job_applications"
    ON job_applications
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow public to read (for admin panel - will be filtered by admin auth)
CREATE POLICY "Allow read on job_applications"
    ON job_applications
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow update (for admin to change status)
CREATE POLICY "Allow update on job_applications"
    ON job_applications
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_applications_updated_at();
