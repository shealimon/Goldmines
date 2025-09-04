-- Drop existing tables if they exist
DROP TABLE IF EXISTS saved_items CASCADE;
DROP TABLE IF EXISTS business_ideas CASCADE;
DROP TABLE IF EXISTS reddit_posts CASCADE;

-- Create reddit_posts table (completely unrestricted - no RLS, no auth)
CREATE TABLE reddit_posts (
    id SERIAL PRIMARY KEY,
    reddit_post_id VARCHAR(255) UNIQUE NOT NULL,
    reddit_title TEXT NOT NULL,
    reddit_content TEXT,
    reddit_author VARCHAR(255) NOT NULL,
    reddit_subreddit VARCHAR(100) NOT NULL,
    reddit_score INTEGER DEFAULT 0,
    reddit_comments INTEGER DEFAULT 0,
    reddit_url TEXT,
    reddit_permalink TEXT,
    reddit_created_utc BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_ideas table (with extended founder-pack fields)
CREATE TABLE business_ideas (
    id SERIAL PRIMARY KEY,
    reddit_post_id INTEGER REFERENCES reddit_posts(id) ON DELETE CASCADE,
    business_idea_name VARCHAR(500) NOT NULL,

    -- Existing fields
    opportunity_points TEXT[],
    problems_solved TEXT[],
    target_customers TEXT[],
    market_size TEXT[],
    niche VARCHAR(100),
    category VARCHAR(100),
    marketing_strategy TEXT[],
    analysis_status VARCHAR(50) DEFAULT 'pending',
    full_analysis TEXT,

    -- NEW premium fields
    problem_story TEXT,               -- long-form explanation of pain/problem
    solution_vision TEXT,             -- detailed "what you can build" vision
    revenue_model TEXT[],             -- multiple revenue options (e.g. subscription, ads)
    competitive_advantage TEXT[],     -- why this idea is unique
    next_steps TEXT[],                -- actionable steps for a founder

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketing_ideas table
CREATE TABLE marketing_ideas (
    id SERIAL PRIMARY KEY,
    reddit_post_id INTEGER REFERENCES reddit_posts(id) ON DELETE CASCADE,
    marketing_idea_name VARCHAR(500) NOT NULL,
    idea_description TEXT,
    channel TEXT[],
    target_audience TEXT[],
    potential_impact VARCHAR(20) CHECK (potential_impact IN ('High', 'Medium', 'Low')),
    implementation_tips TEXT[],
    success_metrics TEXT[],
    analysis_status VARCHAR(50) DEFAULT 'pending',
    full_analysis TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_items table for bookmarking business and marketing ideas
CREATE TABLE saved_items (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('business', 'marketing')),
    item_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate bookmarks
    UNIQUE(user_id, item_type, item_id)
);

-- Create indexes for better performance
CREATE INDEX idx_reddit_posts_reddit_post_id ON reddit_posts(reddit_post_id);
CREATE INDEX idx_reddit_posts_subreddit ON reddit_posts(reddit_subreddit);
CREATE INDEX idx_reddit_posts_created_at ON reddit_posts(created_at);
CREATE INDEX idx_business_ideas_reddit_post_id ON business_ideas(reddit_post_id);
CREATE INDEX idx_business_ideas_status ON business_ideas(analysis_status);
CREATE INDEX idx_business_ideas_created_at ON business_ideas(created_at);
CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_saved_items_type ON saved_items(item_type);
CREATE INDEX idx_saved_items_item ON saved_items(item_id);
CREATE INDEX idx_saved_items_created_at ON saved_items(created_at);

-- Add constraints
ALTER TABLE business_ideas 
ADD CONSTRAINT check_full_analysis_quality 
CHECK (full_analysis IS NULL OR LENGTH(TRIM(full_analysis)) >= 50);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reddit_posts_updated_at 
    BEFORE UPDATE ON reddit_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_ideas_updated_at 
    BEFORE UPDATE ON business_ideas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_ideas_updated_at 
    BEFORE UPDATE ON marketing_ideas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (no RLS - unrestricted like other tables)
GRANT ALL ON saved_items TO authenticated;
GRANT USAGE ON SEQUENCE saved_items_id_seq TO authenticated;

-- NOTE: All tables are COMPLETELY UNRESTRICTED
-- No RLS enabled, no auth restrictions
-- API endpoints handle user authentication and data filtering