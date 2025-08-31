import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { redditAPI } from '@/lib/reddit';

// Helper function to detect duplicate posts across subreddits
const detectDuplicatePost = async (post: any, supabase: any): Promise<{ isDuplicate: boolean; reason?: string; existingId?: string }> => {
  try {
    // 1. Check by exact reddit_post_id (same post)
    const { data: existingById, error: idError } = await supabase
      .from('marketing_ideas')
      .select('id, reddit_title, reddit_subreddit')
      .eq('reddit_post_id', post.id)
      .single();

    if (existingById) {
      return { 
        isDuplicate: true, 
        reason: `Same Reddit post already exists (ID: ${post.id})`, 
        existingId: existingById.id 
      };
    }

    // 2. Check by title and content similarity (same content, different post)
    const normalizedTitle = post.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalizedContent = post.content.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    // Check for very similar titles first
    const { data: existingByTitle, error: titleError } = await supabase
      .from('marketing_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_author, reddit_content')
      .ilike('reddit_title', `%${normalizedTitle.substring(0, 30)}%`)
      .limit(3);

    if (existingByTitle && existingByTitle.length > 0) {
      for (const existing of existingByTitle) {
        const existingTitle = existing.reddit_title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const existingContent = existing.reddit_content.toLowerCase().replace(/[^\w\s]/g, '').trim();
        
        const titleSimilarity = calculateSimilarity(normalizedTitle, existingTitle);
        const contentSimilarity = calculateSimilarity(normalizedContent, existingContent);
        
        // If both title and content are very similar, it's likely a duplicate
        if (titleSimilarity > 0.7 && contentSimilarity > 0.6) {
          return { 
            isDuplicate: true, 
            reason: `Very similar content (Title: ${Math.round(titleSimilarity * 100)}%, Content: ${Math.round(contentSimilarity * 100)}%) already exists in r/${existing.reddit_subreddit} by ${existing.reddit_author}`, 
            existingId: existing.id 
          };
        }
      }
    }

    // 3. Check by additional title similarity patterns
    const { data: additionalTitleMatches, error: additionalTitleError } = await supabase
      .from('marketing_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_author')
      .ilike('reddit_title', `%${normalizedTitle.substring(0, 15)}%`)
      .limit(2)
      .neq('id', existingByTitle?.[0]?.id || '')
      .single();

    if (additionalTitleMatches) {
      const existingTitle = additionalTitleMatches.reddit_title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const similarity = calculateSimilarity(normalizedTitle, existingTitle);
      
      if (similarity > 0.8) {
        return { 
          isDuplicate: true, 
          reason: `Very similar title (${Math.round(similarity * 100)}% match) already exists in r/${additionalTitleMatches.reddit_subreddit}`, 
          existingId: additionalTitleMatches.id 
        };
      }
    }

    // 4. Check by author + similar content (same user posting similar ideas)
    const { data: existingByAuthor, error: authorError } = await supabase
      .from('marketing_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_content')
      .eq('reddit_author', post.author)
      .limit(5);

    if (existingByAuthor && existingByAuthor.length > 0) {
      for (const existing of existingByAuthor) {
        const existingContent = existing.reddit_content.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const currentContent = post.content.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const contentSimilarity = calculateSimilarity(currentContent, existingContent);
        
        if (contentSimilarity > 0.7) {
          return { 
            isDuplicate: true, 
            reason: `Similar content by same author (${Math.round(contentSimilarity * 100)}% match) already exists in r/${existing.reddit_subreddit}`, 
            existingId: existing.id 
          };
        }
      }
    }

    return { isDuplicate: false };
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
    const marketingPosts = [];
    for (const post of redditPosts) {
      const isMarketingIdea = await openaiService.preFilterMarketingIdea(
        `${post.title}\n${post.content}`
      );
      
      if (isMarketingIdea) {
        marketingPosts.push(post);
      }
    }

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

    // Analyze the post with OpenAI
    const analyzedPost = await openaiService.analyzeMarketingPost(reddit_post);

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

    // Enhanced duplicate detection across subreddits
    const duplicateCheck = await detectDuplicatePost(reddit_post, supabase);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json({
        success: false,
        message: 'Duplicate post detected across subreddits',
        reason: duplicateCheck.reason,
        existing_id: duplicateCheck.existingId
      }, { status: 409 });
    }

    // Save the marketing idea to the database
    const marketingIdeaData = {
      reddit_post_id: reddit_post.id,
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
      potential_impact: analyzedPost.potential_impact,
      implementation_tips: analyzedPost.implementation_tips,
      success_metrics: analyzedPost.success_metrics,
      analysis_status: 'completed',
      full_analysis: analyzedPost.full_analysis
    };

    console.log('💾 Saving marketing idea to database...');

    const { data, error } = await supabase
      .from('marketing_ideas')
      .insert(marketingIdeaData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Error saving marketing idea', error: error.message },
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

export async function GET() {
  try {
    console.log('📖 GET /api/marketing-ideas - Fetching marketing ideas...');
    
    // Fetch all marketing ideas from the database
    const { data, error } = await supabase
      .from('marketing_ideas')
      .select('*')
      .eq('analysis_status', 'completed')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase select error:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching marketing ideas', error: error.message },
        { status: 500 }
      );
    }
    
    console.log('📊 Marketing ideas retrieved:', data?.length || 0);
    
    return NextResponse.json({
      success: true,
      marketing_ideas: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching marketing ideas' },
      { status: 500 }
    );
  }
}
