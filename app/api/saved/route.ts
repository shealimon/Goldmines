import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({
        success: false,
        message: 'user_id is required'
      }, { status: 400 });
    }

    console.log(`📚 Fetching saved items for user: ${user_id}`);

    // Get all saved items for the user
    const { data: savedItems, error: savedError } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (savedError) {
      console.error('Error fetching saved items:', savedError);
      return NextResponse.json({
        success: false,
        message: 'Error fetching saved items'
      }, { status: 500 });
    }

    if (!savedItems || savedItems.length === 0) {
      return NextResponse.json({
        success: true,
        saved_items: []
      });
    }

    // Separate business and marketing items
    const businessItemIds = savedItems
      .filter(item => item.item_type === 'business')
      .map(item => item.item_id);
    
    const marketingItemIds = savedItems
      .filter(item => item.item_type === 'marketing')
      .map(item => item.item_id);

    const unifiedItems: Array<{
      id: number;
      item_type: string;
      title: string;
      summary: string;
      category: string;
      niche?: string;
      saved_at: string;
    }> = [];

    // Fetch business ideas if any
    if (businessItemIds.length > 0) {
      const { data: businessIdeas, error: businessError } = await supabase
        .from('business_ideas')
        .select(`
          id,
          business_idea_name,
          full_analysis,
          category,
          niche,
          reddit_posts!inner (
            reddit_title,
            reddit_author,
            reddit_subreddit
          )
        `)
        .in('id', businessItemIds);

      if (businessError) {
        console.error('Error fetching business ideas:', businessError);
      } else if (businessIdeas) {
        // Map business ideas to unified format
        businessIdeas.forEach(idea => {
          const savedItem = savedItems.find(item => 
            item.item_type === 'business' && item.item_id === idea.id
          );
          
          unifiedItems.push({
            id: idea.id,
            item_type: 'business',
            title: idea.business_idea_name || (idea.reddit_posts as any)?.reddit_title || 'Untitled Business Idea',
            summary: idea.full_analysis?.substring(0, 200) + '...' || 'No description available',
            category: idea.category || 'General',
            niche: idea.niche,
            saved_at: savedItem?.created_at
          });
        });
      }
    }

    // Fetch marketing ideas if any
    if (marketingItemIds.length > 0) {
      const { data: marketingIdeas, error: marketingError } = await supabase
        .from('marketing_ideas')
        .select(`
          id,
          marketing_idea_name,
          full_analysis,
          category,
          reddit_posts!inner (
            reddit_title,
            reddit_author,
            reddit_subreddit
          )
        `)
        .in('id', marketingItemIds);

      if (marketingError) {
        console.error('Error fetching marketing ideas:', marketingError);
      } else if (marketingIdeas) {
        // Map marketing ideas to unified format
        marketingIdeas.forEach(idea => {
          const savedItem = savedItems.find(item => 
            item.item_type === 'marketing' && item.item_id === idea.id
          );
          
          unifiedItems.push({
            id: idea.id,
            item_type: 'marketing',
            title: idea.marketing_idea_name || (idea.reddit_posts as any)?.reddit_title || 'Untitled Marketing Idea',
            summary: idea.full_analysis?.substring(0, 200) + '...' || 'No description available',
            category: idea.category || 'Marketing',
            saved_at: savedItem?.created_at
          });
        });
      }
    }

    // Sort by saved_at (most recent first)
    unifiedItems.sort((a, b) => 
      new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
    );

    console.log(`✅ Retrieved ${unifiedItems.length} saved items for user ${user_id}`);

    return NextResponse.json({
      success: true,
      saved_items: unifiedItems
    });

  } catch (error) {
    console.error('❌ Error in saved items API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, item_id, item_type, action } = body;

    console.log('🔖 Bookmark request:', { user_id, item_id, item_type, action });

    if (!user_id || !item_id || !item_type || !action) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: user_id, item_id, item_type, action'
      }, { status: 400 });
    }

    if (action === 'save') {
      // Check if already saved
      const { data: existingItem, error: checkError } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user_id)
        .eq('item_id', item_id)
        .eq('item_type', item_type)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing bookmark:', checkError);
        return NextResponse.json({
          success: false,
          message: 'Error checking bookmark status'
        }, { status: 500 });
      }

      if (existingItem) {
        return NextResponse.json({
          success: false,
          message: 'Item already saved'
        }, { status: 400 });
      }

      // Save the bookmark
      const { data: savedItem, error: saveError } = await supabase
        .from('saved_items')
        .insert({
          user_id,
          item_id,
          item_type
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving bookmark:', saveError);
        return NextResponse.json({
          success: false,
          message: 'Failed to save bookmark'
        }, { status: 500 });
      }

      console.log('✅ Bookmark saved:', savedItem);
      return NextResponse.json({
        success: true,
        action: 'saved',
        message: 'Bookmark saved successfully'
      });

    } else if (action === 'remove') {
      // Remove the bookmark
      const { error: deleteError } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user_id)
        .eq('item_id', item_id)
        .eq('item_type', item_type);

      if (deleteError) {
        console.error('Error removing bookmark:', deleteError);
        return NextResponse.json({
          success: false,
          message: 'Failed to remove bookmark'
        }, { status: 500 });
      }

      console.log('✅ Bookmark removed');
      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'Bookmark removed successfully'
      });

    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Use "save" or "remove"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in bookmark API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
