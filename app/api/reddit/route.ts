import { NextResponse } from 'next/server';
import { redditAPI } from '@/lib/reddit';
import { openaiService } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
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

// Process posts in batches with parallel processing
const processPostsInBatches = async (posts: any[], batchSize: number = 5): Promise<any[]> => {
  const batches: any[][] = [];
  for (let i = 0; i < posts.length; i += batchSize) {
    batches.push(posts.slice(i, i + batchSize));
  }

  console.log(`Processing ${posts.length} posts in ${batches.length} batches of ${batchSize}`);

  const allProcessedPosts: any[] = [];
  
  // Process batches in parallel
  const batchResults = await Promise.all(
    batches.map(async (batch, batchIndex) => {
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} posts`);
      
      try {
        // Pre-filter posts to remove non-business ideas and duplicates
        const filteredPosts = [];
        for (const post of batch) {
          // First check if it's a business idea
          const hasBusinessIdea = await openaiService.preFilterBusinessIdea(
            `Title: ${post.title}\nContent: ${post.content}`
          );
          
          if (!hasBusinessIdea) {
            console.log(`Skipping post ${post.id} - no business idea detected`);
            continue;
          }

          // Then check for duplicates across subreddits
          const duplicateCheck = await detectDuplicatePost(post, supabase);
          if (duplicateCheck.isDuplicate) {
            console.log(`🚫 Skipping duplicate post ${post.id}: ${duplicateCheck.reason}`);
            continue;
          }

          console.log(`✅ Post ${post.id} passed duplicate check - adding to batch`);
          filteredPosts.push(post);
        }

        if (filteredPosts.length === 0) {
          console.log(`Batch ${batchIndex + 1}: No business ideas found`);
          return [];
        }

        // Process each analyzed post directly (individual processing)
        const batchProcessedPosts: any[] = [];
        
        for (const post of filteredPosts) {
          try {
            console.log(`Analyzing post: ${post.title.substring(0, 50)}...`);
            const analyzedPost = await openaiService.analyzeRedditPost(post);
            
            // Validate that full_analysis is not empty
            if (!analyzedPost.full_analysis || analyzedPost.full_analysis.trim().length < 50) {
              console.log(`⚠️ Skipping post ${post.id} - full_analysis is empty or too short`);
              continue;
            }

            // Validate that business idea name is not empty
            if (!analyzedPost.business_idea_name || analyzedPost.business_idea_name.trim().length < 5) {
              console.log(`⚠️ Skipping post ${post.id} - business_idea_name is empty or too short`);
              continue;
            }
            
            // Save to database using already-parsed data
            const businessIdeaData = {
              reddit_post_id: post.id,
              reddit_title: post.title,
              reddit_content: post.content || '',
              reddit_author: post.author,
              reddit_subreddit: post.subreddit,
              reddit_score: post.score || 0,
              reddit_comments: post.num_comments || 0,
              reddit_url: post.url,
              reddit_permalink: post.permalink,
              reddit_created_utc: post.created_utc,
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

            const { data: businessData, error: businessError } = await supabase
              .from('business_ideas')
              .insert(businessIdeaData)
              .select()
              .single();

            if (businessError) {
              console.error(`❌ Error saving business idea for post ${post.id}:`, businessError);
              
              // Check if it's a duplicate constraint violation
              if (businessError.code === '23505') {
                console.log(`🚫 Database constraint violation - duplicate detected for post ${post.id}`);
                continue;
              }
              
              // Check if it's a check constraint violation
              if (businessError.code === '23514') {
                console.log(`🚫 Check constraint violation for post ${post.id}:`, businessError.message);
                continue;
              }
              
              continue;
            }

            if (!businessData || !businessData.id) {
              console.error(`❌ No data returned after saving business idea for post ${post.id}`);
              continue;
            }

            console.log('✅ Successfully saved business idea:', businessData.id);
            
            batchProcessedPosts.push({
              post_id: post.id,
              title: post.title,
              business_idea: analyzedPost.business_idea_name,
              saved_id: businessData.id
            });
            
            // Add delay between calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
            
          } catch (error) {
            console.error(`Error processing post ${post.id}:`, error);
            continue;
          }
        }

        return batchProcessedPosts;
      } catch (error) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error);
        return [];
      }
    })
  );

  // Flatten results
  batchResults.forEach(batch => {
    allProcessedPosts.push(...batch);
  });

  return allProcessedPosts;
};



export async function POST(request: Request) {
  try {
    const { testMode = false } = await request.json();
    
    if (testMode) {
      console.log('TEST MODE: Fetching and analyzing Reddit posts...');
      
      // First, let's check what's already in the database
      console.log('🔍 Checking existing posts in database...');
      const { data: existingPosts, error: existingError } = await supabase
        .from('business_ideas')
        .select('id, reddit_title, reddit_author, reddit_subreddit, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (existingError) {
        console.log('⚠️ Error fetching existing posts:', existingError);
      } else {
        console.log(`📊 Found ${existingPosts?.length || 0} existing posts:`, existingPosts?.map(p => ({
          id: p.id,
          title: p.reddit_title,
          author: p.reddit_author,
          subreddit: p.reddit_subreddit,
          created: p.created_at
        })));
      }
      
      // Fetch 50 posts from multiple subreddits for testing
      const posts = await redditAPI.fetchAllSubreddits(50);
      console.log('Fetched posts from Reddit:', posts.length);
      
      if (posts.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'No posts fetched from Reddit'
        });
      }

      // Process posts in batches with parallel processing
      const processedPosts = await processPostsInBatches(posts, 5); // Process 5 posts per batch
      
      console.log(`Test completed: ${processedPosts.length} posts analyzed and saved`);
      
      return NextResponse.json({
        success: true,
        message: `Test completed successfully - ${processedPosts.length} Reddit posts analyzed and business ideas saved`,
        test_mode: true,
        total_posts_fetched: posts.length,
        successfully_processed: processedPosts.length,
        processed_posts: processedPosts
      });
    }

    // Your existing code for normal mode continues here...
    console.log('POST /api/reddit - Fetching 50 posts from Reddit...');
    
    // Fetch 50 posts from Reddit
    const posts = await redditAPI.fetchAllSubreddits(50);
    console.log('Posts fetched from Reddit:', posts.length);
    
    if (posts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No posts fetched from Reddit'
      });
    }

    // Check for duplicates before inserting
    const redditPostIds = posts.map(post => post.id);
    console.log('Checking for duplicates:', redditPostIds);
    
    const { data: existingPosts, error: checkError } = await supabase
      .from('reddit_posts')
      .select('reddit_post_id')
      .in('reddit_post_id', redditPostIds);
    
    if (checkError) {
      console.error('Error checking duplicates:', checkError);
      return NextResponse.json({ 
        success: false, 
        message: 'Error checking for duplicate posts'
      }, { status: 500 });
    }

    // Filter out existing posts
    const existingPostIds = existingPosts?.map(post => post.reddit_post_id) || [];
    const newPosts = posts.filter(post => !existingPostIds.includes(post.id));
    
    if (newPosts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All posts already exist in database'
      });
    }

    console.log(`Inserting ${newPosts.length} new posts into reddit_posts table...`);
    
    // Insert new posts into reddit_posts table
    const { data: insertedPosts, error: insertError } = await supabase
      .from('reddit_posts')
      .insert(newPosts.map(post => ({
        reddit_post_id: post.id,
        title: post.title,
        content: post.content || '',
        author: post.author,
        subreddit: post.subreddit,
        score: post.score || 0,
        num_comments: post.num_comments || 0,
        url: post.url,
        permalink: post.permalink,
        created_utc: post.created_utc
      })))
      .select();

    if (insertError) {
      console.error('Error inserting posts:', insertError);
      return NextResponse.json({ 
        success: false, 
        message: 'Error inserting posts into database'
      }, { status: 500 });
    }

    console.log(`Successfully inserted ${insertedPosts.length} posts into reddit_posts table`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully fetched and stored ${insertedPosts.length} Reddit posts`,
      posts_fetched: insertedPosts.length,
      posts: insertedPosts
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