import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Checking database errors and constraints...');
    
    // Check business_ideas table structure
    const { data: businessIdeas, error: businessError } = await supabaseAdmin
      .from('business_ideas')
      .select('*')
      .limit(5);
    
    console.log('📊 Business ideas table check:', {
      count: businessIdeas?.length || 0,
      error: businessError?.message || 'none'
    });
    
    // Check reddit_posts table structure
    const { data: redditPosts, error: redditError } = await supabaseAdmin
      .from('reddit_posts')
      .select('*')
      .limit(5);
    
    console.log('📊 Reddit posts table check:', {
      count: redditPosts?.length || 0,
      error: redditError?.message || 'none'
    });
    
    // Try to insert a test business idea to see what errors occur
    console.log('🧪 Testing business idea insertion...');
    
    const testBusinessIdea = {
      reddit_post_id: redditPosts?.[0]?.id || 1, // Use first reddit post ID
      business_idea_name: 'Test Business Idea',
      opportunity_points: 'Test opportunity',
      problems_solved: 'Test problems',
      target_customers: 'Test customers',
      market_size: 'Test market',
      niche: 'Test niche',
      category: 'Test category',
      marketing_strategy: 'Test strategy',
      analysis_status: 'completed',
      full_analysis: 'This is a test business idea analysis with enough content to pass validation.'
    };
    
    const { data: testInsert, error: testError } = await supabaseAdmin
      .from('business_ideas')
      .insert(testBusinessIdea)
      .select()
      .single();
    
    console.log('🧪 Test insertion result:', {
      success: !testError,
      error: testError?.message || 'none',
      error_code: testError?.code || 'none',
      data: testInsert?.id || 'none'
    });
    
    // If test was successful, clean it up
    if (testInsert && !testError) {
      await supabaseAdmin
        .from('business_ideas')
        .delete()
        .eq('id', testInsert.id);
      console.log('🧹 Cleaned up test record');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database error check completed',
      results: {
        business_ideas: {
          count: businessIdeas?.length || 0,
          error: businessError?.message || 'none',
          sample_data: businessIdeas?.[0] || null
        },
        reddit_posts: {
          count: redditPosts?.length || 0,
          error: redditError?.message || 'none',
          sample_data: redditPosts?.[0] || null
        },
        test_insertion: {
          success: !testError,
          error: testError?.message || 'none',
          error_code: testError?.code || 'none',
          error_details: testError || null
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking database',
      error: String(error)
    }, { status: 500 });
  }
}
