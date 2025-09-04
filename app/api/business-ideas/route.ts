import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { redditAPI } from '@/lib/reddit';

// Helper function to detect duplicate posts across subreddits
const detectDuplicatePost = async (post: any, supabase: any): Promise<{ isDuplicate: boolean; reason?: string; existingId?: string }> => {
  try {
    // For fresh posts (not in database yet), we need to check if the Reddit post ID exists in reddit_posts table
    // For existing database posts, we can check directly by database ID
    
    if (post.db_id) {
      // Post is already in database, check by database ID
      const { data: existingBusinessIdea, error: businessError } = await supabase
        .from('business_ideas')
        .select('id, business_idea_name')
        .eq('reddit_post_id', post.db_id) // This is the integer database ID
        .limit(1);

      if (businessError && businessError.code !== 'PGRST116') {
        console.error('Error checking for existing business ideas:', businessError);
        return { isDuplicate: false };
      }

      if (existingBusinessIdea && existingBusinessIdea.length > 0) {
          return { 
            isDuplicate: true, 
          reason: `Reddit post already has business ideas (DB ID: ${post.db_id})`, 
          existingId: existingBusinessIdea[0].id 
        };
      }
    } else {
      // Fresh post, check if Reddit post ID exists in reddit_posts table
      const { data: existingRedditPost, error: redditError } = await supabase
      .from('reddit_posts')
        .select('id')
        .eq('reddit_post_id', post.id) // This is the string Reddit post ID
        .limit(1);

      if (redditError && redditError.code !== 'PGRST116') {
        console.error('Error checking for existing Reddit post:', redditError);
        return { isDuplicate: false };
      }

      if (existingRedditPost && existingRedditPost.length > 0) {
        // Reddit post exists in database, check if it has business ideas
        const { data: existingBusinessIdea, error: businessError } = await supabase
          .from('business_ideas')
          .select('id, business_idea_name')
          .eq('reddit_post_id', existingRedditPost[0].id) // Use the database ID
          .limit(1);

        if (businessError && businessError.code !== 'PGRST116') {
          console.error('Error checking for existing business ideas:', businessError);
          return { isDuplicate: false };
        }

        if (existingBusinessIdea && existingBusinessIdea.length > 0) {
          return { 
            isDuplicate: true, 
            reason: `Reddit post already has business ideas (Reddit ID: ${post.id})`, 
            existingId: existingBusinessIdea[0].id 
          };
        }
      }
    }

    // No duplicate found
    return { isDuplicate: false };
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    return { isDuplicate: false };
  }
};

