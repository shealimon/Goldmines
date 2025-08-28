import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { createBusinessIdea, findBusinessIdeas, findBusinessIdeaByRedditPostId } from '@/lib/local-auth';

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
    const existingIdea = findBusinessIdeaByRedditPostId(reddit_post.id);

    if (existingIdea) {
      return NextResponse.json({
        success: false,
        message: 'This Reddit post has already been analyzed',
        existing_id: existingIdea.id
      }, { status: 409 });
    }

    // Save the business idea to the local storage
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

    console.log('💾 Saving business idea to local storage...');

    const savedIdea = createBusinessIdea(businessIdeaData);

    console.log('✅ Business idea saved successfully:', savedIdea.id);

    return NextResponse.json({
      success: true,
      message: 'Business idea analyzed and saved successfully',
      business_idea: savedIdea
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
    
    // Fetch all business ideas from local storage
    const data = findBusinessIdeas();
    
    console.log('📊 Business ideas retrieved:', data.length);
    
    return NextResponse.json({
      success: true,
      business_ideas: data,
      count: data.length
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching business ideas' },
      { status: 500 }
    );
  }
}