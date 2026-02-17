-- ===================================
-- ANIME TRACKER DATABASE SCHEMA
-- ===================================
-- Run this SQL in your Supabase SQL Editor
-- to set up the COMPLETE database structure with User Authentication.

-- ===================================
-- 1. CREATE TABLES (with User ID)
-- ===================================

-- Anime table: stores main anime information
-- user_id is MANDATORY to link data to a specific user
CREATE TABLE IF NOT EXISTS anime (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Series', 'Movie')),
    status TEXT NOT NULL CHECK (status IN ('Watching', 'Completed', 'Plan to Watch', 'Dropped')),
    poster_url TEXT,
    watched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Seasons table: stores season information for series
-- Linked to anime_id, so it automatically belongs to the same user
CREATE TABLE IF NOT EXISTS seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    total_episodes INTEGER NOT NULL,
    last_watched INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_last_watched CHECK (last_watched >= 0 AND last_watched <= total_episodes)
);

-- ===================================
-- 2. CREATE INDEXES
-- ===================================

-- Improve query performance for user-specific Lookups
CREATE INDEX IF NOT EXISTS idx_anime_user_id ON anime(user_id);
CREATE INDEX IF NOT EXISTS idx_anime_status ON anime(status);
CREATE INDEX IF NOT EXISTS idx_anime_type ON anime(type);
CREATE INDEX IF NOT EXISTS idx_anime_created_at ON anime(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seasons_anime_id ON seasons(anime_id);
CREATE INDEX IF NOT EXISTS idx_seasons_season_number ON seasons(season_number);

-- ===================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ===================================

ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 4. CREATE RLS POLICIES (STRICT USER ONLY)
-- ===================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON anime;
DROP POLICY IF EXISTS "Enable insert access for all users" ON anime;
DROP POLICY IF EXISTS "Enable update access for all users" ON anime;
DROP POLICY IF EXISTS "Enable delete access for all users" ON anime;
DROP POLICY IF EXISTS "Users can view their own anime" ON anime;
DROP POLICY IF EXISTS "Users can insert their own anime" ON anime;
DROP POLICY IF EXISTS "Users can update their own anime" ON anime;
DROP POLICY IF EXISTS "Users can delete their own anime" ON anime;

-- Anime table policies
CREATE POLICY "Users can view their own anime" ON anime
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anime" ON anime
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anime" ON anime
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anime" ON anime
    FOR DELETE USING (auth.uid() = user_id);

-- Seasons table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON seasons;
DROP POLICY IF EXISTS "Enable insert access for all users" ON seasons;
DROP POLICY IF EXISTS "Enable update access for all users" ON seasons;
DROP POLICY IF EXISTS "Enable delete access for all users" ON seasons;
DROP POLICY IF EXISTS "Users can view seasons of their anime" ON seasons;
DROP POLICY IF EXISTS "Users can insert seasons for their anime" ON seasons;
DROP POLICY IF EXISTS "Users can update seasons of their anime" ON seasons;
DROP POLICY IF EXISTS "Users can delete seasons of their anime" ON seasons;

CREATE POLICY "Users can view seasons of their anime" ON seasons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM anime 
            WHERE anime.id = seasons.anime_id 
            AND anime.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert seasons for their anime" ON seasons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM anime 
            WHERE anime.id = seasons.anime_id 
            AND anime.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update seasons of their anime" ON seasons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM anime 
            WHERE anime.id = seasons.anime_id 
            AND anime.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete seasons of their anime" ON seasons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM anime 
            WHERE anime.id = seasons.anime_id 
            AND anime.user_id = auth.uid()
        )
    );

-- ===================================
-- 5. CREATE STORAGE BUCKET
-- ===================================

-- 1. Create a new bucket named: anime-posters
-- 2. Make it PUBLIC

INSERT INTO storage.buckets (id, name, public)
VALUES ('anime-posters', 'anime-posters', true)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- 6. STORAGE POLICIES
-- ===================================

-- Allow public read access to posters (Anyone can view images)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'anime-posters');

-- Allow authenticated users to upload (Only logged-in users)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'anime-posters');

-- Allow users to update their own uploads
DROP POLICY IF EXISTS "User Update Own Objects" ON storage.objects;
CREATE POLICY "User Update Own Objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'anime-posters' AND auth.uid() = owner);

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "User Delete Own Objects" ON storage.objects;
CREATE POLICY "User Delete Own Objects"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'anime-posters' AND auth.uid() = owner);

-- ===================================
-- SETUP COMPLETE!
-- ===================================
