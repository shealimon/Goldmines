import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, item_type, item_id } = body;

    console.log('🧪 Direct bookmark test:', { user_id, item_type, item_id });

    // Test 1: Check if user exists in profiles table
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    console.log('🧪 User check:', { userExists: !!userExists, userError });

    // Test 2: Check if item exists
    let tableName = item_type === 'business' ? 'business_ideas' : 'marketing_ideas';
    const { data: itemExists, error: itemError } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', item_id)
      .single();

    console.log('🧪 Item check:', { itemExists, itemError });

    // Test 3: Try to insert bookmark
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

    // Test 4: Clean up if successful
    if (newSave) {
      const { error: deleteError } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', newSave.id);
      
      console.log('🧪 Cleanup result:', { deleteError });
    }

    return NextResponse.json({
      success: true,
      tests: {
        userExists: !!userExists,
        userError: userError?.message,
        itemExists: !!itemExists,
        itemError: itemError?.message,
        insertSuccess: !!newSave,
        insertError: insertError?.message,
        cleanupSuccess: !insertError || !!newSave
      },
      data: {
        user: userExists,
        item: itemExists,
        bookmark: newSave
      }
    });

  } catch (error) {
    console.error('❌ Error in direct bookmark test:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
