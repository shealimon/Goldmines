'use client';

import { Inter } from 'next/font/google';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { ArrowRight, Sparkles, TrendingUp, Target, Users, Zap, CheckCircle, Star, Globe, FileText, Lightbulb, BarChart3, BookOpen, Home, Megaphone, Bookmark, User, Search, Bell, ChevronDown, Crown, LogOut, RefreshCw, Settings, HelpCircle, CreditCard, BarChart, PieChart, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-inter',
});

// Animated Text Component
function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const words = [
    { text: 'Business', color: 'from-blue-600 to-purple-600' },
    { text: 'Marketing', color: 'from-purple-600 to-pink-600' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsVisible(true);
        setIsAnimating(false);
      }, 300);
    }, 2000); // Changed from 3500ms to 2000ms for more frequent changes

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className="relative inline">
      <span
        className={`inline transition-all duration-400 ease-in-out ${
          isVisible 
            ? 'opacity-100 transform translate-x-0' 
            : 'opacity-0 transform translate-x-8'
        } ${isAnimating ? 'animate-pulse' : ''}`}
        style={{
          animation: isVisible ? 'slideInFromLeft 0.4s ease-out' : 'slideOutToRight 0.3s ease-in'
        }}
      >
        <span 
          className={`bg-gradient-to-r ${words[currentIndex].color} bg-clip-text text-transparent font-extrabold tracking-tight transition-all duration-400`}
          style={{
            backgroundSize: '200% 200%',
            animation: isVisible ? 'gradient-shift 2s ease-in-out infinite' : 'none'
          }}
        >
          {words[currentIndex].text}
        </span>
      </span>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes slideInFromLeft {
          0% { 
            opacity: 0; 
            transform: translate-x-8; 
          }
          100% { 
            opacity: 1; 
            transform: translate-x-0; 
          }
        }
        
        @keyframes slideOutToRight {
          0% { 
            opacity: 1; 
            transform: translate-x-0; 
          }
          100% { 
            opacity: 0; 
            transform: translate-x-8; 
          }
        }
      `}</style>
    </span>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Logo */}
            <button 
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="text-xl lg:text-2xl font-bold">
                <span className="text-purple-600">GOLD</span>
                <span className="text-gray-900">MINES</span>
              </span>
            </button>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link href="#features" className="text-gray-800 hover:text-purple-600 transition-all duration-200 font-semibold text-sm lg:text-base px-3 lg:px-4 py-2 rounded-lg hover:bg-purple-50 flex items-center space-x-1 relative group">
                <span>Product</span>
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-purple-600 transform scale-x-0 transition-transform duration-200 group-hover:scale-x-100"></span>
              </Link>
              <Link href="#pricing" className="text-gray-800 hover:text-purple-600 transition-all duration-200 font-semibold text-sm lg:text-base px-3 lg:px-4 py-2 rounded-lg hover:bg-purple-50 relative group">
                Pricing
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-purple-600 transform scale-x-0 transition-transform duration-200 group-hover:scale-x-100"></span>
              </Link>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/login" className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm lg:text-base px-4 py-2 rounded-lg hover:bg-gray-50">
                Log in
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium text-sm lg:text-base shadow-sm hover:shadow-md">
                Get Started
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
              <div className="px-4 py-6 space-y-1">
                <Link href="#features" className="block text-gray-800 hover:text-purple-600 transition-all duration-200 font-semibold text-base py-3 px-3 rounded-lg hover:bg-purple-50 relative group">
                  Product
                  <span className="absolute left-3 right-3 bottom-1 h-0.5 bg-purple-600 transform scale-x-0 transition-transform duration-200 group-hover:scale-x-100"></span>
                </Link>
                <Link href="#pricing" className="block text-gray-800 hover:text-purple-600 transition-all duration-200 font-semibold text-base py-3 px-3 rounded-lg hover:bg-purple-50 relative group">
                  Pricing
                  <span className="absolute left-3 right-3 bottom-1 h-0.5 bg-purple-600 transform scale-x-0 transition-transform duration-200 group-hover:scale-x-100"></span>
                </Link>
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                  <Link href="/login" className="block text-gray-700 hover:text-gray-900 transition-colors font-medium text-base py-3 px-3 rounded-lg hover:bg-gray-50 text-center">
                    Log in
                  </Link>
                  <Link href="/signup" className="block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium text-base text-center shadow-sm">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-white pt-56 pb-16 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full opacity-30 blur-2xl"></div>
        </div>
        <div className="max-w-6xl mx-auto px-6 text-center">
                  {/* Headline */}
        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight text-gray-900">
          Generate <AnimatedText /> Ideas <br /> AI-Powered Intelligence
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered business ideas, marketing strategies, and case studies designed 
          to fuel your next big move. Stop guessing, start building smarter.
        </p>

          {/* CTA Buttons */}
          <div className="mt-16 flex justify-center relative z-20">
                      <Link
                        href="/signup"
                        className="px-6 py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:opacity-90 transition cursor-pointer"
                        onClick={() => {
                          console.log('Button clicked!');
                          window.location.href = '/signup';
                        }}
                      >
                        Start Free
            </Link>
                    </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="pt-0 pb-8 lg:pt-2 lg:pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Preview Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
            {/* App Header */}
            <div className="bg-gray-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl sm:text-2xl font-bold">
                    <span className="text-purple-600">GOLD</span>
                    <span className="text-gray-900">MINES</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar - Mobile: Horizontal scrollable */}
              <div className="w-full lg:w-64 bg-gray-50 p-3 sm:p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col lg:flex-col">
                {/* Navigation Menu */}
                <div className="flex-1">
                  {/* Mobile: Horizontal scrollable navigation */}
                  <div className="lg:hidden overflow-x-auto pb-2">
                    <div className="flex space-x-2 min-w-max">
                      <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer p-2 rounded-xl hover:bg-white transition-all duration-200 whitespace-nowrap">
                        <div className="w-5 h-5 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Home className="w-3 h-3 text-gray-600" />
                      </div>
                        <span className="text-xs font-medium">Dashboard</span>
                    </div>
                      <div className="flex items-center space-x-2 text-purple-600 bg-purple-50 border border-purple-200 cursor-pointer p-2 rounded-xl transition-all duration-200 whitespace-nowrap">
                        <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Lightbulb className="w-3 h-3 text-purple-600" />
                      </div>
                        <span className="text-xs font-medium">Business Ideas</span>
                    </div>
                      <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer p-2 rounded-xl hover:bg-white transition-all duration-200 whitespace-nowrap">
                        <div className="w-5 h-5 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Megaphone className="w-3 h-3 text-gray-600" />
                      </div>
                        <span className="text-xs font-medium">Marketing</span>
                    </div>
                      <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer p-2 rounded-xl hover:bg-white transition-all duration-200 whitespace-nowrap">
                        <div className="w-5 h-5 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="w-3 h-3 text-gray-600" />
                      </div>
                        <span className="text-xs font-medium">Case Studies</span>
                    </div>
                      <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer p-2 rounded-xl hover:bg-white transition-all duration-200 whitespace-nowrap">
                        <div className="w-5 h-5 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Bookmark className="w-3 h-3 text-gray-600" />
                      </div>
                        <span className="text-xs font-medium">Saved</span>
                    </div>
                      <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer p-2 rounded-xl hover:bg-white transition-all duration-200 whitespace-nowrap">
                        <div className="w-5 h-5 bg-gray-200 rounded-lg flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                      </div>
                        <span className="text-xs font-medium">Account</span>
                    </div>
                  </div>
                </div>

                  {/* Desktop: Vertical navigation */}
                  <div className="hidden lg:block space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 cursor-pointer p-3 rounded-xl hover:bg-white transition-all duration-200">
                      <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Home className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3 text-purple-600 bg-purple-50 border border-purple-200 cursor-pointer p-3 rounded-xl transition-all duration-200">
                      <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium">Business Ideas</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 cursor-pointer p-3 rounded-xl hover:bg-white transition-all duration-200">
                      <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Megaphone className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">Marketing Ideas</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 cursor-pointer p-3 rounded-xl hover:bg-white transition-all duration-200">
                      <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">Case Studies</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 cursor-pointer p-3 rounded-xl hover:bg-white transition-all duration-200">
                      <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Bookmark className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">Saved Ideas</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 cursor-pointer p-3 rounded-xl hover:bg-white transition-all duration-200">
                      <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">Account</span>
                    </div>
                  </div>
                </div>

                {/* User Profile Section - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:block border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white transition-all duration-200 cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      JD
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">John Doe</div>
                      <div className="text-xs text-gray-500 truncate">Free Plan</div>
                    </div>
                  </div>
                </div>

                {/* Upgrade CTA - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:block border-t border-gray-200 pt-4 mt-4">
                  <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm">Upgrade to Pro</span>
                  </button>
                </div>
              </div>
              
              {/* Main Content - Business Ideas Table */}
              <div className="flex-1 bg-white flex flex-col">
                {/* Top Header Bar */}
                <div className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    {/* Top Row: Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search ideas..." 
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    
                    {/* Bottom Row: Actions */}
                    <div className="flex items-center justify-between">
                      <button className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Generate</span>
                    </button>
                    
                      <div className="flex items-center space-x-3">
                        {/* Notifications */}
                        <div className="relative">
                          <Bell className="w-5 h-5 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors" />
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                        </div>
                        
                        {/* User Profile */}
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          JD
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex items-center justify-between">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Search ideas, strategies, case studies..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                  </div>

                  {/* Right side: Actions, Notifications & User Profile */}
                  <div className="flex items-center space-x-4">
                    {/* Generate New Ideas Button */}
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Generate</span>
                    </button>
                    
                    {/* Notifications */}
                    <div className="relative">
                      <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                    </div>
                    
                    {/* User Profile Dropdown */}
                    <div className="relative">
                      <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          JD
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-3 sm:p-4 lg:p-8">
                  {/* Page Header */}
                  <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6">
                      <div className="mb-4 lg:mb-0">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Business Ideas</h1>
                        <p className="text-sm sm:text-base text-gray-600">Discover and manage AI-generated business opportunities</p>
                      </div>
                      
                      {/* Action Buttons - Mobile: Stack vertically, Desktop: Horizontal */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:mt-0">
                        <button className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 font-medium transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          <span className="text-sm">Filter</span>
                        </button>
                        <button className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 font-medium transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          <span className="text-sm">Sort</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate">Today's Ideas</h3>
                          <div className="flex items-center mt-1 sm:mt-2">
                            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">12</span>
                            <span className="text-xs sm:text-sm font-semibold text-green-600 flex items-center ml-1 sm:ml-2">
                              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              +3
                            </span>
                          </div>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Ideas</h3>
                          <div className="flex items-center mt-1 sm:mt-2">
                            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">1,247</span>
                            <span className="text-xs sm:text-sm font-semibold text-blue-600 flex items-center ml-1 sm:ml-2">
                              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              +47
                            </span>
                          </div>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate">Saved Ideas</h3>
                          <div className="flex items-center mt-1 sm:mt-2">
                            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">89</span>
                            <span className="text-xs sm:text-sm font-semibold text-purple-600 flex items-center ml-1 sm:ml-2">
                              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              +12
                            </span>
                          </div>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate">Case Studies</h3>
                          <div className="flex items-center mt-1 sm:mt-2">
                            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">23</span>
                            <span className="text-xs sm:text-sm font-semibold text-orange-600 flex items-center ml-1 sm:ml-2">
                              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              +2
                            </span>
                          </div>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                
                {/* Data Table */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Table Header - Hidden on mobile */}
                  <div className="hidden sm:block px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-5">Ideas</div>
                      <div className="col-span-2">Category</div>
                      <div className="col-span-2">Market Size</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-1">Save</div>
                    </div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y divide-gray-100">
                    {/* Row 1 */}
                    <div className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              AI-powered meal planning app for busy professionals
                            </div>
                          </div>
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Bookmark business idea"
                            title="Bookmark business idea"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                              SaaS
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-700 border-green-200">
                              $2.1B
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date().toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            AI-powered meal planning app for busy professionals
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                              SaaS
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-700 border-green-200">
                              $2.1B
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="col-span-1">
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Bookmark business idea"
                            title="Bookmark business idea"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Row 2 */}
                    <div className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              On-demand tutoring platform with AI matching
                            </div>
                          </div>
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Remove bookmark"
                            title="Remove bookmark"
                          >
                            <svg className="w-4 h-4 text-purple-600 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                              EdTech
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-yellow-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">
                              $500M
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            On-demand tutoring platform with AI matching
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                              EdTech
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-yellow-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">
                              $500M
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-gray-500">{new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="col-span-1">
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Remove bookmark"
                            title="Remove bookmark"
                          >
                            <svg className="w-4 h-4 text-purple-600 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Row 3 */}
                    <div className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              Sustainable packaging marketplace for e-commerce
                            </div>
                          </div>
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Bookmark business idea"
                            title="Bookmark business idea"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-green-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-700 border-green-200">
                              GreenTech
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                              $150M
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            Sustainable packaging marketplace for e-commerce
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-green-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-700 border-green-200">
                              GreenTech
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                              $150M
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-gray-500">{new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="col-span-1">
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Bookmark business idea"
                            title="Bookmark business idea"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Row 4 */}
                    <div className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              Mental health chatbot for remote workers
                            </div>
                          </div>
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Bookmark business idea"
                            title="Bookmark business idea"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-red-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
                              HealthTech
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-700 border-green-200">
                              $800M
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            Mental health chatbot for remote workers
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-red-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
                              HealthTech
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-700 border-green-200">
                              $800M
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-gray-500">{new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="col-span-1">
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Bookmark business idea"
                            title="Bookmark business idea"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Table Footer */}
                  <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                      <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                        Showing 4 of 1,247 business ideas
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          Previous
                        </button>
                        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-purple-600 text-white rounded-lg">
                          1
                        </button>
                        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          2
                        </button>
                        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          3
                        </button>
                        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">How Goldmines Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI analyzes thousands of Reddit discussions to identify trending business opportunities in just 3 simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. AI Scans Reddit</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI continuously monitors Reddit communities, identifying posts with high engagement and unmet needs.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <Target className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Validates Opportunities</h3>
              <p className="text-gray-600 leading-relaxed">
                Each opportunity is analyzed for market size, competition, and feasibility to ensure high success potential.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Delivers Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Get detailed reports with market analysis, competitor research, and actionable next steps for your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to identify, validate, and launch your next successful business idea.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Market Intelligence</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time market analysis with competitor research, pricing insights, and growth projections.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Community Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Deep dive into Reddit communities to understand user pain points and unmet needs.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Idea Generator</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered idea generation based on trending topics and market gaps.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Reports</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive business plans with market analysis, financial projections, and launch strategies.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Global Coverage</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor markets worldwide to discover opportunities in emerging economies and untapped regions.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Success Stories</h3>
              <p className="text-gray-600 leading-relaxed">
                Learn from entrepreneurs who've successfully launched businesses using our platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo/Preview Cards */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">See Goldmines in Action</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore real examples of business opportunities discovered by our AI platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-white" />
                </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Business Idea</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                AI-powered meal planning app for busy professionals with dietary restrictions.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600 font-medium">Market Size: $2.1B</span>
                <span className="text-gray-500">Trending ↑</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Marketing Idea</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                TikTok marketing agency specializing in viral content for local businesses.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-600 font-medium">Demand: High</span>
                <span className="text-gray-500">Growing ↑</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-white" />
                </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Case Study</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                How a fitness app reached 100K users in 6 months using Reddit insights.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">Revenue: $50K MRR</span>
                <span className="text-gray-500">Success ✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Pricing & Plans</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan to start generating winning business ideas and strategies.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                </div>
                <p className="text-gray-600 text-sm">Perfect for getting started</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">20 business ideas/day</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">10 marketing strategies/day</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">1 case study/day</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Basic access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Community support</span>
                </div>
              </div>
              
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                Get Started Free
              </button>
            </div>
            
            {/* Pro Plan - Most Popular */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-purple-200 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$20</span>
                  <span className="text-gray-600 ml-2">per user/month</span>
                </div>
                <p className="text-gray-600 text-sm">Billed yearly</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Everything in Free</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Unlimited ideas & case studies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">AI-enhanced insights</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Save & organize ideas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Priority support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Export & download reports</span>
                </div>
              </div>
              
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Start Pro Plan
              </button>
            </div>
            
            {/* Lifetime Plan */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Lifetime</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$349</span>
                  <span className="text-gray-600 ml-2">one-time</span>
                </div>
                <p className="text-gray-600 text-sm">Best value for long-term</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">All yearly features</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Lifetime access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Early feature access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">VIP support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Custom integrations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">White-label options</span>
                </div>
              </div>
              
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Get Lifetime Access
              </button>
            </div>
          </div>
          
          {/* Money-back Guarantee */}
          <div className="text-center mt-12">
            <p className="text-gray-600 text-sm">
              <span className="font-semibold">14-Day Money-Back Guarantee</span> • Cancel anytime • No questions asked
            </p>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-6">Ready to Discover Your Next Business Idea?</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of entrepreneurs who've already found their million-dollar ideas with Goldmines.
          </p>
          <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-200 font-semibold text-lg inline-flex items-center space-x-2 group">
            <span>Start Your Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-white text-gray-900 py-12 lg:py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-8">
            {/* Brand/Logo */}
            <div className="text-center">
              <span className="text-4xl lg:text-6xl font-black tracking-tight">
                <span className="text-purple-600">GOLD</span>
                <span className="text-gray-900">MINES</span>
              </span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex flex-col items-center space-y-4">
              <Link href="/about" className="text-lg text-gray-600 hover:text-gray-900 transition-colors font-medium">
                About
              </Link>
              <Link href="#features" className="text-lg text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Features
              </Link>
              <Link href="#demo" className="text-lg text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Works
              </Link>
              <Link href="/help" className="text-lg text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Support
              </Link>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex items-center justify-center space-x-6">
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            {/* Brand/Logo */}
            <div className="flex items-center space-x-3">
              <span className="text-6xl font-black tracking-tight">
                <span className="text-purple-600">GOLD</span>
                <span className="text-gray-900">MINES</span>
              </span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              <Link href="/about" className="text-xl text-gray-600 hover:text-gray-900 transition-colors font-medium">
                About
              </Link>
              <Link href="#features" className="text-xl text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Features
              </Link>
              <Link href="#demo" className="text-xl text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Works
              </Link>
              <Link href="/help" className="text-xl text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Support
              </Link>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex items-center space-x-6">
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

