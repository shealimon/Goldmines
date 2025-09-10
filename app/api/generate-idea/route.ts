import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea_description, user_generated } = body;

    if (!idea_description) {
      return NextResponse.json({ 
        success: false, 
        message: 'Business idea description is required' 
      }, { status: 400 });
    }

    console.log('🚀 Generating business idea from user input:', idea_description.substring(0, 50));

    // Create a mock Reddit post structure for OpenAI analysis
    const mockRedditPost = {
      id: `user_generated_${Date.now()}`,
      title: idea_description.substring(0, 100),
      content: idea_description,
      author: 'User Generated',
      subreddit: 'entrepreneur',
      score: 0,
      num_comments: 0,
      url: '',
      permalink: '',
      created_utc: Math.floor(Date.now() / 1000)
    };

    // Analyze the business idea with OpenAI
         const analyzedPosts = await openaiService.batchAnalyzeRedditPosts([mockRedditPost]);
     const analyzedPost = analyzedPosts[0];
    
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

    // First, save the mock Reddit post to reddit_posts table
    const redditPostData = {
      reddit_post_id: mockRedditPost.id,
      reddit_title: mockRedditPost.title,
      reddit_content: mockRedditPost.content || '',
      reddit_author: mockRedditPost.author,
      reddit_subreddit: mockRedditPost.subreddit,
      reddit_score: mockRedditPost.score || 0,
      reddit_comments: mockRedditPost.num_comments || 0,
      reddit_url: mockRedditPost.url,
      reddit_permalink: mockRedditPost.permalink,
      reddit_created_utc: mockRedditPost.created_utc
    };

    console.log('💾 Saving mock Reddit post to database...');
    const { data: redditPost, error: redditError } = await supabaseAdmin
      .from('reddit_posts')
      .insert(redditPostData)
      .select()
      .single();

    if (redditError) {
      console.error('❌ Error saving Reddit post:', redditError);
      return NextResponse.json(
        { success: false, message: 'Error saving Reddit post' },
        { status: 500 }
      );
    }

    // Save the business idea to the database
    const businessIdeaData = {
      reddit_post_id: redditPost.id, // Use database ID, not Reddit post ID
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

    console.log('💾 Saving user-generated business idea to database...');

    const { data, error } = await supabaseAdmin
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

    console.log('✅ User-generated business idea saved successfully:', data.id);

    return NextResponse.json({
      success: true,
      message: 'Business idea generated and saved successfully',
      business_idea: data
    });

  } catch (error) {
    console.error('❌ Error generating business idea:', error);
    return NextResponse.json(
      { success: false, message: 'Error generating business idea', error: String(error) },
      { status: 500 }
    );
  }
}
