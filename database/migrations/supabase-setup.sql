-- Supabase Database Setup for Contact Form
-- Run this SQL in your Supabase SQL Editor

-- Create the contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Create an index on read status for filtering unread messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert (submit contact form)
CREATE POLICY "Allow public insert on contact_messages"
    ON contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create a policy that allows only authenticated users to read (you can modify this)
-- For now, we'll allow public read for testing, but you should restrict this in production
CREATE POLICY "Allow public read on contact_messages"
    ON contact_messages
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Optional: Create a function to mark messages as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE contact_messages
    SET read = TRUE
    WHERE id = message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a view for unread messages count
CREATE OR REPLACE VIEW unread_messages_count AS
SELECT COUNT(*) as count
FROM contact_messages
WHERE read = FALSE;
