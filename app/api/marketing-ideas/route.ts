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

    // 2. Check for exact title matches by joining with reddit_posts
    const { data: existingByExactTitle, error: exactTitleError } = await supabase
      .from('marketing_ideas')
      .select(`
        id,
        reddit_posts (
          reddit_title,
          reddit_subreddit
        )
      `)
      .eq('reddit_posts.reddit_title', post.title)
      .single();

    if (existingByExactTitle) {
      return { 
        isDuplicate: true, 
        reason: `Exact same title already exists in r/${existingByExactTitle.reddit_posts?.reddit_subreddit}`, 
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
    const body = await request.json();
    console.log('🔍 Marketing Ideas API called with:', body);
    
    // Check if this is a bulk fetch and analyze action
    if (body.action === 'fetch_and_analyze') {
      console.log('🚀 Calling handleBulkMarketingFetchAndAnalyze...');
      return await handleBulkMarketingFetchAndAnalyze();
    }
    
    // Original logic for single Reddit post analysis
    const { reddit_post } = body;

    if (!reddit_post) {
      return NextResponse.json({ 
        success: false, 
        message: 'Reddit post data is required' 
      }, { status: 400 });
    }

    console.log('🚀 Processing Reddit post for marketing idea analysis:', reddit_post.title.substring(0, 50));

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
    // First find the reddit post ID, then check if marketing idea exists for it
    const { data: redditPost, error: redditPostError } = await supabase
      .from('reddit_posts')
      .select('id')
      .eq('reddit_post_id', reddit_post.id)
      .single();

    if (redditPost) {
      const { data: existingMarketingIdea, error: checkError } = await supabase
        .from('marketing_ideas')
        .select('id, marketing_idea_name')
        .eq('reddit_post_id', redditPost.id)
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
        reddit_author: reddit_post.author || 'Unknown',
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

// Helper function to detect duplicate marketing posts
const detectDuplicateMarketingPost = async (post: any, supabase: any): Promise<{ isDuplicate: boolean; reason?: string; existingId?: string }> => {
  try {
    if (post.db_id) {
      // Post is already in database, check by database ID
      const { data: existingMarketingIdea, error: businessError } = await supabase
        .from('marketing_ideas')
        .select('id, marketing_idea_name')
        .eq('reddit_post_id', post.db_id)
        .limit(1);

      if (businessError && businessError.code !== 'PGRST116') {
        console.error('Error checking for existing marketing ideas:', businessError);
        return { isDuplicate: false };
      }

      if (existingMarketingIdea && existingMarketingIdea.length > 0) {
        return { 
          isDuplicate: true, 
          reason: `Reddit post already has marketing ideas (DB ID: ${post.db_id})`, 
          existingId: existingMarketingIdea[0].id 
        };
      }
    } else {
      // Fresh post, check if Reddit post ID exists in reddit_posts table
      const { data: existingRedditPost, error: redditError } = await supabase
        .from('reddit_posts')
        .select('id')
        .eq('reddit_post_id', post.id)
        .limit(1);

      if (redditError && redditError.code !== 'PGRST116') {
        console.error('Error checking for existing Reddit post:', redditError);
        return { isDuplicate: false };
      }

      if (existingRedditPost && existingRedditPost.length > 0) {
        // Reddit post exists in database, check if it has marketing ideas
        const { data: existingMarketingIdea, error: businessError } = await supabase
          .from('marketing_ideas')
          .select('id, marketing_idea_name')
          .eq('reddit_post_id', existingRedditPost[0].id)
          .limit(1);

        if (businessError && businessError.code !== 'PGRST116') {
          console.error('Error checking for existing marketing ideas:', businessError);
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
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error in detectDuplicateMarketingPost:', error);
    return { isDuplicate: false };
  }
};

// Process marketing posts in batches
const processMarketingPostsInBatches = async (posts: any[], batchSize: number = 10) => {
  console.log(`🚀 Starting batch processing of ${posts.length} marketing posts in batches of ${batchSize}...`);
  
  // Create batches
  const batches = [];
  for (let i = 0; i < posts.length; i += batchSize) {
    batches.push(posts.slice(i, i + batchSize));
  }
  
  console.log(`📦 Created ${batches.length} batches for processing`);
  
  // Remove duplicates within the posts array
  const uniquePosts = new Map();
  posts.forEach(post => {
    if (!uniquePosts.has(post.id)) {
      uniquePosts.set(post.id, post);
    }
  });
  const deduplicatedPosts = Array.from(uniquePosts.values());
  console.log(`✅ Deduplicated: ${deduplicatedPosts.length}/${posts.length} unique posts`);

  console.log(`📋 Sample posts to be processed:`);
  deduplicatedPosts.slice(0, 3).forEach((post, index) => {
    console.log(`  ${index + 1}. ${post.title.substring(0, 80)}...`);
  });

  const allProcessedPosts: any[] = [];
  
  // Process batches sequentially to avoid rate limits
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
    console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${progress}%) with ${batch.length} posts`);
    
    try {
      // Check for duplicates across subreddits
      const filteredBatch = [];
      let batchDuplicateCount = 0;
      for (const post of batch) {
        const duplicateCheck = await detectDuplicateMarketingPost(post, supabaseAdmin);
        if (duplicateCheck.isDuplicate) {
          console.log(`🚫 Skipping duplicate post ${post.id}: ${duplicateCheck.reason}`);
          batchDuplicateCount++;
          continue;
        }
        filteredBatch.push(post);
      }

      console.log(`✅ ${filteredBatch.length}/${batch.length} posts passed duplicate check (${batchDuplicateCount} duplicates in this batch)`);
      
      if (filteredBatch.length === 0) {
        console.log(`Batch ${batchIndex + 1}: All posts were duplicates`);
        continue;
      }
      
      // Batch analyze posts with OpenAI
      console.log(`🧠 Batch analyzing ${filteredBatch.length} posts with OpenAI...`);
      const analyzedPosts = await openaiService.analyzeMarketingPosts(filteredBatch);
      
      console.log(`🎯 Generated ${analyzedPosts.length} marketing ideas from ${filteredBatch.length} posts`);
      
      if (analyzedPosts.length === 0) {
        console.log(`❌ OpenAI returned 0 marketing ideas. This might be an API issue.`);
        continue;
      }
      
      console.log(`📊 Sample marketing ideas generated:`, analyzedPosts.slice(0, 2).map(idea => ({
        name: idea.marketing_idea_name,
        impact: idea.potential_impact,
        channels: idea.channel?.length || 0
      })));

      allProcessedPosts.push(...analyzedPosts);
      
      // Add delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        console.log(`⏳ Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`❌ Error processing batch ${batchIndex + 1}:`, error);
      continue;
    }
  }
  
  console.log(`✅ Batch processing completed: ${allProcessedPosts.length} marketing ideas generated from ${deduplicatedPosts.length} unique posts`);
  return allProcessedPosts;
};

// New function to handle bulk fetch and analyze for marketing ideas
async function handleBulkMarketingFetchAndAnalyze() {
  try {
    console.log('🚀 Starting bulk marketing fetch and analyze process...');
    
    // Fetch posts from ALL Reddit subreddits (using the full SUBREDDITS array)
    const posts = await redditAPI.fetchAllSubreddits();
    console.log(`✅ Fetched ${posts.length} posts from Reddit using all ${redditAPI.SUBREDDITS.length} subreddits`);
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No posts fetched from Reddit. Please try again.'
      }, { status: 400 });
    }

    // Filter for marketing-related posts
    console.log(`🔍 Filtering ${posts.length} Reddit posts for marketing content...`);
    const marketingPosts = posts.filter(post => {
      const combinedText = `${post.title} ${post.content}`.toLowerCase();
      const marketingKeywords = [
        'marketing', 'advertising', 'promotion', 'campaign', 'brand', 'social media',
        'content marketing', 'email marketing', 'seo', 'ppc', 'growth hacking',
        'digital marketing', 'influencer', 'viral', 'engagement', 'conversion',
        'lead generation', 'customer acquisition', 'retention', 'analytics'
      ];
      
      return marketingKeywords.some(keyword => combinedText.includes(keyword));
    });
    
    console.log(`✅ Marketing filter: ${marketingPosts.length}/${posts.length} posts passed`);
    
    if (marketingPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No marketing-related posts found after filtering'
      }, { status: 400 });
    }

    // Deduplicate marketing posts
    console.log(`🔍 Deduplicating ${marketingPosts.length} marketing posts...`);
    const uniquePosts = new Map();
    marketingPosts.forEach(post => {
      if (!uniquePosts.has(post.id)) {
        uniquePosts.set(post.id, post);
      }
    });
    const deduplicatedPosts = Array.from(uniquePosts.values());
    console.log(`✅ Deduplicated: ${deduplicatedPosts.length}/${marketingPosts.length} unique marketing posts`);

    // Analyze posts for marketing ideas
    console.log('🧠 Starting marketing idea analysis on filtered posts...');
    console.log(`📊 Posts to analyze: ${deduplicatedPosts.length}`);
    
    const processedPosts = await processMarketingPostsInBatches(deduplicatedPosts, 10);
    
    console.log(`✅ Analysis completed: ${processedPosts.length} marketing ideas generated from ${deduplicatedPosts.length} posts`);
    
    if (processedPosts.length === 0) {
      console.log('⚠️ No marketing ideas generated, not saving any Reddit posts');
      return NextResponse.json({
        success: true,
        message: 'No marketing ideas generated from the filtered posts',
        posts_fetched: deduplicatedPosts.length,
        marketing_ideas_generated: 0,
        posts: [],
        marketing_ideas: []
      });
    }
    
    // Get unique Reddit posts that generated marketing ideas
    const postsWithIdeas = new Map();
    processedPosts.forEach(idea => {
      if (!postsWithIdeas.has(idea.id)) {
        postsWithIdeas.set(idea.id, {
          id: idea.id,
          title: idea.title,
          content: idea.content,
          author: idea.author,
          subreddit: idea.subreddit,
          score: idea.score,
          num_comments: idea.num_comments,
          url: idea.url,
          permalink: idea.permalink,
          created_utc: idea.created_utc
        });
      }
    });
    
    const postsToSave = Array.from(postsWithIdeas.values());
    
    // Save Reddit posts to database
    console.log(`💾 Saving ${postsToSave.length} Reddit posts to database...`);
    const savedPosts = [];
    for (const post of postsToSave) {
      try {
        const redditPostData = {
          reddit_post_id: post.id,
          reddit_title: post.title,
          reddit_content: post.content || '',
          reddit_author: post.author || 'Unknown',
          reddit_subreddit: post.subreddit,
          reddit_score: post.score || 0,
          reddit_comments: post.num_comments || 0,
          reddit_url: post.url,
          reddit_permalink: post.permalink,
          reddit_created_utc: post.created_utc
        };

        const { data: redditData, error: redditError } = await supabaseAdmin
          .from('reddit_posts')
          .insert(redditPostData)
          .select()
          .single();

        if (redditError) {
          console.error(`❌ Error saving Reddit post: ${post.title}`, redditError);
          continue;
        }

        savedPosts.push(redditData);
        console.log(`✅ Successfully saved Reddit post: ${post.title}`);
      } catch (error) {
        console.error(`❌ Error processing Reddit post: ${post.title}`, error);
        continue;
      }
    }
    
    console.log(`✅ Successfully saved ${savedPosts.length} Reddit posts to database`);
    
    // Save marketing ideas to database
    console.log(`💾 Saving ${processedPosts.length} marketing ideas to database...`);
    const savedMarketingIdeas = [];
    
    for (const idea of processedPosts) {
      try {
        // Find the corresponding Reddit post database ID
        const redditPost = savedPosts.find(p => p.reddit_post_id === idea.id);
        if (!redditPost) {
          console.error(`❌ Could not find Reddit post for marketing idea: ${idea.marketing_idea_name}`);
          continue;
        }

        // Normalize potential_impact
        const normalizePotentialImpact = (impact: string): 'High' | 'Medium' | 'Low' => {
          const normalized = impact?.toLowerCase().trim();
          if (normalized?.includes('high') || normalized?.includes('strong') || normalized?.includes('significant')) {
            return 'High';
          } else if (normalized?.includes('low') || normalized?.includes('weak') || normalized?.includes('minimal')) {
            return 'Low';
          } else {
            return 'Medium';
          }
        };

        const marketingIdeaData = {
          reddit_post_id: redditPost.id,
          reddit_title: idea.title,
          marketing_idea_name: idea.marketing_idea_name,
          idea_description: idea.idea_description,
          channel: idea.channel,
          target_audience: idea.target_audience,
          potential_impact: normalizePotentialImpact(idea.potential_impact),
          implementation_tips: idea.implementation_tips,
          success_metrics: idea.success_metrics,
          analysis_status: 'completed',
          full_analysis: idea.full_analysis
        };
        
        const { data: marketingData, error: marketingError } = await supabaseAdmin
          .from('marketing_ideas')
          .insert(marketingIdeaData)
          .select()
          .single();
        
        if (marketingError) {
          console.error(`❌ Error saving marketing idea: ${idea.marketing_idea_name}`, marketingError);
          continue;
        }
        
        savedMarketingIdeas.push(marketingData);
        console.log(`✅ Successfully saved marketing idea: ${idea.marketing_idea_name}`);
      } catch (error) {
        console.error(`❌ Error processing marketing idea: ${idea.marketing_idea_name}`, error);
        continue;
      }
    }
    
    console.log(`✅ Successfully saved ${savedMarketingIdeas.length} marketing ideas to database`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${deduplicatedPosts.length} Reddit posts, generated ${processedPosts.length} marketing ideas, saved ${savedPosts?.length || 0} Reddit posts, and saved ${savedMarketingIdeas.length} marketing ideas`,
      posts_fetched: deduplicatedPosts.length,
      marketing_ideas_generated: processedPosts.length,
      reddit_posts_saved: savedPosts?.length || 0,
      marketing_ideas_saved: savedMarketingIdeas.length,
      posts: savedPosts,
      marketing_ideas: savedMarketingIdeas
    });
    
  } catch (error) {
    console.error('❌ Error in bulk marketing fetch and analyze:', error);
    return NextResponse.json(
      { success: false, message: 'Error in bulk marketing fetch and analyze process', error: String(error) },
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
      .select('id', { count: 'exact', head: true })
      .eq('analysis_status', 'completed');
    
    if (countError) {
      console.error('❌ Supabase count error:', countError);
      return NextResponse.json(
        { success: false, message: 'Error counting marketing ideas', error: countError.message },
        { status: 500 }
      );
    }
    
    // Then fetch the paginated data - specify columns explicitly to avoid schema issues
    const { data, error } = await supabase
      .from('marketing_ideas')
      .select(`
        id,
        reddit_post_id,
        marketing_idea_name,
        idea_description,
        channel,
        target_audience,
        potential_impact,
        implementation_tips,
        success_metrics,
        analysis_status,
        full_analysis,
        created_at,
        updated_at
      `)
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
