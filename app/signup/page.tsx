'use client';

import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
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
      
      // Test connection using existing client
      const { data: testData, error: testError } = await supabase.auth.getSession();
      console.log('Connection test:', { testData, testError });
      
      if (testError) {
        throw new Error(`Connection failed: ${testError.message}`);
      }
      
      console.log('Connection successful, proceeding with signup...');
      
      // Sign up with existing Supabase client
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
        
        // Now save to profiles table
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                user_id: data.user.id,
                email: formData.email,
                display_name: formData.display_name,
                role: 'trial',
                trial_started_at: new Date().toISOString(),
                trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
              }
            ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          } else {
            console.log('Profile created successfully:', profileData);
          }
        } catch (profileError: any) {
          console.error('Profile creation exception:', profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        
        if (data.session) {
          // User is logged in immediately
          console.log('User logged in automatically');
          setMessage('Account created and logged in successfully!');
          setTimeout(() => {
            window.location.href = '/dashboard';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Check Your Email</h3>
            <p className="text-gray-300 mb-6">
              We&apos;ve sent a verification link to <strong className="text-white">{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Click the link in your email to verify your account and start using Goldmines.
              <br />
              <strong>Check your spam folder if you don&apos;t see the email!</strong>
            </p>
            
            <button
              onClick={resendVerificationEmail}
              disabled={loading}
              className="px-6 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 mb-4"
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </button>
            
            <Link
              href="/"
              className="text-emerald-400 hover:text-emerald-300 flex items-center justify-center"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-black text-lg">G</span>
            </div>
            <span className="text-2xl font-black text-white">goldmines</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="Enter your display name"
                required
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="Enter your email"
                required
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
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="Enter your password"
                required
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/25"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('successful') || message.includes('created')
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/20 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Login
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
