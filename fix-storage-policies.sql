-- Fix Supabase Storage RLS Policies for Image Uploads
-- Run this ENTIRE script in your Supabase SQL Editor (Project > SQL Editor > New query)

-- Step 1: Drop our policies if they exist (ignore errors if names differ)
DROP POLICY IF EXISTS "Public Access to Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete Images" ON storage.objects;
DROP POLICY IF EXISTS "images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "images_insert_anon" ON storage.objects;
DROP POLICY IF EXISTS "images_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "images_update_all" ON storage.objects;
DROP POLICY IF EXISTS "images_delete_all" ON storage.objects;

-- Step 2: Create bucket (public = anyone can view)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 3: SELECT - anyone can view files in 'images' bucket
CREATE POLICY "images_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Step 4: INSERT - anon can upload (required for admin panel without login)
CREATE POLICY "images_insert_anon"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'images');

-- Step 5: INSERT - authenticated can upload
CREATE POLICY "images_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Step 6: UPDATE
CREATE POLICY "images_update_all"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Step 7: DELETE
CREATE POLICY "images_delete_all"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'images');
