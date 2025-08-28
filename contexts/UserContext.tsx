'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  name: string | null;
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

  const fetchUserProfile = async (userId: string, token: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Profile fetched successfully:', data.profile);
          setProfile(data.profile);
        } else {
          console.error('❌ Error fetching profile:', data.message);
          // Create default profile if it doesn't exist
          await createUserProfile(userId, token);
        }
      } else {
        console.error('❌ HTTP error fetching profile:', response.status);
        await createUserProfile(userId, token);
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

  const createUserProfile = async (userId: string, token: string) => {
    try {
      console.log('🆕 Creating new profile for user:', userId);
      
      const defaultProfile = {
        name: null,
        avatar_url: null,
        api_credits: 1000,
        plan_type: 'free',
        credits_used_today: 0,
        last_credit_reset: new Date().toISOString().split('T')[0],
        subscription_status: null,
        subscription_plan: null
      };

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(defaultProfile)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Profile created successfully:', data.profile);
          setProfile(data.profile);
        }
      }
    } catch (error) {
      console.error('❌ Error creating profile:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 UserProvider useEffect running...');
    
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    // Check for stored auth data
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('📝 Found stored session:', {
          hasToken: !!token,
          userId: parsedUser?.id,
          email: parsedUser?.email
        });
        
        setUser(parsedUser);
        if (parsedUser) {
          console.log('👤 User found in storage, fetching profile...');
          fetchUserProfile(parsedUser.id, token);
        }
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    } else {
      console.log('❌ No stored session found');
    }
    
    setLoading(false);
  }, []);

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing profile for user:', user.id);
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetchUserProfile(user.id, token);
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found');

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      
      // Clear state
      setUser(null);
      setProfile(null);
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
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