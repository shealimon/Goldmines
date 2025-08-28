import { NextResponse } from 'next/server';
import { redditAPI } from '@/lib/reddit';
import { openaiService } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

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
    const regex = new RegExp(`${sectionName}:([\\s\\n\\S]*?)(?=\\n\\n|\\n[A-Za-z]|$)`, 'i');
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

    // 1.5. Check by exact title match (catches crossposts with identical titles)
    const { data: existingByExactTitle, error: exactTitleError } = await supabase
      .from('business_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_author')
      .eq('reddit_title', post.title) // Exact title match
      .single();

    if (existingByExactTitle) {
      console.log(`🚫 DUPLICATE DETECTED: Exact same title "${post.title}" already exists in r/${existingByExactTitle.reddit_subreddit} by ${existingByExactTitle.reddit_author}`);
      return { 
        isDuplicate: true, 
        reason: `Exact same title already exists in r/${existingByExactTitle.reddit_subreddit} by ${existingByExactTitle.reddit_author}`, 
        existingId: existingByExactTitle.id 
      };
    }

    // 2. Check by title and content similarity (same content, different post)
    const normalizedTitle = post.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalizedContent = post.content.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    // Check for very similar titles first
    const { data: existingByTitle, error: titleError } = await supabase
      .from('business_ideas')
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

    // 3. Check by additional title similarity patterns (different from step 2)
    const { data: additionalTitleMatches, error: additionalTitleError } = await supabase
      .from('business_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_author')
      .ilike('reddit_title', `%${normalizedTitle.substring(0, 15)}%`)
      .limit(2)
      .neq('id', existingByTitle?.[0]?.id || '') // Exclude already checked posts
      .single();

    if (additionalTitleMatches) {
      // Calculate title similarity percentage
      const existingTitle = additionalTitleMatches.reddit_title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const similarity = calculateSimilarity(normalizedTitle, existingTitle);
      
      if (similarity > 0.8) { // 80% similarity threshold
        return { 
          isDuplicate: true, 
          reason: `Very similar title (${Math.round(similarity * 100)}% match) already exists in r/${additionalTitleMatches.reddit_subreddit}`, 
          existingId: additionalTitleMatches.id 
        };
      }
    }

    // 4. Check by author + similar content (same user posting similar ideas)
    const { data: existingByAuthor, error: authorError } = await supabase
      .from('business_ideas')
      .select('id, reddit_title, reddit_subreddit, reddit_content')
      .eq('reddit_author', post.author)
      .limit(5);

    if (existingByAuthor && existingByAuthor.length > 0) {
      for (const existing of existingByAuthor) {
        const existingContent = existing.reddit_content.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const currentContent = post.content.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const contentSimilarity = calculateSimilarity(currentContent, existingContent);
        
        if (contentSimilarity > 0.7) { // 70% content similarity threshold
          return { 
            isDuplicate: true, 
            reason: `Similar content by same author (${Math.round(contentSimilarity * 100)}% match) already exists in r/${existing.reddit_subreddit}`, 
            existingId: existing.id 
          };
        }
      }
    }

    // 5. Check if same user already has a post with similar title (prevent user from posting same idea multiple times)
    const { data: existingByUserTitle, error: userTitleError } = await supabase
      .from('business_ideas')
      .select('id, reddit_title, reddit_subreddit')
      .eq('reddit_author', post.author)
      .ilike('reddit_title', `%${normalizedTitle.substring(0, 25)}%`)
      .limit(3);

    if (existingByUserTitle && existingByUserTitle.length > 0) {
      for (const existing of existingByUserTitle) {
        const existingTitle = existing.reddit_title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const titleSimilarity = calculateSimilarity(normalizedTitle, existingTitle);
        
        if (titleSimilarity > 0.6) { // 60% title similarity threshold for same user
          return { 
            isDuplicate: true, 
            reason: `Same user already posted similar idea (${Math.round(titleSimilarity * 100)}% title match) in r/${existing.reddit_subreddit}`, 
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
            
            console.log('Analyzed post data:', {
              business_idea_name: analyzedPost.business_idea_name,
              niche: analyzedPost.niche,
              category: analyzedPost.category
            });

            // Validate that full_analysis is not empty
            if (!analyzedPost.full_analysis || analyzedPost.full_analysis.trim().length < 50) {
              console.log(`⚠️ Skipping post ${post.id} - full_analysis is empty or too short (${analyzedPost.full_analysis?.length || 0} characters)`);
              continue;
            }

            // Validate that business idea name is not empty
            if (!analyzedPost.business_idea_name || analyzedPost.business_idea_name.trim().length < 5) {
              console.log(`⚠️ Skipping post ${post.id} - business_idea_name is empty or too short (${analyzedPost.business_idea_name?.length || 0} characters)`);
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
              console.error(`❌ Error saving business idea for post ${post.id}:`, businessError);
              
              // Check if it's a duplicate constraint violation
              if (businessError.code === '23505') {
                console.log(`🚫 Database constraint violation - duplicate detected for post ${post.id}`);
                
                // Get more details about the constraint violation
                if (businessError.message.includes('unique_reddit_post_id')) {
                  console.log(`🚫 Duplicate reddit_post_id: ${post.id}`);
                } else if (businessError.message.includes('unique_title_author')) {
                  console.log(`🚫 Duplicate title + author combination: "${post.title}" by ${post.author}`);
                }
                
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
        .limit(10);
      
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