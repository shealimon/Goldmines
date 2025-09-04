import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🧪 Testing saved_items table connection...');
    
    // Test if table exists by trying to select from it
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing saved_items table:', error);
      return NextResponse.json({
        success: false,
        message: 'Error accessing saved_items table',
        error: error.message
      }, { status: 500 });
    }
    
    console.log('✅ saved_items table accessible, found', data?.length || 0, 'records');
    
    return NextResponse.json({
      success: true,
      message: 'saved_items table is accessible',
      recordCount: data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Error in test API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
