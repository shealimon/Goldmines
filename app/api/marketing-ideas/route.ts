import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { redditAPI } from '@/lib/reddit';

// Helper function to detect duplicate posts across subreddits
const detectDuplicatePost = async (post: any, supabase: any): Promise<{ isDuplicate: boolean; reason?: string; existingId?: string }> => {
  try {
    // Temporarily disable duplicate detection to avoid foreign key relationship issues
    // TODO: Re-enable once database schema is properly applied
    console.log('⚠️ Duplicate detection temporarily disabled due to schema issues');
    return { isDuplicate: false };

    // Original duplicate detection code (commented out until schema is fixed)
    /*
    // 1. Check if Reddit post exists in reddit_posts table first
    const { data: existingRedditPost, error: redditError } = await supabase
      .from('reddit_posts')
      .select('id')
      .eq('reddit_post_id', post.id)
      .single();

    if (redditError && redditError.code !== 'PGRST116') {
      console.error('Error checking for existing Reddit post:', redditError);
      return { isDuplicate: false };
    }

    if (existingRedditPost) {
      // Reddit post exists, check if it already has marketing ideas
      const { data: existingMarketingIdea, error: marketingError } = await supabase
        .from('marketing_ideas')
        .select('id, marketing_idea_name')
        .eq('reddit_post_id', existingRedditPost.id) // Use database ID, not Reddit post ID
        .limit(1);

      if (marketingError && marketingError.code !== 'PGRST116') {
        console.error('Error checking for existing marketing ideas:', marketingError);
        return { isDuplicate: false };
      }

      if (existingMarketingIdea && existingMarketingIdea.length > 0) {
        return { 
          isDuplicate: true, 
          reason: `Reddit post already has marketing ideas (Reddit ID: ${post.id})`, 
          existingId: existingMarketingIdea[0].id 
        };
      }
    }

    // 2. Only check for exact title matches (less aggressive)
    const { data: existingByExactTitle, error: exactTitleError } = await supabase
      .from('marketing_ideas')
      .select('id, reddit_title, reddit_subreddit')
      .eq('reddit_title', post.title)
      .single();

    if (existingByExactTitle) {
      return { 
        isDuplicate: true, 
        reason: `Exact same title already exists in r/${existingByExactTitle.reddit_subreddit}`, 
        existingId: existingByExactTitle.id 
      };
    }

    return { isDuplicate: false };
    */
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    return { isDuplicate: false };
  }
};

