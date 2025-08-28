// Local authentication client - replaces Supabase
import { initializeWithDemoData } from './local-auth';

// Initialize demo data on first load
if (typeof window === 'undefined') {
  initializeWithDemoData();
}

// Mock Supabase-like client for backward compatibility during migration
export const supabase = {
  auth: {
    getSession: async () => {
      if (typeof window === 'undefined') {
        return { data: { session: null }, error: null };
      }
      
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');
      
      if (token && user) {
        return {
          data: {
            session: {
              user: JSON.parse(user),
              access_token: token
            }
          },
          error: null
        };
      }
      
      return { data: { session: null }, error: null };
    },
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock auth state change listener
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },
    
    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      return { error: null };
    }
  },
  
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: { code: 'PGRST116' } })
      })
    })
  })
};