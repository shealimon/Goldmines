import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Fetching case studies...');

    // Get all case studies with count
    const { data: caseStudies, error: caseStudiesError, count } = await supabaseAdmin
      .from('case_studies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (caseStudiesError) {
      console.error('Error fetching case studies:', caseStudiesError);
      return NextResponse.json({
        success: false,
        message: 'Error fetching case studies',
        error: caseStudiesError.message
      }, { status: 500 });
    }

    console.log(`✅ Retrieved ${caseStudies?.length || 0} case studies (total: ${count || 0})`);

    return NextResponse.json({
      success: true,
      case_studies: caseStudies || [],
      count: count || 0
    });

  } catch (error) {
    console.error('❌ Error in case studies API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