// Helper function to calculate similarity between two strings
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Simple Levenshtein distance-based similarity
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Helper function to calculate Levenshtein distance
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Business Ideas API called with:', body);
    
    // Check if this is a bulk fetch and analyze action
    if (body.action === 'fetch_and_analyze') {
      console.log('🚀 Calling handleBulkFetchAndAnalyze...');
      return await handleBulkFetchAndAnalyze();
    }
    
    // Original logic for single Reddit post analysis
    const { reddit_post } = body;

    if (!reddit_post) {
      return NextResponse.json({ 
        success: false, 
        message: 'Reddit post data is required' 
      }, { status: 400 });
    }

    console.log('🚀 Processing Reddit post for business idea analysis:', reddit_post.title.substring(0, 50));

         // Analyze the Reddit post with OpenAI (using batch function for single post)
     const analyzedPosts = await openaiService.batchAnalyzeRedditPosts([reddit_post]);
     const analyzedPost = analyzedPosts[0];
    
         console.log('✅ OpenAI analysis completed:', analyzedPost.business_idea_name);
     console.log('🔍 Market size from OpenAI:', analyzedPost.market_size);

    // Validate that full_analysis is not empty
    if (!analyzedPost.full_analysis || analyzedPost.full_analysis.trim().length < 50) {
      console.log(`⚠️ Skipping post - full_analysis is empty or too short (${analyzedPost.full_analysis?.length || 0} characters)`);
      return NextResponse.json({
        success: false,
        message: 'Analysis incomplete - full_analysis is empty or too short',
        analysis_length: analyzedPost.full_analysis?.length || 0
      }, { status: 400 });
    }

    // Validate that business idea name is not empty
    if (!analyzedPost.business_idea_name || analyzedPost.business_idea_name.trim().length < 5) {
      console.log(`⚠️ Skipping post - business_idea_name is empty or too short (${analyzedPost.business_idea_name?.length || 0} characters)`);
      return NextResponse.json({
        success: false,
        message: 'Analysis incomplete - business_idea_name is empty or too short',
        idea_name_length: analyzedPost.business_idea_name?.length || 0
      }, { status: 400 });
    }

    // Enhanced duplicate detection across subreddits
    const duplicateCheck = await detectDuplicatePost(reddit_post, supabaseAdmin);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json({
        success: false,
        message: 'Duplicate post detected across subreddits',
        reason: duplicateCheck.reason,
        existing_id: duplicateCheck.existingId
      }, { status: 409 });
    }

         // First, save the Reddit post to reddit_posts table
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

     console.log('💾 Saving Reddit post to database...');

     const { data: redditPost, error: redditError } = await supabaseAdmin
       .from('reddit_posts')
       .insert(redditPostData)
       .select('id')
       .single();

     if (redditError) {
       console.error('❌ Supabase insert error:', redditError);
       return NextResponse.json(
         { success: false, message: 'Error saving Reddit post', error: redditError.message },
         { status: 500 }
       );
     }

     // Then save the business idea with foreign key reference
     const businessIdeaData = {
       reddit_post_id: redditPost.id, // Foreign key reference
       business_idea_name: analyzedPost.business_idea_name,
       opportunity_points: Array.isArray(analyzedPost.opportunity_points) ? analyzedPost.opportunity_points : [analyzedPost.opportunity_points],
       problems_solved: Array.isArray(analyzedPost.problems_solved) ? analyzedPost.problems_solved : [analyzedPost.problems_solved],
       target_customers: Array.isArray(analyzedPost.target_customers) ? analyzedPost.target_customers : [analyzedPost.target_customers],
       market_size: Array.isArray(analyzedPost.market_size) ? analyzedPost.market_size : (analyzedPost.market_size ? [analyzedPost.market_size] : null),
       niche: analyzedPost.niche,
       category: analyzedPost.category,
       marketing_strategy: Array.isArray(analyzedPost.marketing_strategy) ? analyzedPost.marketing_strategy : [analyzedPost.marketing_strategy],
       analysis_status: 'completed',
       full_analysis: analyzedPost.full_analysis,
       
       // NEW premium fields
       problem_story: analyzedPost.problem_story || null,
       solution_vision: analyzedPost.solution_vision || null,
       revenue_model: Array.isArray(analyzedPost.revenue_model) ? analyzedPost.revenue_model : (analyzedPost.revenue_model ? [analyzedPost.revenue_model] : null),
       competitive_advantage: Array.isArray(analyzedPost.competitive_advantage) ? analyzedPost.competitive_advantage : (analyzedPost.competitive_advantage ? [analyzedPost.competitive_advantage] : null),
       next_steps: Array.isArray(analyzedPost.next_steps) ? analyzedPost.next_steps : (analyzedPost.next_steps ? [analyzedPost.next_steps] : null)
     };

     console.log('💾 Saving business idea to database...');

     const { data, error } = await supabaseAdmin
       .from('business_ideas')
       .insert(businessIdeaData)
       .select(`
         *,
         reddit_posts (
           reddit_title,
           reddit_author,
           reddit_subreddit,
           reddit_score,
           reddit_comments,
           reddit_url,
           reddit_permalink
         )
       `)
       .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Error saving business idea', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Business idea saved successfully:', data.id);

    return NextResponse.json({
      success: true,
      message: 'Business idea analyzed and saved successfully',
      business_idea: data
    });

  } catch (error) {
    console.error('❌ Error processing business idea:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing business idea', error: String(error) },
      { status: 500 }
    );
  }
}

