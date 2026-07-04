-- ========================================================
-- ADD CASE STUDY FIELDS TO PORTFOLIO PROJECTS TABLE
-- Run this script in the Supabase SQL Editor.
-- ========================================================

-- Add columns for project case studies
ALTER TABLE portfolio_projects
ADD COLUMN IF NOT EXISTS client_need TEXT,
ADD COLUMN IF NOT EXISTS my_role TEXT,
ADD COLUMN IF NOT EXISTS key_features TEXT,
ADD COLUMN IF NOT EXISTS challenges_solved TEXT,
ADD COLUMN IF NOT EXISTS results_impact TEXT,
ADD COLUMN IF NOT EXISTS github_link TEXT;

COMMENT ON COLUMN portfolio_projects.client_need IS 'The problem or client need statement for the case study.';
COMMENT ON COLUMN portfolio_projects.my_role IS 'Your role in the project (e.g. Lead Developer).';
COMMENT ON COLUMN portfolio_projects.key_features IS 'Key features developed (newline-separated or text block).';
COMMENT ON COLUMN portfolio_projects.challenges_solved IS 'Challenges solved during development.';
COMMENT ON COLUMN portfolio_projects.results_impact IS 'Results or impact achieved.';
COMMENT ON COLUMN portfolio_projects.github_link IS 'Link to the GitHub repository.';
