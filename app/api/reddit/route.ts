import { NextResponse } from 'next/server';
import { redditAPI } from '@/lib/reddit';
import { openaiService } from '@/lib/openai';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Helper function to detect duplicate posts across subreddits
const detectDuplicatePost = async (post: any, supabase: any): Promise<{ isDuplicate: boolean; reason?: string; existingId?: string }> => {
  try {
    // 1. Check by exact reddit_post_id (same post)
    const { data: existingById, error: idError } = await supabase
      .from('business_ideas')
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

    // 2. Check by exact title match (catches crossposts with identical titles)
    const { data: existingByExactTitle, error: exactTitleError } = await supabase
      .from('business_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_author')
      .eq('reddit_title', post.title)
      .single();

    if (existingByExactTitle) {
      console.log(`🚫 DUPLICATE DETECTED: Exact same title "${post.title}" already exists in r/${existingByExactTitle.reddit_subreddit} by ${existingByExactTitle.reddit_author}`);
      return { 
        isDuplicate: true, 
        reason: `Exact same title already exists in r/${existingByExactTitle.reddit_subreddit} by ${existingByExactTitle.reddit_author}`, 
        existingId: existingByExactTitle.id 
      };
    }

    // 3. Check by author + similar content (same user posting similar ideas)
    const { data: existingByAuthor, error: authorError } = await supabase
      .from('business_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_content')
      .eq('reddit_author', post.author)
      .limit(5);

    if (existingByAuthor && existingByAuthor.length > 0) {
      for (const existing of existingByAuthor) {
        const existingContent = existing.reddit_content.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const currentContent = post.content.toLowerCase().replace(/[^\w\s]/g, '').trim();
        
        // Simple content similarity check
        if (existingContent.length > 0 && currentContent.length > 0) {
                  const commonWords = existingContent.split(' ').filter((word: string) => 
          currentContent.includes(word) && word.length > 3
        );
          const similarity = commonWords.length / Math.max(existingContent.split(' ').length, currentContent.split(' ').length);
          
          if (similarity > 0.3) { // 30% similarity threshold
            return { 
              isDuplicate: true, 
              reason: `Similar content by same author (${Math.round(similarity * 100)}% match) already exists in r/${existing.reddit_subreddit}`, 
              existingId: existing.id 
            };
          }
        }
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    return { isDuplicate: false };
  }
};

// Helper function to clean corrupted data in database columns
const cleanCorruptedData = async (supabase: any) => {
  try {
    console.log('🧹 Starting database cleanup for corrupted data...');
    
    const { data: ideas, error: fetchError } = await supabase
      .from('business_ideas')
      .select('id, opportunity_points, problems_solved, target_customers, marketing_strategy, market_size');
    
    if (fetchError) {
      console.error('❌ Error fetching ideas for cleanup:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${ideas.length} ideas to check for corruption...`);
    
    let cleanedCount = 0;
    
    for (const idea of ideas) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Clean opportunity_points - remove market size patterns
      if (idea.opportunity_points && Array.isArray(idea.opportunity_points)) {
        const cleaned = idea.opportunity_points.filter((point: string) => {
          const hasDollarAmount = /\$\d+[BMK]/.test(point);
          const hasSectionHeader = /^(Market Size|Opportunity|Problem it Solves|Target Customer|Marketing Strategy):/i.test(point);
          return !hasDollarAmount && !hasSectionHeader;
        });
        
        if (cleaned.length !== idea.opportunity_points.length) {
          updates.opportunity_points = cleaned;
          needsUpdate = true;
        }
      }
      
      // Clean problems_solved - remove market size patterns
      if (idea.problems_solved && Array.isArray(idea.problems_solved)) {
        const cleaned = idea.problems_solved.filter((problem: string) => {
          const hasDollarAmount = /\$\d+[BMK]/.test(problem);
          const hasSectionHeader = /^(Market Size|Opportunity|Problem it Solves|Target Customer|Marketing Strategy):/i.test(problem);
          return !hasDollarAmount && !hasSectionHeader;
        });
        
        if (cleaned.length !== idea.problems_solved.length) {
          updates.problems_solved = cleaned;
          needsUpdate = true;
        }
      }
      
      // Clean target_customers - remove market size patterns
      if (idea.target_customers && Array.isArray(idea.target_customers)) {
        const cleaned = idea.target_customers.filter((customer: string) => {
          const hasDollarAmount = /\$\d+[BMK]/.test(customer);
          const hasSectionHeader = /^(Market Size|Opportunity|Problem it Solves|Target Customer|Marketing Strategy):/i.test(customer);
          return !hasDollarAmount && !hasSectionHeader;
        });
        
        if (cleaned.length !== idea.target_customers.length) {
          updates.target_customers = cleaned;
          needsUpdate = true;
        }
      }
      
      // Clean marketing_strategy - remove market size patterns
      if (idea.marketing_strategy && Array.isArray(idea.marketing_strategy)) {
        const cleaned = idea.marketing_strategy.filter((strategy: string) => {
          const hasDollarAmount = /\$\d+[BMK]/.test(strategy);
          const hasSectionHeader = /^(Market Size|Opportunity|Problem it Solves|Target Customer|Marketing Strategy):/i.test(strategy);
          return !hasDollarAmount && !hasSectionHeader;
        });
        
        if (cleaned.length !== idea.marketing_strategy.length) {
          updates.marketing_strategy = cleaned;
          needsUpdate = true;
        }
      }
      
      // Update the database if any cleaning was needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('business_ideas')
          .update(updates)
          .eq('id', idea.id);
        
        if (updateError) {
          console.error(`❌ Error updating idea ${idea.id}:`, updateError);
        } else {
          cleanedCount++;
        }
      }
    }
    
    console.log(`🎉 Database cleanup completed! Cleaned ${cleanedCount} ideas.`);
    
  } catch (error) {
    console.error('💥 Error during database cleanup:', error);
  }
};

// Process posts in batches with smart filtering and deduplication
const processPostsInBatches = async (posts: any[], batchSize: number = 5): Promise<any[]> => {
  console.log(`🚀 Starting smart processing of ${posts.length} posts...`);

  // Step 1: Apply keyword filter to remove junk posts
  console.log(`🔍 Applying keyword filter to ${posts.length} posts...`);
  const filteredPosts = redditAPI.filterBusinessIdeaPosts(posts);
  console.log(`✅ Keyword filter: ${filteredPosts.length}/${posts.length} posts passed`);

  // Step 2: Limit to top ~50 posts per day to avoid wasting tokens
  const maxPostsPerDay = 50;
  const limitedPosts = filteredPosts.slice(0, maxPostsPerDay);
  console.log(`📊 Limited to top ${limitedPosts.length} posts per day`);

  // Step 3: Check for duplicates using content hash
  console.log(`🔍 Checking for duplicates using content hash...`);
  const uniquePosts = [];
  const seenHashes = new Set();

  for (const post of limitedPosts) {
    const contentHash = redditAPI.generateContentHash(post.title, post.content);
    
    // Check if this hash already exists in database
    const { data: existingByHash, error: hashError } = await supabaseAdmin
      .from('business_ideas')
      .select('id, business_idea_name')
      .ilike('business_idea_name', `%${contentHash.substring(0, 20)}%`)
      .limit(1);

    if (hashError) {
      console.error('Error checking content hash:', hashError);
      continue;
    }

    if (existingByHash && existingByHash.length > 0) {
      console.log(`🚫 Skipping duplicate content: ${post.title.substring(0, 50)}...`);
      continue;
    }

    // Also check local hash to avoid processing same content in this batch
    if (seenHashes.has(contentHash)) {
      console.log(`🚫 Skipping duplicate content in batch: ${post.title.substring(0, 50)}...`);
      continue;
    }

    seenHashes.add(contentHash);
    uniquePosts.push(post);
  }

  console.log(`✅ Deduplication: ${uniquePosts.length}/${limitedPosts.length} unique posts remaining`);

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
      const filteredPosts = [];
      for (const post of batch) {
        const duplicateCheck = await detectDuplicatePost(post, supabase);
        if (duplicateCheck.isDuplicate) {
          console.log(`🚫 Skipping duplicate post ${post.id}: ${duplicateCheck.reason}`);
          continue;
        }
        filteredPosts.push(post);
      }

      console.log(`✅ ${filteredPosts.length}/${batch.length} posts passed duplicate check`);

      if (filteredPosts.length === 0) {
        console.log(`Batch ${batchIndex + 1}: All posts were duplicates`);
        continue;
      }

      // Batch analyze posts with OpenAI (includes pre-filtering and analysis in one call)
      console.log(`🧠 Batch analyzing ${filteredPosts.length} posts with OpenAI...`);
      const analyzedPosts = await openaiService.batchAnalyzeRedditPosts(filteredPosts);
      
      console.log(`🎯 Generated ${analyzedPosts.length} business ideas from ${filteredPosts.length} posts`);
      
      // Process each analyzed post
      const batchProcessedPosts: any[] = [];
      
      // Get the Reddit post database ID directly from the loaded data
      const redditPostDbId = filteredPosts[0]?.db_id; // Database ID is already available
      const originalPostId = filteredPosts[0]?.id; // Original Reddit post ID
      
      console.log(`🔍 Processing Reddit post: ${originalPostId} (DB ID: ${redditPostDbId})`);
      
      if (!redditPostDbId) {
        console.error(`❌ No database ID found for Reddit post: ${originalPostId}`);
        continue; // Skip this batch
      }

      for (const analyzedPost of analyzedPosts) {
        try {
          // Validate that full_analysis is not empty
          if (!analyzedPost.full_analysis || analyzedPost.full_analysis.trim().length < 50) {
            console.log(`⚠️ Skipping idea - full_analysis is empty or too short`);
            continue;
          }

          // Validate that business idea name is not empty
          if (!analyzedPost.business_idea_name || analyzedPost.business_idea_name.trim().length < 5) {
            console.log(`⚠️ Skipping idea - business_idea_name is empty or too short`);
            continue;
          }

          // Save to database using the shared Reddit post database ID
          const businessIdeaData = {
            reddit_post_id: redditPostDbId, // Use the shared database ID for all ideas from this post
            business_idea_name: analyzedPost.business_idea_name,
            opportunity_points: analyzedPost.opportunity_points,
            problems_solved: analyzedPost.problems_solved,
            target_customers: analyzedPost.target_customers,
            market_size: analyzedPost.market_size,
            niche: analyzedPost.niche,
            category: analyzedPost.category,
            marketing_strategy: analyzedPost.marketing_strategy,
            analysis_status: 'completed',
            full_analysis: analyzedPost.full_analysis
          };

          const { data: businessData, error: businessError } = await supabaseAdmin
            .from('business_ideas')
            .insert(businessIdeaData)
            .select()
            .single();

          if (businessError) {
            console.error(`❌ Error saving business idea:`, businessError);
            
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



export async function POST(request: Request) {
  try {

    console.log('POST /api/reddit - Fetching posts from Reddit...');
    
    // Fetch posts from Reddit using configured limit
    const posts = await redditAPI.fetchAllSubreddits();
    console.log('Posts fetched from Reddit:', posts.length);
    
    if (posts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No posts fetched from Reddit'
      });
    }

    // Step 1: Deduplicate Reddit posts before saving
    console.log(`🔍 Deduplicating ${posts.length} Reddit posts...`);
    const uniquePosts = new Map();
    posts.forEach(post => {
      if (!uniquePosts.has(post.id)) {
        uniquePosts.set(post.id, post);
      }
    });
    const deduplicatedPosts = Array.from(uniquePosts.values());
    console.log(`✅ Deduplicated: ${deduplicatedPosts.length}/${posts.length} unique posts`);

    // Step 2: Save all unique Reddit posts to database (with duplicate handling)
    console.log(`💾 Saving ${deduplicatedPosts.length} Reddit posts to database...`);
    
    const redditPostData = deduplicatedPosts.map(post => ({
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

    console.log(`✅ Successfully saved ${savedPosts?.length || 0} Reddit posts to database`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully saved ${savedPosts?.length || 0} Reddit posts to database`,
      posts_fetched: savedPosts?.length || 0,
      posts: savedPosts
    });

  } catch (error) {
    console.error('Error in POST /api/reddit:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET request received for /api/reddit');
    
    // Check if this is a cleanup request
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'cleanup') {
      console.log('🧹 Cleanup action requested');
      await cleanCorruptedData(supabase);
      return NextResponse.json({ 
        success: true, 
        message: 'Database cleanup completed successfully' 
      });
    }
    
    // Regular GET request - fetch existing business ideas
    const { data: ideas, error } = await supabase
      .from('business_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching business ideas:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch business ideas' 
      }, { status: 500 });
    }
    
    console.log(`✅ Successfully fetched ${ideas?.length || 0} business ideas`);
    
    return NextResponse.json({ 
      success: true, 
      posts: ideas || [],
      count: ideas?.length || 0
    });
    
  } catch (error) {
    console.error('💥 Unexpected error in GET:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}