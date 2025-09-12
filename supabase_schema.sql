-- Drop existing tables if they exist
DROP TABLE IF EXISTS saved_items CASCADE;
DROP TABLE IF EXISTS business_ideas CASCADE;
DROP TABLE IF EXISTS reddit_posts CASCADE;

-- Drop case study related tables if they exist
DROP TABLE IF EXISTS case_study_tags CASCADE;
DROP TABLE IF EXISTS case_study_quotes CASCADE;
DROP TABLE IF EXISTS case_study_funding CASCADE;
DROP TABLE IF EXISTS case_study_sections CASCADE;
DROP TABLE IF EXISTS case_studies CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

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

-- Create profiles table for user profiles
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    api_credits INTEGER DEFAULT 1000,
    plan_type VARCHAR(50) DEFAULT 'free',
    credits_used_today INTEGER DEFAULT 0,
    last_credit_reset DATE DEFAULT CURRENT_DATE,
    subscription_status TEXT,
    subscription_plan TEXT,
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
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_plan_type ON profiles(plan_type);
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

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (no RLS - unrestricted like other tables)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON saved_items TO authenticated;
GRANT USAGE ON SEQUENCE saved_items_id_seq TO authenticated;

-- ==========================================================
-- CASE STUDY TABLES (Simplified - No unnecessary columns)
-- ==========================================================

-- Main case studies table
CREATE TABLE case_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT,
    cover_image_url TEXT,
    current_revenue TEXT,
    valuation TEXT,
    starting_income TEXT,
    lifetime_revenue TEXT,
    users_count BIGINT,
    market_context TEXT,
    raw_output JSONB,
    sources JSONB,
    confidence JSONB,
    company_url TEXT,
    founder_name TEXT,
    app_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case study sections (ordered)
CREATE TABLE case_study_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_study_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    name TEXT,
    emoji TEXT,
    heading TEXT,
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding rounds
CREATE TABLE case_study_funding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_study_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
    round_name TEXT,
    amount TEXT,
    raised_at DATE,
    investors TEXT[],
    source TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes (simplified - no source column)
CREATE TABLE case_study_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_study_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
    who TEXT,
    quote TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Case study tags junction
CREATE TABLE case_study_tags (
    case_study_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (case_study_id, tag_id)
);

-- Create indexes for case study tables
CREATE INDEX idx_case_studies_slug ON case_studies(slug);
CREATE INDEX idx_case_studies_created_at ON case_studies(created_at);
CREATE INDEX idx_case_study_sections_case_study_id ON case_study_sections(case_study_id);
CREATE INDEX idx_case_study_sections_sort_order ON case_study_sections(sort_order);
CREATE INDEX idx_case_study_funding_case_study_id ON case_study_funding(case_study_id);
CREATE INDEX idx_case_study_quotes_case_study_id ON case_study_quotes(case_study_id);
CREATE INDEX idx_case_study_tags_case_study_id ON case_study_tags(case_study_id);
CREATE INDEX idx_case_study_tags_tag_id ON case_study_tags(tag_id);

-- Create triggers for case study tables
CREATE TRIGGER update_case_studies_updated_at 
    BEFORE UPDATE ON case_studies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- NOTE: All tables are COMPLETELY UNRESTRICTED
-- No RLS enabled, no auth restrictions
-- API endpoints handle user authentication and data filtering