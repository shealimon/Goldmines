import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${requestUrl.origin}/signup?error=verification_failed`);
      }
      
      if (data.session) {
        console.log('Email verification successful, user logged in');
        // Redirect to dashboard or home page
        return NextResponse.redirect(`${requestUrl.origin}/?verified=true`);
      }
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      return NextResponse.redirect(`${requestUrl.origin}/signup?error=verification_failed`);
    }
  }

  // If no code or error, redirect to home
  return NextResponse.redirect(requestUrl.origin);
}
