import { NextResponse } from 'next/server';
import { redditAPI } from '@/lib/reddit';
import { openaiService } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to parse structured response
const parseStructuredResponse = (text: string) => {
  const extractSection = (text: string, sectionName: string): string[] => {
    const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n|\\n[A-Za-z]|$)`, 'i');
    const match = text.match(regex);
    if (!match) return [];
    
    return match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.substring(1).trim())
      .filter(line => line.length > 0);
  };

  const extractSingleLine = (text: string, sectionName: string): string => {
    const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n|\\n[A-Za-z]|$)`, 'i');
    const match = text.match(regex);
    if (!match) return '';
    
    return match[1].trim().split('\n')[0].replace(/^\[|\]$/g, '').trim();
  };

  return {
    business_idea_name: extractSingleLine(text, 'Business Idea'),
    opportunity_points: extractSection(text, 'Opportunity'),
    problems_solved: extractSection(text, 'Problem it Solves'),
    target_customers: extractSection(text, 'Target Customer'),
    market_size: extractSection(text, 'Market Size'),
    niche: extractSingleLine(text, 'Niche'),
    category: extractSingleLine(text, 'Category'),
    marketing_strategy: extractSection(text, 'Marketing Strategy')
  };
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
        // Pre-filter posts to remove non-business ideas
        const filteredPosts = [];
        for (const post of batch) {
          const hasBusinessIdea = await openaiService.preFilterBusinessIdea(
            `Title: ${post.title}\nContent: ${post.content}`
          );
          if (hasBusinessIdea) {
            filteredPosts.push(post);
          } else {
            console.log(`Skipping post ${post.id} - no business idea detected`);
          }
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
            
            console.log('Analyzed post data:', {
              business_idea_name: analyzedPost.business_idea_name,
              niche: analyzedPost.niche,
              category: analyzedPost.category
            });
            
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

            console.log('Saving to database:', {
              business_idea_name: businessIdeaData.business_idea_name,
              niche: businessIdeaData.niche,
              category: businessIdeaData.category
            });

            const { data: businessData, error: businessError } = await supabase
              .from('business_ideas')
              .insert(businessIdeaData)
              .select()
              .single();

            if (businessError) {
              console.error('Business idea save error:', businessError);
              continue;
            }

            console.log('Successfully saved business idea:', businessData.id);
            
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
      
      // Fetch 10 posts from multiple subreddits for testing
      const posts = await redditAPI.fetchAllSubreddits(10);
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
    console.log('POST /api/reddit - Fetching 10 posts from Reddit...');
    
    // Fetch 10 posts from Reddit
    const posts = await redditAPI.fetchAllSubreddits(10);
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
      });
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
      });
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
