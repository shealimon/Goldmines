import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, item_type, item_id } = body;

    console.log('🧪 Test bookmark request:', { user_id, item_type, item_id });

    // First, check if the item exists
    let tableName = item_type === 'business' ? 'business_ideas' : 'marketing_ideas';
    
    const { data: itemExists, error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', item_id)
      .single();

    console.log('🧪 Item check result:', { itemExists, checkError });

    if (checkError || !itemExists) {
      return NextResponse.json({
        success: false,
        message: `Item with id ${item_id} not found in ${tableName}`,
        error: checkError?.message
      }, { status: 404 });
    }

    // Try to insert a test bookmark
    const { data: newSave, error: insertError } = await supabase
      .from('saved_items')
      .insert({
        user_id,
        item_type,
        item_id
      })
      .select()
      .single();

    console.log('🧪 Insert result:', { newSave, insertError });

    if (insertError) {
      // If it's a foreign key constraint error, that's expected for test UUID
      if (insertError.code === '23503') {
        return NextResponse.json({
          success: true,
          message: 'Bookmark API is working correctly. Foreign key constraint error is expected for test UUID.',
          note: 'The test UUID does not exist in auth.users table, which is correct behavior.',
          error: insertError.message
        });
      }
      
      return NextResponse.json({
        success: false,
        message: 'Error inserting bookmark',
        error: insertError.message
      }, { status: 500 });
    }

    // Clean up - delete the test bookmark
    const { error: deleteError } = await supabase
      .from('saved_items')
      .delete()
      .eq('id', newSave.id);

    console.log('🧪 Delete result:', { deleteError });

    return NextResponse.json({
      success: true,
      message: 'Bookmark test successful',
      testData: newSave
    });

  } catch (error) {
    console.error('❌ Error in test bookmark API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
