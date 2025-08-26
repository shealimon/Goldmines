-- Copy this and run it in Supabase SQL Editor
CREATE TABLE business_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reddit_post_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Reddit Post Data
  reddit_title TEXT NOT NULL,
  reddit_content TEXT,
  reddit_author VARCHAR(100),
  reddit_subreddit VARCHAR(100),
  reddit_score INTEGER DEFAULT 0,
  reddit_comments INTEGER DEFAULT 0,
  reddit_url TEXT,
  reddit_permalink TEXT,
  reddit_created_utc BIGINT,
  
  -- Business Idea Analysis (New Structure)
  business_idea_name TEXT,
  opportunity_points TEXT[],
  problems_solved TEXT[],
  target_customers TEXT[],
  market_size TEXT[],
  niche TEXT,
  category TEXT,  
  marketing_strategy TEXT[],
  
  -- Metadata
  analysis_status VARCHAR(50) DEFAULT 'pending',
  full_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_business_ideas_status ON business_ideas(analysis_status);
CREATE INDEX idx_business_ideas_subreddit ON business_ideas(reddit_subreddit);
CREATE INDEX idx_business_ideas_created_at ON business_ideas(created_at);
CREATE INDEX idx_business_ideas_category ON business_ideas(category);
CREATE INDEX idx_business_ideas_niche ON business_ideas(niche);
