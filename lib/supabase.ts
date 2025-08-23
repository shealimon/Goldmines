import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://duzyicfcmuhbwypdtelz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1enlpY2ZjbXVoYnd5cGR0ZWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDcyMzgsImV4cCI6MjA3MTUyMzIzOH0.DEupJkwdD-q2OqE5nu33ZK0dAHLKIV3wZazibTc6xf8'

console.log('Creating Supabase client with:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...' })

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Test the connection
supabase.auth.getSession().then(({ error }) => {
  if (error) {
    console.error('Supabase connection test failed:', error)
  } else {
    console.log('Supabase connection test successful')
  }
})
