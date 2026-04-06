-- Add multiple images support for portfolio projects
-- Run this in Supabase SQL Editor

-- Add image_urls column (array of URLs, order = display order)
ALTER TABLE portfolio_projects
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Backfill: copy existing image_url into image_urls if empty
UPDATE portfolio_projects
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url != ''
  AND (image_urls IS NULL OR image_urls = '[]'::jsonb);
