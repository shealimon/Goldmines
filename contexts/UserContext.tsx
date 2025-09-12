'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface UserProfile {
  user_id: string;
  name: string | null;
  display_name?: string;
  avatar_url: string | null;
  api_credits: number;
  plan_type: string;
  credits_used_today: number;
  last_credit_reset: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingOut: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  getUsagePercentage: () => number;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
        }
      } else {
        setProfile(data);
      }
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      console.log('🆕 Creating profile for user:', userId);
      
      const defaultProfile = {
        user_id: userId,
        name: null,
        display_name: null,
        avatar_url: null,
        api_credits: 1000,
        plan_type: 'free',
        credits_used_today: 0,
        last_credit_reset: new Date().toISOString().split('T')[0],
        subscription_status: null,
        subscription_plan: null
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        throw error;
      } else {
        console.log('✅ Profile created successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('🔥 Exception creating profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fetch profile in background without blocking
          fetchUserProfile(session.user.id).catch(console.error);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fetch profile in background
          fetchUserProfile(session.user.id).catch(console.error);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing profile for user:', user.id);
      await fetchUserProfile(user.id);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (signingOut) {
      console.log('🚪 Sign out already in progress, skipping...');
      return;
    }
    
    try {
      console.log('🚪 Starting sign out process...');
      setSigningOut(true);
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      
      // Clear local storage immediately
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('✅ Local storage cleared');
        } catch (storageError) {
          console.error('❌ Error clearing storage:', storageError);
          // Continue with signout even if storage clear fails
        }
      }
      
      // Try to sign out from Supabase (with timeout)
      try {
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign out timeout')), 3000)
        );
        
        const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('❌ Error signing out from Supabase:', error);
        } else {
          console.log('✅ Signed out successfully from Supabase');
        }
      } catch (signOutError) {
        console.error('❌ Sign out timeout or error:', signOutError);
        // Continue with redirect even if Supabase signout fails
      }
      
      console.log('✅ Sign out process completed, redirecting...');
      
      // Force redirect to login page using multiple methods
      if (typeof window !== 'undefined') {
        // Try multiple redirect methods
        try {
          // Use replace to avoid back button issues
          window.location.replace('/login');
        } catch (e) {
          try {
            // Fallback to href
            window.location.href = '/login';
          } catch (e2) {
            // Last resort: reload the page to login
            console.log('🔄 Last resort: reloading page');
            window.location.reload();
          }
        }
      }
      
    } catch (error) {
      console.error('🔥 Exception signing out:', error);
      
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        try {
          console.log('🔄 Error fallback: redirecting to login');
          window.location.replace('/login');
        } catch (e) {
          console.log('🔄 Error fallback: reloading page');
          window.location.reload();
        }
      }
    }
  };

  const getUsagePercentage = (): number => {
    if (!profile) return 0;
    return Math.round((profile.credits_used_today / profile.api_credits) * 100);
  };

  return (
    <UserContext.Provider value={{
      user,
      profile,
      loading,
      signingOut,
      signOut,
      refreshProfile,
      updateProfile,
      getUsagePercentage
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}