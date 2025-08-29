'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Authentication Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AuthGuard: Checking authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthGuard: Error checking session:', error);
          setIsAuthenticated(false);
        } else if (session?.user) {
          console.log('✅ AuthGuard: User authenticated, redirecting to dashboard');
          setIsAuthenticated(true);
          router.push('/dashboard');
        } else {
          console.log('❌ AuthGuard: No session, showing login form');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('💥 AuthGuard: Exception during auth check:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null;
  }

  // If authenticated, don't render children (will redirect)
  if (isAuthenticated === true) {
    return null;
  }

  // If not authenticated, show login form
  return <>{children}</>;
}

// Login Form Component
function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔐 Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        setMessage('Invalid email or password. Please check your credentials.');
      } else if (data.user) {
        console.log('✅ Login successful:', data.user);
        setMessage('Login successful! Redirecting...');
        
        // Wait for auth state to update, then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-normal text-lg">G</span>
            </div>
            <span className="text-2xl font-normal text-white">goldmines</span>
          </div>
          <h2 className="text-2xl font-normal text-white mb-2">Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition-colors disabled:opacity-50"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition-colors disabled:opacity-50"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-white/20 text-emerald-500 focus:ring-emerald-500 bg-white/10" />
              <span className="ml-2 text-sm text-gray-300">Remember me</span>
            </label>
            <Link 
              href="/forgot-password"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/25"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('successful') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-300 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main Login Page Component
export default function LoginPage() {
  return (
    <AuthGuard>
      <LoginForm />
    </AuthGuard>
  );
}
