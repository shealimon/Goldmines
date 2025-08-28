-- GOLDMINES - FRESH DATABASE SETUP
-- Run this in Supabase SQL Editor after deleting the old table

-- ===========================================
-- STEP 1: DROP OLD TABLE (if exists)
-- ===========================================
DROP TABLE IF EXISTS business_ideas CASCADE;
DROP TABLE IF EXISTS business_ideas_backup CASCADE;

-- ===========================================
-- STEP 2: CREATE FRESH TABLE WITH BUILT-IN DUPLICATE PREVENTION
-- ===========================================
CREATE TABLE business_ideas (
  id BIGSERIAL PRIMARY KEY,
  
  -- Reddit post information
  reddit_post_id VARCHAR(255) NOT NULL,
  reddit_title TEXT NOT NULL,
  reddit_content TEXT DEFAULT '',
  reddit_author VARCHAR(255) NOT NULL,
  reddit_subreddit VARCHAR(100) NOT NULL,
  reddit_score INTEGER DEFAULT 0,
  reddit_comments INTEGER DEFAULT 0,
  reddit_url TEXT,
  reddit_permalink TEXT,
  reddit_created_utc BIGINT,
  
  -- Business idea analysis
  business_idea_name TEXT,
  opportunity_points TEXT[],
  problems_solved TEXT[],
  target_customers TEXT[],
  market_size TEXT[],
  niche TEXT,
  category TEXT,
  marketing_strategy TEXT[],
  analysis_status VARCHAR(50) DEFAULT 'pending',
  full_analysis TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ===========================================
  -- BUILT-IN UNIQUE CONSTRAINTS (NO DUPLICATES POSSIBLE)
  -- ===========================================
  
  -- Constraint 1: Each Reddit post can only be saved once
  CONSTRAINT unique_reddit_post_id UNIQUE (reddit_post_id),
  
  -- Constraint 2: Same user cannot post same title multiple times  
  CONSTRAINT unique_title_author UNIQUE (reddit_title, reddit_author),
  
  -- ===========================================
  -- DATA QUALITY CONSTRAINTS
  -- ===========================================
  
  -- Ensure essential fields are not empty
  CONSTRAINT check_reddit_post_id_not_empty 
    CHECK (reddit_post_id IS NOT NULL AND LENGTH(TRIM(reddit_post_id)) > 0),
    
  CONSTRAINT check_title_not_empty 
    CHECK (reddit_title IS NOT NULL AND LENGTH(TRIM(reddit_title)) > 0),
    
  CONSTRAINT check_author_not_empty 
    CHECK (reddit_author IS NOT NULL AND LENGTH(TRIM(reddit_author)) > 0),
    
  CONSTRAINT check_subreddit_not_empty 
    CHECK (reddit_subreddit IS NOT NULL AND LENGTH(TRIM(reddit_subreddit)) > 0),
    
  -- Ensure full_analysis is meaningful (if present)
  CONSTRAINT check_full_analysis_quality 
    CHECK (full_analysis IS NULL OR LENGTH(TRIM(full_analysis)) >= 50),
    
  -- Ensure business_idea_name is meaningful (if present)
  CONSTRAINT check_business_idea_name_quality 
    CHECK (business_idea_name IS NULL OR LENGTH(TRIM(business_idea_name)) >= 5),
    
  -- Ensure valid analysis status
  CONSTRAINT check_analysis_status_valid 
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- ===========================================
-- STEP 3: CREATE PERFORMANCE INDEXES
-- ===========================================

-- Index for fast duplicate checking by post ID
CREATE INDEX idx_business_ideas_reddit_post_id ON business_ideas(reddit_post_id);

-- Index for fast duplicate checking by title + author
CREATE INDEX idx_business_ideas_title_author ON business_ideas(reddit_title, reddit_author);

-- Index for fast author searches
CREATE INDEX idx_business_ideas_author ON business_ideas(reddit_author);

-- Index for fast subreddit searches
CREATE INDEX idx_business_ideas_subreddit ON business_ideas(reddit_subreddit);

-- Index for fast date-based queries
CREATE INDEX idx_business_ideas_created_at ON business_ideas(created_at DESC);

-- Index for fast analysis status queries
CREATE INDEX idx_business_ideas_analysis_status ON business_ideas(analysis_status);

-- Composite index for fast Reddit post lookups
CREATE INDEX idx_business_ideas_reddit_lookup ON business_ideas(reddit_subreddit, reddit_author, created_at DESC);

-- ===========================================
-- STEP 4: CREATE AUTO-UPDATE TRIGGER FOR updated_at
-- ===========================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function before any update
CREATE TRIGGER update_business_ideas_updated_at 
    BEFORE UPDATE ON business_ideas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- STEP 5: CREATE HELPFUL VIEWS (OPTIONAL)
-- ===========================================

-- View for quick duplicate checking
CREATE OR REPLACE VIEW duplicate_check_view AS
SELECT 
  reddit_title,
  reddit_author,
  COUNT(*) as occurrence_count,
  ARRAY_AGG(id ORDER BY id) as ids,
  ARRAY_AGG(reddit_subreddit ORDER BY id) as subreddits
FROM business_ideas 
GROUP BY reddit_title, reddit_author;

-- View for recent posts
CREATE OR REPLACE VIEW recent_posts_view AS
SELECT 
  id,
  reddit_title,
  reddit_author,
  reddit_subreddit,
  business_idea_name,
  analysis_status,
  created_at
FROM business_ideas 
ORDER BY created_at DESC;

-- ===========================================
-- STEP 6: INSERT SOME TEST DATA (OPTIONAL)
-- ===========================================

-- Test 1: This should work (first post)
INSERT INTO business_ideas (
  reddit_post_id, 
  reddit_title, 
  reddit_author, 
  reddit_subreddit,
  business_idea_name,
  full_analysis,
  analysis_status
) VALUES (
  'test_post_001',
  'Test Business Idea - SaaS for Productivity',
  'test_user_001',
  'entrepreneur',
  'Productivity SaaS Platform',
  'This is a detailed analysis of a productivity SaaS platform that helps teams collaborate more effectively by providing real-time sync capabilities.',
  'completed'
);

-- Test 2: This should FAIL (duplicate post ID)
-- INSERT INTO business_ideas (reddit_post_id, reddit_title, reddit_author, reddit_subreddit) 
-- VALUES ('test_post_001', 'Different Title', 'different_user', 'saas');

-- Test 3: This should FAIL (same title + author)
-- INSERT INTO business_ideas (reddit_post_id, reddit_title, reddit_author, reddit_subreddit) 
-- VALUES ('test_post_002', 'Test Business Idea - SaaS for Productivity', 'test_user_001', 'saas');

-- ===========================================
-- STEP 7: VERIFICATION QUERIES
-- ===========================================

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'business_ideas'
ORDER BY ordinal_position;

-- Check all constraints
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'business_ideas'
ORDER BY constraint_type, constraint_name;

-- Check all indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'business_ideas'
ORDER BY indexname;

-- Verify no duplicates exist (should return 0 rows)
SELECT * FROM duplicate_check_view WHERE occurrence_count > 1;

-- Show table statistics
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT reddit_post_id) as unique_post_ids,
  COUNT(DISTINCT (reddit_title, reddit_author)) as unique_title_author_combinations,
  COUNT(DISTINCT reddit_author) as unique_authors,
  COUNT(DISTINCT reddit_subreddit) as unique_subreddits,
  MIN(created_at) as first_post,
  MAX(created_at) as latest_post
FROM business_ideas;

-- ===========================================
-- SUCCESS! Your table is now DUPLICATE-PROOF!
-- ===========================================

-- The table will automatically:
-- ✅ Reject duplicate Reddit post IDs
-- ✅ Reject same title by same author  
-- ✅ Ensure data quality with constraints
-- ✅ Update timestamps automatically
-- ✅ Provide fast queries with indexes
-- ✅ Give helpful views for monitoring

SELECT 'DATABASE SETUP COMPLETE! 🚀' as status;
