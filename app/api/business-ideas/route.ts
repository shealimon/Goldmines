import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { redditAPI } from '@/lib/reddit';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a bulk fetch and analyze action
    if (body.action === 'fetch_and_analyze') {
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

    // Analyze the Reddit post with OpenAI
    const analyzedPost = await openaiService.analyzeRedditPost(reddit_post);
    
    console.log('✅ OpenAI analysis completed:', analyzedPost.business_idea_name);

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
    const duplicateCheck = await detectDuplicatePost(reddit_post, supabase);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json({
        success: false,
        message: 'Duplicate post detected across subreddits',
        reason: duplicateCheck.reason,
        existing_id: duplicateCheck.existingId
      }, { status: 409 });
    }

    // Save the business idea to the database
    const businessIdeaData = {
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

    console.log('💾 Saving business idea to database...');

    const { data, error } = await supabase
      .from('business_ideas')
      .insert(businessIdeaData)
      .select()
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

// New function to handle bulk fetch and analyze
async function handleBulkFetchAndAnalyze() {
  try {
    console.log('🚀 Starting bulk fetch and analyze process...');
    
    // Fetch posts from Reddit subreddits
    const posts = await redditAPI.fetchAllSubreddits(100, ['entrepreneur', 'indiehackers', 'startups', 'saas']);
    console.log(`✅ Fetched ${posts.length} posts from Reddit`);
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No posts fetched from Reddit. Please try again.'
      }, { status: 400 });
    }
    
    // Filter for business idea posts
    const businessPosts = redditAPI.filterBusinessIdeaPosts(posts);
    console.log(`✅ Filtered to ${businessPosts.length} business idea posts`);
    
    if (businessPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No business idea posts found. Please try again.'
      }, { status: 400 });
    }
    
    // Analyze posts with OpenAI and save to database in batches for faster processing
    const postsToAnalyze = businessPosts; // Process all business posts
    let analyzedCount = 0;
    let skippedCount = 0;
    
    // Process posts in batches of 5 for faster processing
    const batchSize = 5;
    for (let i = 0; i < postsToAnalyze.length; i += batchSize) {
      const batch = postsToAnalyze.slice(i, i + batchSize);
      console.log(`🚀 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(postsToAnalyze.length / batchSize)} (${batch.length} posts)`);
      
      // Process batch in parallel for speed
      const batchPromises = batch.map(async (post) => {
        try {
          console.log(`🧠 Analyzing post: ${post.title.substring(0, 50)}...`);
          
          // Check for duplicates before analyzing
          const duplicateCheck = await detectDuplicatePost(post, supabase);
          if (duplicateCheck.isDuplicate) {
            console.log(`⚠️ Skipping duplicate post: ${duplicateCheck.reason}`);
            skippedCount++;
            return null;
          }
          
          // Analyze with OpenAI
          const analyzedPost = await openaiService.analyzeRedditPost(post);
          
          // Save to database
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

          const { error } = await supabase
            .from('business_ideas')
            .insert(businessIdeaData);

          if (!error) {
            analyzedCount++;
            console.log(`✅ Successfully analyzed and saved post ${analyzedCount}/${postsToAnalyze.length}`);
            return true;
          } else {
            console.error(`❌ Error saving post:`, error);
            return false;
          }
          
        } catch (error) {
          console.error(`❌ Error analyzing post:`, error);
          return false;
        }
      });
      
      // Wait for batch to complete
      await Promise.all(batchPromises);
      
      // Small delay between batches to prevent overwhelming the APIs
      if (i + batchSize < postsToAnalyze.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`🎯 Completed analysis: ${analyzedCount} posts saved, ${skippedCount} duplicates skipped`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully analyzed and saved ${analyzedCount} new business ideas`,
      count: analyzedCount,
      skipped: skippedCount,
      total_fetched: posts.length,
      business_posts: businessPosts.length
    });
    
  } catch (error) {
    console.error('❌ Error in bulk fetch and analyze:', error);
    return NextResponse.json(
      { success: false, message: 'Error in bulk fetch and analyze process', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('📖 GET /api/business-ideas - Fetching business ideas...');
    
    // Fetch all business ideas from the database
    const { data, error } = await supabase
      .from('business_ideas')
      .select('*')
      .eq('analysis_status', 'completed')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase select error:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching business ideas', error: error.message },
        { status: 500 }
      );
    }
    
    console.log('📊 Business ideas retrieved:', data?.length || 0);
    
    return NextResponse.json({
      success: true,
      business_ideas: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching business ideas' },
      { status: 500 }
    );
  }
}