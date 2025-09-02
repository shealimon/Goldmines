import { createClient } from '@supabase/supabase-js'

// Use environment variables with fallbacks for build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://duzyicfcmuhbwypdtelz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1enlpY2ZjbXVoYnd5cGR0ZWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDcyMzgsImV4cCI6MjA3MTUyMzIzOH0.DEupJkwdD-q2OqE5nu33ZK0dAHLKIV3wZazibTc6xf8'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1enlpY2ZjbXVoYnd5cGR0ZWx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk0NzIzOCwiZXhwIjoyMDcxNTIzMjM4fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

// Only log and test connection if not in build mode
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
  console.log('Creating Supabase client with:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...' })
}

// Client-side Supabase client (uses anonymous key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Server-side Supabase client (uses service role key - bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Only test connection if not in build mode
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
  supabase.auth.getSession().then(({ error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error)
    } else {
      console.log('Supabase connection test successful')
    }
  })
}