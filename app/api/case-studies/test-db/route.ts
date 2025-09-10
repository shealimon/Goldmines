import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');

    // Test simple insert to case_studies table
    const { data: caseStudy, error: caseStudyError } = await supabaseAdmin
      .from('case_studies')
      .insert({
        slug: 'test-db-connection',
        title: 'Test Database Connection',
        subtitle: 'Testing if database works',
        category: 'Test',
        cover_image_url: null,
        current_revenue: 1000,
        valuation: 10000,
        starting_income: 100,
        lifetime_revenue: 2000,
        users_count: 10,
        market_context: 'Test market',
        raw_output: { test: 'data' },
        sources: ['test.com'],
        confidence: { funding: 0.5, revenue: 0.5, overall: 0.5 },
        needs_review: true,
        is_published: false,
        created_by: null
      })
      .select()
      .single();

    if (caseStudyError) {
      console.error('❌ Database error:', caseStudyError);
      return NextResponse.json({
        success: false,
        message: 'Database test failed',
        error: caseStudyError.message
      }, { status: 500 });
    }

    console.log('✅ Database test successful:', caseStudy);

    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      data: caseStudy
    });

  } catch (error) {
    console.error('❌ Error in database test:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