// Process posts in batches with smart filtering and deduplication (copied from reddit route)
const processPostsInBatches = async (posts: any[], batchSize: number = 10): Promise<any[]> => {
  console.log(`🚀 Starting smart processing of ${posts.length} posts...`);

  // Step 1: Apply keyword filter to remove junk posts
  console.log(`🔍 Applying keyword filter to ${posts.length} posts...`);
  const filteredPosts = redditAPI.filterBusinessIdeaPosts(posts);
  console.log(`✅ Keyword filter: ${filteredPosts.length}/${posts.length} posts passed`);
  
  if (filteredPosts.length === 0) {
    console.log(`❌ No posts passed keyword filter. Sample titles:`, posts.slice(0, 3).map(p => p.title));
    return [];
  }

  // Step 2: Limit to top ~50 posts per day to get more business ideas
  const maxPostsPerDay = 50;
  const limitedPosts = filteredPosts.slice(0, maxPostsPerDay);
  console.log(`📊 Limited to top ${limitedPosts.length} posts per day (increased from 20 to 50)`);

  // Step 3: Skip content hash duplicate checking for now (too aggressive)
  console.log(`🔍 Skipping content hash duplicate check (temporarily disabled - too aggressive)`);
  const uniquePosts = limitedPosts; // Use all limited posts without hash filtering
  
  console.log(`✅ No content hash filtering: ${uniquePosts.length}/${limitedPosts.length} posts proceeding to batch processing`);

  if (uniquePosts.length === 0) {
    console.log(`❌ No unique posts to process after filtering and deduplication`);
    return [];
  }

  // Step 4: Create batches for processing
  const batches: any[][] = [];
  for (let i = 0; i < uniquePosts.length; i += batchSize) {
    batches.push(uniquePosts.slice(i, i + batchSize));
  }

  console.log(`📦 Created ${batches.length} batches of ${batchSize} posts each`);
  console.log(`⏱️ Estimated processing time: ${Math.round(batches.length * 15)} seconds (15s per batch)`);
  console.log(`📋 Sample posts to be processed:`);
  uniquePosts.slice(0, 3).forEach((post, index) => {
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
            const duplicateCheck = await detectDuplicatePost(post, supabaseAdmin);
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
         
                   // Batch analyze posts with OpenAI (includes pre-filtering and analysis in one call)
          console.log(`🧠 Batch analyzing ${filteredBatch.length} posts with OpenAI...`);
          const analyzedPosts = await openaiService.batchAnalyzeRedditPosts(filteredBatch);
      
      console.log(`🎯 Generated ${analyzedPosts.length} business ideas from ${filteredBatch.length} posts`);
          
                     if (analyzedPosts.length === 0) {
        console.log(`❌ OpenAI returned 0 business ideas. This might be an API issue.`);
             continue;
           }
           
      console.log(`📋 Sample generated ideas:`, analyzedPosts.slice(0, 2).map(idea => ({
        name: idea.business_idea_name,
        niche: idea.niche,
        category: idea.category,
        analysis_length: idea.full_analysis?.length || 0
      })));
      
      // Process each analyzed post
      const batchProcessedPosts: any[] = [];
      
      // For fresh Reddit posts (not from database), we'll analyze first and save later
      const originalPostId = filteredBatch[0]?.id; // Original Reddit post ID
      const redditPostDbId = filteredBatch[0]?.db_id; // Database ID (may be undefined for fresh posts)
      
      console.log(`🔍 Processing Reddit post: ${originalPostId} (DB ID: ${redditPostDbId || 'Not in DB yet'})`);
      
      // For fresh posts, we'll return the analyzed posts without saving to database yet
      // The calling function will handle saving Reddit posts and business ideas

           for (const analyzedPost of analyzedPosts) {
             try {
                    // Validate that full_analysis is not empty
          if (!analyzedPost.full_analysis || analyzedPost.full_analysis.trim().length < 50) {
            console.log(`⚠️ Skipping idea - full_analysis is empty or too short (${analyzedPost.full_analysis?.length || 0} chars)`);
            continue;
          }

          // Validate that business idea name is not empty
          if (!analyzedPost.business_idea_name || analyzedPost.business_idea_name.trim().length < 5) {
            console.log(`⚠️ Skipping idea - business_idea_name is empty or too short (${analyzedPost.business_idea_name?.length || 0} chars)`);
                 continue;
               }

          console.log(`✅ Validating idea: ${analyzedPost.business_idea_name} (${analyzedPost.full_analysis.length} chars)`);
          console.log(`🔍 Data types check:`, {
            opportunity_points: Array.isArray(analyzedPost.opportunity_points) ? 'array' : 'string',
            problems_solved: Array.isArray(analyzedPost.problems_solved) ? 'array' : 'string',
            target_customers: Array.isArray(analyzedPost.target_customers) ? 'array' : 'string',
            market_size: Array.isArray(analyzedPost.market_size) ? 'array' : 'string',
            marketing_strategy: Array.isArray(analyzedPost.marketing_strategy) ? 'array' : 'string'
          });

          // For fresh posts (not in database yet), just collect the analyzed posts
          // The calling function will handle saving Reddit posts and business ideas
          if (!redditPostDbId) {
            console.log(`📝 Collecting analyzed idea for fresh post: ${analyzedPost.business_idea_name}`);
            batchProcessedPosts.push({
              ...analyzedPost,
              reddit_post_id: originalPostId // Use original Reddit post ID for now
            });
          } else {
            // For existing database posts, save business ideas immediately
               const businessIdeaData = {
              reddit_post_id: redditPostDbId, // Use the shared database ID for all ideas from this post
                 business_idea_name: analyzedPost.business_idea_name,
              opportunity_points: Array.isArray(analyzedPost.opportunity_points) ? analyzedPost.opportunity_points : [analyzedPost.opportunity_points],
              problems_solved: Array.isArray(analyzedPost.problems_solved) ? analyzedPost.problems_solved : [analyzedPost.problems_solved],
              target_customers: Array.isArray(analyzedPost.target_customers) ? analyzedPost.target_customers : [analyzedPost.target_customers],
              market_size: Array.isArray(analyzedPost.market_size) ? analyzedPost.market_size : (analyzedPost.market_size ? [analyzedPost.market_size] : null),
                 niche: analyzedPost.niche,
                 category: analyzedPost.category,
              marketing_strategy: Array.isArray(analyzedPost.marketing_strategy) ? analyzedPost.marketing_strategy : [analyzedPost.marketing_strategy],
                 analysis_status: 'completed',
              full_analysis: analyzedPost.full_analysis,
              
              // NEW premium fields
              problem_story: analyzedPost.problem_story || null,
              solution_vision: analyzedPost.solution_vision || null,
              revenue_model: Array.isArray(analyzedPost.revenue_model) ? analyzedPost.revenue_model : (analyzedPost.revenue_model ? [analyzedPost.revenue_model] : null),
              competitive_advantage: Array.isArray(analyzedPost.competitive_advantage) ? analyzedPost.competitive_advantage : (analyzedPost.competitive_advantage ? [analyzedPost.competitive_advantage] : null),
              next_steps: Array.isArray(analyzedPost.next_steps) ? analyzedPost.next_steps : (analyzedPost.next_steps ? [analyzedPost.next_steps] : null)
            };

            const { data: businessData, error: businessError } = await supabaseAdmin
                 .from('business_ideas')
              .insert(businessIdeaData)
              .select()
              .single();

            if (businessError) {
              console.error(`❌ Error saving business idea:`, businessError);
              console.error(`❌ Error details:`, {
                code: businessError.code,
                message: businessError.message,
                details: businessError.details,
                hint: businessError.hint
              });
              console.error(`❌ Business idea data that failed:`, businessIdeaData);
              
              // Check if it's a duplicate constraint violation
              if (businessError.code === '23505') {
                console.log(`🚫 Database constraint violation - duplicate detected for idea: ${analyzedPost.business_idea_name}`);
                continue;
              }
              
              // Check if it's a check constraint violation
              if (businessError.code === '23514') {
                console.log(`🚫 Check constraint violation for idea: ${analyzedPost.business_idea_name}:`, businessError.message);
                continue;
              }
              
              continue;
            }

            console.log(`✅ Successfully saved business idea: ${analyzedPost.business_idea_name}`);
            batchProcessedPosts.push(businessData);
          }
          
             } catch (error) {
          console.error(`❌ Error processing analyzed idea:`, error);
          continue;
        }
      }

      allProcessedPosts.push(...batchProcessedPosts);
      console.log(`✅ Batch ${batchIndex + 1} completed: ${batchProcessedPosts.length} ideas saved`);
         
             } catch (error) {
      console.error(`❌ Error processing batch ${batchIndex + 1}:`, error);
      continue;
    }
  }

  console.log(`🎉 Smart processing completed! Generated ${allProcessedPosts.length} business ideas from ${uniquePosts.length} unique posts`);
  return allProcessedPosts;
};

