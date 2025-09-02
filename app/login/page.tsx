'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Login Form Component
function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isPageReady, setIsPageReady] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Simple auth check on component mount with timeout
  useEffect(() => {
    let isMounted = true;
    let fallbackTimeout: NodeJS.Timeout;
    
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication status...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 3000)
        );
        
        const authPromise = supabase.auth.getSession();
        
        const { data: { session }, error } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        if (!isMounted) return;
        
        if (error) {
          console.error('❌ Auth check error:', error);
          return;
        }
        
        if (session?.user) {
          console.log('✅ User already authenticated, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('ℹ️ No active session found');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ Auth check failed:', error);
        // Don't redirect on error, just log it
      } finally {
        if (isMounted) {
          setIsPageReady(true);
        }
      }
    };
    
    // Set a fallback timeout to show the form even if auth check fails
    fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ Auth check timeout, showing login form');
        setIsPageReady(true);
      }
    }, 2000);
    
    checkAuth();
    
    return () => {
      isMounted = false;
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔐 Attempting login with:', { email: formData.email });
      console.log('🔐 Supabase client:', supabase);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      console.log('🔐 Login response:', { data, error });

      if (error) {
        console.error('❌ Login error:', error);
        setMessage(`Login failed: ${error.message}`);
      } else if (data.user) {
        console.log('✅ Login successful:', data.user);
        setMessage('Login successful! Redirecting...');
        
        // Wait for auth state to update, then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        console.log('❌ No user data returned');
        setMessage('Login failed: No user data returned');
      }
    } catch (error: unknown) {
      console.error('💥 Login exception:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Show loading state while checking auth
  if (!isPageReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow">
        {/* Back to Home Link */}
        <div className="flex justify-start">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
          <p className="text-sm text-gray-600">
            Don't have an account? <Link href="/signup" className="font-semibold text-indigo-600">Join now</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Email address"
              required
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
              <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 mt-1 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="remember" className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500" />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember me</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {message && (
          <div className={`text-sm text-center p-3 rounded-lg ${
            message.includes('successful') 
              ? 'text-green-600 bg-green-50 border border-green-200' 
              : 'text-red-600 bg-red-50 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="relative flex items-center justify-center">
          <span className="absolute bg-white px-2 text-gray-500 text-sm">or</span>
          <div className="w-full border-t border-gray-300"></div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

// Main Login Page Component
export default function LoginPage() {
  return <LoginForm />;
}
