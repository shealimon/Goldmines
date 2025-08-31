'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, CheckCircle, ArrowRight } from 'lucide-react';
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
          console.log('❌ AuthGuard: No session, showing signup form');
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

  // If not authenticated, show signup form
  return <>{children}</>;
}

// Signup Form Component
function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'main' | 'verification'>('main');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('=== SIGNUP DEBUG START ===');
      console.log('Form data:', formData);
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.display_name
          }
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('User created successfully:', data.user);
        console.log('User metadata:', data.user.user_metadata);
        
        if (data.session) {
          // User is logged in immediately
          console.log('User logged in automatically');
          setMessage('Account created and logged in successfully!');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          // User created but not logged in - email confirmation required
          console.log('User created, email confirmation required');
          setMessage('Account created! Please check your email for verification link. Check spam folder if not in inbox.');
          setStep('verification');
        }
      } else {
        throw new Error('No user data returned from signup');
      }
    } catch (error: unknown) {
      console.error('=== SIGNUP ERROR ===');
      console.error('Error details:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      console.log('=== SIGNUP DEBUG END ===');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resendVerificationEmail = async () => {
    setLoading(true);
    try {
      console.log('Resending verification email to:', formData.email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }
      
      setMessage('Verification email sent again! Check your spam folder if not in inbox.');
    } catch (error: unknown) {
      console.error('Resend error:', error);
      setMessage(`Error resending email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Verification Step
  if (step === 'verification') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We've sent a verification link to <strong className="text-gray-900">{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Click the link in your email to verify your account and start using Goldmines.
              <br />
              <strong className="text-yellow-600">Check your spam folder if you don't see the email!</strong>
            </p>
            
            <button
              onClick={resendVerificationEmail}
              disabled={loading}
              className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mb-6"
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </button>
            
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main Signup Step
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Sign up</h2>
          <p className="text-sm text-gray-600">
            Already have an account? <Link href="/login" className="font-semibold text-indigo-600">Sign in</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-900">Display Name</label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your display name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 mt-1 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Create a password (min. 8 characters)"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Password must be at least 8 characters long</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`text-sm text-center p-3 rounded-lg ${
            message.includes('successful') || message.includes('created')
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
          Sign up with Google
        </button>
      </div>
    </div>
  );
}

// Main Signup Page Component
export default function SignupPage() {
  return (
    <AuthGuard>
      <SignupForm />
    </AuthGuard>
  );
}