// Helper function to calculate text similarity (simple implementation)
const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/marketing-ideas - Processing marketing ideas...');
    
    const body = await request.json();
    const { limit = 10 } = body;

    // Hardcoded marketing subreddits as per user requirements
    const marketingSubreddits = [
      'marketing',
      'digital_marketing', 
      'GrowthHacking',
      'marketinghacks',
      'ContentMarketing',
      'socialmedia',
      'advertising',
      'Entrepreneur',
      'startups'
    ];

    console.log(`📱 Fetching posts from ${marketingSubreddits.length} marketing subreddits...`);
    
    // Fetch posts from all marketing subreddits
    let allRedditPosts: any[] = [];
    for (const subreddit of marketingSubreddits) {
      const posts = await redditAPI.getPosts(subreddit, Math.ceil(limit / marketingSubreddits.length));
      if (posts && posts.length > 0) {
        allRedditPosts.push(...posts);
      }
    }
    
    const redditPosts = allRedditPosts.slice(0, limit);
    
    if (!redditPosts || redditPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No posts found in marketing subreddits`
      }, { status: 404 });
    }

    console.log(`📊 Found ${redditPosts.length} posts from marketing subreddits`);

    // Filter posts that contain marketing ideas
    // For now, use all Reddit posts for marketing ideas
    // TODO: Implement proper marketing idea filtering
    const marketingPosts = redditPosts;

    console.log(`🎯 Filtered to ${marketingPosts.length} marketing idea posts`);

    if (marketingPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No marketing ideas found in marketing subreddits`
      }, { status: 404 });
    }

    // Process the first marketing post (you can extend this to process multiple)
    const reddit_post = marketingPosts[0];
    
    console.log(`🔍 Analyzing marketing post: "${reddit_post.title}"`);

    // Analyze the post with OpenAI using the marketing analysis method
    const analyzedPosts = await openaiService.analyzeMarketingPosts([reddit_post]);
    const analyzedPost = analyzedPosts[0];

    if (analyzedPost.analysis_status === 'failed') {
      return NextResponse.json({
        success: false,
        message: 'Failed to analyze marketing post',
        error: analyzedPost.full_analysis
      }, { status: 400 });
    }

    // Validate the analysis
    if (!analyzedPost.marketing_idea_name || analyzedPost.marketing_idea_name.length < 5) {
      return NextResponse.json({
        success: false,
        message: 'Analysis incomplete - marketing_idea_name is empty or too short',
        idea_name_length: analyzedPost.marketing_idea_name?.length || 0
      }, { status: 400 });
    }

    // Check if marketing idea already exists for this Reddit post
    const { data: existingMarketingIdea, error: checkError } = await supabase
      .from('marketing_ideas')
      .select('id, marketing_idea_name')
      .eq('reddit_title', reddit_post.title)
      .eq('reddit_author', reddit_post.author)
      .single();

    if (existingMarketingIdea) {
      console.log('🚫 Marketing idea already exists for this Reddit post, skipping...');
      return NextResponse.json({
        success: false,
        message: 'Marketing idea already exists for this Reddit post',
        existing_id: existingMarketingIdea.id,
        existing_name: existingMarketingIdea.marketing_idea_name
      }, { status: 409 });
    }

    // First, save the Reddit post to reddit_posts table if it doesn't exist
    let redditPostDbId;
    const { data: existingRedditPost, error: redditError } = await supabase
      .from('reddit_posts')
      .select('id')
      .eq('reddit_post_id', reddit_post.id)
      .single();

    if (redditError && redditError.code === 'PGRST116') {
      // Reddit post doesn't exist, create it
      const redditPostData = {
        reddit_post_id: reddit_post.id,
        reddit_title: reddit_post.title,
        reddit_content: reddit_post.content || '',
        reddit_author: reddit_post.author,
        reddit_subreddit: reddit_post.subreddit,
        reddit_score: reddit_post.score || 0,
        reddit_comments: reddit_post.num_comments || 0,
        reddit_url: reddit_post.url,
        reddit_permalink: reddit_post.permalink,
        reddit_created_utc: reddit_post.created_utc
      };

      const { data: newRedditPost, error: insertError } = await supabase
        .from('reddit_posts')
        .insert(redditPostData)
        .select()
        .single();

      if (insertError) {
        console.error('Error saving Reddit post:', insertError);
        return NextResponse.json({
          success: false,
          message: 'Failed to save Reddit post',
          error: insertError.message
        }, { status: 500 });
      }

      redditPostDbId = newRedditPost.id;
    } else if (existingRedditPost) {
      // Reddit post exists, use its database ID
      redditPostDbId = existingRedditPost.id;
    } else {
      console.error('Error checking for existing Reddit post:', redditError);
      return NextResponse.json({
        success: false,
        message: 'Error checking for existing Reddit post',
        error: redditError.message
      }, { status: 500 });
    }

    // Normalize potential_impact to match database constraints
    const normalizePotentialImpact = (impact: string): 'High' | 'Medium' | 'Low' => {
      const normalized = impact?.toLowerCase().trim();
      if (normalized?.includes('high') || normalized?.includes('strong') || normalized?.includes('significant')) {
        return 'High';
      } else if (normalized?.includes('low') || normalized?.includes('weak') || normalized?.includes('minimal')) {
        return 'Low';
      } else {
        return 'Medium'; // Default fallback
      }
    };

    // Save the marketing idea to the database
    const marketingIdeaData = {
      reddit_post_id: redditPostDbId, // Use database ID, not Reddit post ID
      reddit_title: reddit_post.title,
      reddit_content: reddit_post.content || '',
      reddit_author: reddit_post.author,
      reddit_subreddit: reddit_post.subreddit,
      reddit_score: reddit_post.score || 0,
      reddit_comments: reddit_post.num_comments || 0,
      reddit_url: reddit_post.url,
      reddit_permalink: reddit_post.permalink,
      reddit_created_utc: reddit_post.created_utc,
      marketing_idea_name: analyzedPost.marketing_idea_name,
      idea_description: analyzedPost.idea_description,
      channel: analyzedPost.channel,
      target_audience: analyzedPost.target_audience,
      potential_impact: normalizePotentialImpact(analyzedPost.potential_impact),
      implementation_tips: analyzedPost.implementation_tips,
      success_metrics: analyzedPost.success_metrics,
      analysis_status: 'completed',
      full_analysis: analyzedPost.full_analysis
    };

    console.log('💾 Saving marketing idea to database...');

    const { data, error } = await supabaseAdmin
      .from('marketing_ideas')
      .insert(marketingIdeaData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      console.error('❌ Marketing idea data that failed:', marketingIdeaData);
      
      // Handle duplicate key constraint violation
      if (error.code === '23505') {
        console.log('🚫 Duplicate marketing idea detected - skipping insertion');
        return NextResponse.json({
          success: false,
          message: 'Marketing idea already exists for this Reddit post',
          error: 'Duplicate entry detected',
          error_code: error.code
        }, { status: 409 });
      }
      
      // Handle other constraint violations
      if (error.code === '23514') {
        console.log('🚫 Check constraint violation detected');
        return NextResponse.json({
          success: false,
          message: 'Invalid data format for marketing idea',
          error: error.message,
          error_code: error.code
        }, { status: 400 });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error saving marketing idea', 
          error: error.message,
          error_code: error.code,
          error_details: error.details
        },
        { status: 500 }
      );
    }

    console.log('✅ Marketing idea saved successfully:', data.id);

    return NextResponse.json({
      success: true,
      message: 'Marketing idea analyzed and saved successfully',
      marketing_idea: data
    });

  } catch (error) {
    console.error('❌ Error processing marketing idea:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing marketing idea', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📖 GET /api/marketing-ideas - Fetching marketing ideas...');
    
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    console.log(`📄 Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    
    // First, get the total count
    const { count: totalCount, error: countError } = await supabase
      .from('marketing_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('analysis_status', 'completed');
    
    if (countError) {
      console.error('❌ Supabase count error:', countError);
      return NextResponse.json(
        { success: false, message: 'Error counting marketing ideas', error: countError.message },
        { status: 500 }
      );
    }
    
    // Then fetch the paginated data
    const { data, error } = await supabase
      .from('marketing_ideas')
      .select('*')
      .eq('analysis_status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Supabase select error:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching marketing ideas', error: error.message },
        { status: 500 }
      );
    }
    
    console.log(`📊 Marketing ideas retrieved: ${data?.length || 0} of ${totalCount || 0}`);
    
    return NextResponse.json({
      success: true,
      marketing_ideas: data || [],
      count: totalCount || 0
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching marketing ideas' },
      { status: 500 }
    );
  }
}
