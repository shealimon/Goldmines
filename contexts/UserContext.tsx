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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Supabase error fetching profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('🆕 Profile not found, creating new one...');
          await createUserProfile(userId);
        }
      } else {
        console.log('✅ Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (error: unknown) {
      console.error('🔥 Exception in fetchUserProfile:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
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
    console.log('🚀 UserProvider useEffect running...');
    
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('📝 Initial session:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        });
        
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('👤 User found in session, fetching profile...');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('❌ No user in session');
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
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
        
        console.log('🔄 Auth state change:', {
          event,
          userId: session?.user?.id,
          email: session?.user?.email
        });
        
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
      } else {
        console.log('✅ Signed out successfully');
      }
    } catch (error) {
      console.error('🔥 Exception signing out:', error);
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