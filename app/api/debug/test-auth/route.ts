import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Testing authentication system...');
    
    // Test Supabase connection
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('📊 Supabase connection test:', {
      success: !connectionError,
      error: connectionError?.message || 'none'
    });
    
    // Check if demo account exists in profiles table
    const { data: demoProfile, error: demoError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', 'demo@goldmines.com')
      .single();
    
    console.log('👤 Demo profile check:', {
      exists: !!demoProfile,
      error: demoError?.message || 'none',
      profile: demoProfile || null
    });
    
    // Test auth system by trying to get users (this might not work with service role)
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    console.log('🔐 Auth system test:', {
      success: !authError,
      error: authError?.message || 'none',
      user_count: authUsers?.users?.length || 0
    });
    
    return NextResponse.json({
      success: true,
      message: 'Authentication system test completed',
      results: {
        supabase_connection: {
          success: !connectionError,
          error: connectionError?.message || 'none'
        },
        demo_profile: {
          exists: !!demoProfile,
          error: demoError?.message || 'none',
          profile: demoProfile || null
        },
        auth_system: {
          success: !authError,
          error: authError?.message || 'none',
          user_count: authUsers?.users?.length || 0,
          demo_user_exists: authUsers?.users?.some(user => user.email === 'demo@goldmines.com') || false
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing authentication',
      error: String(error)
    }, { status: 500 });
  }
}
