import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    // Check if this post has already been analyzed
    const { data: existingIdea, error: checkError } = await supabase
      .from('business_ideas')
      .select('id')
      .eq('reddit_post_id', reddit_post.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking existing business idea:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking database', error: checkError.message },
        { status: 500 }
      );
    }

    if (existingIdea) {
      return NextResponse.json({
        success: false,
        message: 'This Reddit post has already been analyzed',
        existing_id: existingIdea.id
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
