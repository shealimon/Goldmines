import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, item_type, item_id } = body;

    console.log('🔖 Full request body:', body);
    console.log('🔖 Parsed values:', { user_id, item_type, item_id });

    // Validate required fields
    if (!user_id || !item_type || !item_id) {
      console.log('❌ Missing required fields:', { user_id, item_type, item_id });
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: user_id, item_type, item_id'
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.log('❌ Invalid UUID format:', user_id);
      return NextResponse.json({
        success: false,
        message: 'Invalid user_id format. Must be a valid UUID.'
      }, { status: 400 });
    }

    // Validate item_type
    if (!['business', 'marketing'].includes(item_type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid item_type. Must be "business" or "marketing"'
      }, { status: 400 });
    }

    console.log(`🔖 Bookmark request: user_id=${user_id}, item_type=${item_type}, item_id=${item_id}`);

    // Check if the item exists in the respective table
    let tableName = '';
    let titleField = '';
    
    if (item_type === 'business') {
      tableName = 'business_ideas';
      titleField = 'business_idea_name';
    } else {
      tableName = 'marketing_ideas';
      titleField = 'marketing_idea_name';
    }

    const { data: itemExists, error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', item_id)
      .single();

    if (checkError || !itemExists) {
      return NextResponse.json({
        success: false,
        message: `Item with id ${item_id} not found in ${tableName}`
      }, { status: 404 });
    }

    // Check if already saved
    const { data: existingSave, error: fetchError } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user_id)
      .eq('item_type', item_type)
      .eq('item_id', item_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing save:', fetchError);
      return NextResponse.json({
        success: false,
        message: 'Error checking existing bookmark'
      }, { status: 500 });
    }

    let action = '';
    let result = null;

    if (existingSave) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user_id)
        .eq('item_type', item_type)
        .eq('item_id', item_id);

      if (deleteError) {
        console.error('Error removing bookmark:', deleteError);
        return NextResponse.json({
          success: false,
          message: 'Error removing bookmark'
        }, { status: 500 });
      }

      action = 'removed';
      console.log(`✅ Bookmark removed: user_id=${user_id}, item_type=${item_type}, item_id=${item_id}`);
    } else {
      // Add bookmark
      const { data: newSave, error: insertError } = await supabase
        .from('saved_items')
        .insert({
          user_id,
          item_type,
          item_id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding bookmark:', insertError);
        return NextResponse.json({
          success: false,
          message: 'Error adding bookmark'
        }, { status: 500 });
      }

      action = 'added';
      result = newSave;
      console.log(`✅ Bookmark added: user_id=${user_id}, item_type=${item_type}, item_id=${item_id}`);
    }

    return NextResponse.json({
      success: true,
      action,
      message: `Bookmark ${action} successfully`,
      data: result
    });

  } catch (error) {
    console.error('❌ Error in bookmark API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
