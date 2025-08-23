'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  role: 'trial' | 'pro' | 'ultimate'; // Updated to match your database
  trial_started_at: string;
  trial_expires_at: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  isSubscriptionActive: () => boolean;
  canGenerateIdea: () => Promise<boolean>;
  incrementUsage: () => Promise<void>;
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
          console.log(' Profile not found, creating new one...');
          await createUserProfile(userId);
        }
      } else {
        console.log('✅ Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (error: unknown) {
      console.error(' Exception in fetchUserProfile:', {
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('👤 User data for profile creation:', {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        });
        
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            email: user.email,
            display_name: user.user_metadata?.display_name || 'User',
            role: 'trial'
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('❌ Error creating profile:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          console.log('✅ Profile created successfully');
          await fetchUserProfile(userId);
        }
      }
    } catch (error: unknown) {
      console.error('💥 Exception in createUserProfile:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
    }
  };

  useEffect(() => {
    console.log('🚀 UserProvider useEffect running...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(' Initial session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });
      
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('👤 User found in session, fetching profile...');
        fetchUserProfile(session.user.id);
      } else {
        console.log('❌ No user in session');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      console.log(' Refreshing profile for user:', user.id);
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
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      
      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const isSubscriptionActive = () => {
    if (!profile) return false;
    
    if (profile.role === 'ultimate') return true;
    if (profile.role === 'pro') return true;
    
    // For trial users, check if trial hasn't expired
    if (profile.role === 'trial') {
      return new Date(profile.trial_expires_at) > new Date();
    }
    
    return false;
  };

  const canGenerateIdea = async () => {
    if (!profile) return false;
    
    if (profile.role === 'ultimate') return true;
    if (profile.role === 'pro') return true;
    
    // Trial users can generate ideas during trial period
    return isSubscriptionActive();
  };

  const incrementUsage = async () => {
    console.log('Idea generated - usage tracked');
  };

  const getUsagePercentage = () => {
    if (!profile || profile.role !== 'trial') return 0;
    
    const now = new Date();
    const trialStart = new Date(profile.trial_expires_at);
    const trialEnd = new Date(profile.trial_expires_at);
    
    const totalTrialTime = trialEnd.getTime() - trialStart.getTime();
    const elapsedTime = now.getTime() - trialStart.getTime();
    
    return Math.min((elapsedTime / totalTrialTime) * 100, 100);
  };

  return (
    <UserContext.Provider value={{
      user,
      profile,
      loading,
      refreshProfile,
      updateProfile,
      signOut,
      isSubscriptionActive,
      canGenerateIdea,
      incrementUsage,
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
