import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Checking case study tables...');

    // Check if case_studies table exists and has data
    const { data: caseStudies, error: caseStudiesError } = await supabaseAdmin
      .from('case_studies')
      .select('id, slug, title')
      .limit(5);

    if (caseStudiesError) {
      console.error('❌ Error checking case_studies:', caseStudiesError);
      return NextResponse.json({
        success: false,
        message: 'Error checking case_studies table',
        error: caseStudiesError
      }, { status: 500 });
    }

    console.log('✅ case_studies table:', caseStudies);

    // Check if case_study_funding table exists
    const { data: funding, error: fundingError } = await supabaseAdmin
      .from('case_study_funding')
      .select('*')
      .limit(1);

    if (fundingError) {
      console.error('❌ Error checking case_study_funding:', fundingError);
      return NextResponse.json({
        success: false,
        message: 'Error checking case_study_funding table',
        error: fundingError
      }, { status: 500 });
    }

    console.log('✅ case_study_funding table accessible');

    // Check table structure
    const { data: tableInfo, error: tableInfoError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'case_study_funding' });

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      data: {
        caseStudies: caseStudies?.length || 0,
        fundingTableAccessible: true,
        tableInfo: tableInfo
      }
    });

  } catch (error) {
    console.error('❌ Error in database check:', error);
    return NextResponse.json({
      success: false,
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
