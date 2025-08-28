'use client';

import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Signup successful:', data.user);
        setMessage('Account created successfully! Redirecting to login...');
        
        // Store auth data in localStorage for immediate login
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Redirect to dashboard after successful signup
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        console.error('Signup error:', data.message);
        setMessage(data.message || 'Failed to create account. Please try again.');
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
                placeholder="Enter your password (min 6 characters)"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters long</p>
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
        
        <div className="mt-6 p-3 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
          <p className="font-semibold mb-1">Demo Account Available:</p>
          <p>Email: demo@goldmines.com</p>
          <p>Password: demo123</p>
        </div>
      </div>
    </div>
  );
}