// New function to handle bulk fetch and analyze - using the same optimized approach as /api/reddit
async function handleBulkFetchAndAnalyze() {
  try {
    console.log('🚀 Starting bulk fetch and analyze process...');
    console.log('🔍 handleBulkFetchAndAnalyze function called');
    
    // Fetch posts from ALL Reddit subreddits (using the full SUBREDDITS array)
    const posts = await redditAPI.fetchAllSubreddits();
    console.log(`✅ Fetched ${posts.length} posts from Reddit using all ${redditAPI.SUBREDDITS.length} subreddits`);
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No posts fetched from Reddit. Please try again.'
      }, { status: 400 });
    }

    // Step 1: Filter for business posts FIRST (before saving to database)
    console.log(`🔍 Filtering ${posts.length} Reddit posts for business content...`);
    const businessPosts = redditAPI.filterBusinessIdeaPosts(posts);
    console.log(`✅ Business filter: ${businessPosts.length}/${posts.length} posts passed`);
    console.log(`📊 Filtering breakdown: ${posts.length} total → ${businessPosts.length} business-related`);
    
    // Debug: Show sample of filtered posts
    if (businessPosts.length > 0) {
      console.log(`📝 Sample filtered posts:`, businessPosts.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title.substring(0, 50),
        subreddit: p.subreddit
      })));
    }

    if (businessPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No business-related posts found after filtering'
      }, { status: 400 });
    }

    // Step 2: Deduplicate business posts before saving
    console.log(`🔍 Deduplicating ${businessPosts.length} business posts...`);
    const uniquePosts = new Map();
    businessPosts.forEach(post => {
      if (!uniquePosts.has(post.id)) {
        uniquePosts.set(post.id, post);
      }
    });
    const deduplicatedPosts = Array.from(uniquePosts.values());
    console.log(`✅ Deduplicated: ${deduplicatedPosts.length}/${businessPosts.length} unique business posts`);

    // Step 3: Analyze posts for business ideas FIRST (before saving to database)
    console.log('🧠 Starting business idea analysis on filtered posts...');
    console.log(`📊 Posts to analyze: ${deduplicatedPosts.length}`);
    console.log(`📋 Sample posts:`, deduplicatedPosts.slice(0, 2).map(p => ({
      id: p.id,
      title: p.title.substring(0, 50),
      subreddit: p.subreddit
    })));
    
    console.log(`🚀 Starting batch processing with ${deduplicatedPosts.length} posts...`);
    const processedPosts = await processPostsInBatches(deduplicatedPosts, 20);
    
    console.log(`✅ Analysis completed: ${processedPosts.length} business ideas generated from ${deduplicatedPosts.length} posts`);
    
    // Step 4: Only save Reddit posts that successfully generated business ideas
    if (processedPosts.length === 0) {
      console.log('⚠️ No business ideas generated, not saving any Reddit posts');
      return NextResponse.json({
        success: true,
        message: 'No business ideas generated from the filtered posts',
        posts_fetched: deduplicatedPosts.length,
        business_ideas_generated: 0,
        posts: [],
        business_ideas: []
      });
    }
    
    // Get unique Reddit posts that generated business ideas
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
    console.log(`💾 Saving ${postsToSave.length} Reddit posts that generated business ideas...`);
    
    const redditPostData = postsToSave.map(post => ({
      reddit_post_id: post.id,
      reddit_title: post.title,
      reddit_content: post.content || '',
      reddit_author: post.author,
      reddit_subreddit: post.subreddit,
      reddit_score: post.score || 0,
      reddit_comments: post.num_comments || 0,
      reddit_url: post.url,
      reddit_permalink: post.permalink,
      reddit_created_utc: post.created_utc
    }));

    // Use upsert to handle duplicates gracefully
    const { data: savedPosts, error: saveError } = await supabaseAdmin
      .from('reddit_posts')
      .upsert(redditPostData, { 
        onConflict: 'reddit_post_id',
        ignoreDuplicates: false 
      })
      .select();

    if (saveError) {
      console.error('Error saving Reddit posts:', saveError);
      return NextResponse.json({ 
        success: false, 
        message: 'Error saving Reddit posts to database'
      }, { status: 500 });
    }

    console.log(`✅ Successfully saved ${savedPosts?.length || 0} Reddit posts that generated business ideas`);
    
    // Step 5: Save business ideas with correct Reddit post database IDs
    console.log('💾 Saving business ideas to database...');
    const savedBusinessIdeas = [];
    
    for (const idea of processedPosts) {
      try {
        // Find the corresponding saved Reddit post to get the database ID
        const savedPost = savedPosts?.find(p => p.reddit_post_id === idea.reddit_post_id);
        if (!savedPost) {
          console.log(`⚠️ Could not find saved Reddit post for idea: ${idea.business_idea_name}`);
          continue;
        }
        
        const businessIdeaData = {
          reddit_post_id: savedPost.id, // Use the database ID of the saved Reddit post
          business_idea_name: idea.business_idea_name,
          opportunity_points: Array.isArray(idea.opportunity_points) ? idea.opportunity_points : [idea.opportunity_points],
          problems_solved: Array.isArray(idea.problems_solved) ? idea.problems_solved : [idea.problems_solved],
          target_customers: Array.isArray(idea.target_customers) ? idea.target_customers : [idea.target_customers],
          market_size: Array.isArray(idea.market_size) ? idea.market_size : (idea.market_size ? [idea.market_size] : null),
          niche: idea.niche,
          category: idea.category,
          marketing_strategy: Array.isArray(idea.marketing_strategy) ? idea.marketing_strategy : [idea.marketing_strategy],
          analysis_status: 'completed',
          full_analysis: idea.full_analysis,
          
          // NEW premium fields
          problem_story: idea.problem_story || null,
          solution_vision: idea.solution_vision || null,
          revenue_model: Array.isArray(idea.revenue_model) ? idea.revenue_model : (idea.revenue_model ? [idea.revenue_model] : null),
          competitive_advantage: Array.isArray(idea.competitive_advantage) ? idea.competitive_advantage : (idea.competitive_advantage ? [idea.competitive_advantage] : null),
          next_steps: Array.isArray(idea.next_steps) ? idea.next_steps : (idea.next_steps ? [idea.next_steps] : null)
        };
        
        const { data: businessData, error: businessError } = await supabaseAdmin
          .from('business_ideas')
          .insert(businessIdeaData)
          .select()
          .single();
        
        if (businessError) {
          console.error(`❌ Error saving business idea: ${idea.business_idea_name}`, businessError);
          continue;
        }
        
        savedBusinessIdeas.push(businessData);
        console.log(`✅ Successfully saved business idea: ${idea.business_idea_name}`);
        console.log(`🔍 Market size for ${idea.business_idea_name}:`, idea.market_size);
       } catch (error) {
        console.error(`❌ Error processing business idea: ${idea.business_idea_name}`, error);
        continue;
       }
     }
    
    console.log(`✅ Successfully saved ${savedBusinessIdeas.length} business ideas to database`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${deduplicatedPosts.length} Reddit posts, generated ${processedPosts.length} business ideas, saved ${savedPosts?.length || 0} Reddit posts, and saved ${savedBusinessIdeas.length} business ideas`,
      posts_fetched: deduplicatedPosts.length,
      business_ideas_generated: processedPosts.length,
      reddit_posts_saved: savedPosts?.length || 0,
      business_ideas_saved: savedBusinessIdeas.length,
      posts: savedPosts,
      business_ideas: savedBusinessIdeas
    });
    
  } catch (error) {
    console.error('❌ Error in bulk fetch and analyze:', error);
    return NextResponse.json(
      { success: false, message: 'Error in bulk fetch and analyze process', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get('stats');
    
    console.log('📖 GET /api/business-ideas - Fetching business ideas...');
    
    if (stats === 'yesterday') {
      // Get yesterday's date range
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log(`📊 Fetching yesterday's statistics (${yesterday.toISOString()} to ${today.toISOString()})`);
      
             // Fetch yesterday's business ideas with Reddit post data
       const { data, error } = await supabase
         .from('business_ideas')
         .select(`
           *,
           reddit_posts (
             reddit_title,
             reddit_author,
             reddit_subreddit,
             reddit_score,
             reddit_comments,
             reddit_url,
             reddit_permalink
           )
         `)
         .eq('analysis_status', 'completed')
         .gte('created_at', yesterday.toISOString())
         .lt('created_at', today.toISOString())
         .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase select error:', error);
        return NextResponse.json(
          { success: false, message: 'Error fetching yesterday\'s statistics', error: error.message },
          { status: 500 }
        );
      }
      
      const yesterdayIdeas = data || [];
      
      // Calculate statistics
      const stats = {
        totalIdeas: yesterdayIdeas.length,
        bySubreddit: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byNiche: {} as Record<string, number>,
        averageScore: 0,
        averageComments: 0,
        totalScore: 0,
        totalComments: 0,
        topSubreddits: [] as Array<{ subreddit: string; count: number }>,
        topCategories: [] as Array<{ category: string; count: number }>,
        topNiches: [] as Array<{ niche: string; count: number }>
      };
      
             // Process each idea for statistics
       yesterdayIdeas.forEach(idea => {
         // Subreddit stats
         const subreddit = idea.reddit_posts?.reddit_subreddit || 'Unknown';
         stats.bySubreddit[subreddit] = (stats.bySubreddit[subreddit] || 0) + 1;
         
         // Category stats
         const category = idea.category || 'Unknown';
         stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
         
         // Niche stats
         const niche = idea.niche || 'Unknown';
         stats.byNiche[niche] = (stats.byNiche[niche] || 0) + 1;
         
         // Score and comments
         stats.totalScore += idea.reddit_posts?.reddit_score || 0;
         stats.totalComments += idea.reddit_posts?.reddit_comments || 0;
       });
      
      // Calculate averages
      if (yesterdayIdeas.length > 0) {
        stats.averageScore = Math.round(stats.totalScore / yesterdayIdeas.length);
        stats.averageComments = Math.round(stats.totalComments / yesterdayIdeas.length);
      }
      
      // Sort and get top items
      stats.topSubreddits = Object.entries(stats.bySubreddit)
        .map(([subreddit, count]) => ({ subreddit, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      stats.topCategories = Object.entries(stats.byCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      stats.topNiches = Object.entries(stats.byNiche)
        .map(([niche, count]) => ({ niche, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      console.log(`📊 Yesterday's statistics: ${yesterdayIdeas.length} ideas processed`);
      
      return NextResponse.json({
        success: true,
        yesterday: yesterday.toISOString().split('T')[0],
        statistics: stats,
        ideas: yesterdayIdeas,
        count: yesterdayIdeas.length
      });
    }
    
    // Regular GET request - fetch business ideas with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    console.log(`📊 Fetching business ideas - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);
    
         // First, get total count for pagination
     const { count: totalCount, error: countError } = await supabase
       .from('business_ideas')
       .select('*', { count: 'exact', head: true })
       .eq('analysis_status', 'completed');
     
     if (countError) {
       console.error('❌ Supabase count error:', countError);
       return NextResponse.json(
         { success: false, message: 'Error counting business ideas', error: countError.message },
         { status: 500 }
       );
     }
     
     // Then, fetch paginated results with Reddit post data
     const { data, error } = await supabase
       .from('business_ideas')
       .select(`
         *,
         reddit_posts (
           reddit_title,
           reddit_author,
           reddit_subreddit,
           reddit_score,
           reddit_comments,
           reddit_url,
           reddit_permalink
         )
       `)
       .eq('analysis_status', 'completed')
       .order('created_at', { ascending: false })
       .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Supabase select error:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching business ideas', error: error.message },
        { status: 500 }
      );
    }
    
    console.log(`📊 Business ideas retrieved: ${data?.length || 0} (Page ${page} of ${Math.ceil((totalCount || 0) / limit)})`);
    
    return NextResponse.json({
      success: true,
      business_ideas: data || [],
      count: totalCount || 0,
      currentPage: page,
      totalPages: Math.ceil((totalCount || 0) / limit),
      hasNextPage: offset + limit < (totalCount || 0),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching business ideas' },
      { status: 500 }
    );
  }
}