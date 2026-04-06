-- Supabase Storage Setup for Image Uploads
-- Run this in your Supabase SQL Editor

-- Create the storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
CREATE POLICY "Public Access to Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Allow Upload Images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'images');

-- Allow users to update their own images
CREATE POLICY "Allow Update Images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Allow users to delete images
CREATE POLICY "Allow Delete Images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'images');
