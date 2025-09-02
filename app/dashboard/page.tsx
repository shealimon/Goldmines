'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/app/components/DataTable';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation'; // Added useRouter import
import { supabase } from '@/lib/supabase';
import { 
  Home,
  Lightbulb,
  Megaphone,
  BookOpen,
  Bookmark,
  User,
  Search,
  Bell,
  ChevronDown,
  TrendingUp,
  Users,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown,
  Crown,
  ExternalLink,
  RefreshCw,
  LogOut
} from 'lucide-react';

type TabType = 'dashboard' | 'business-ideas' | 'marketing-ideas' | 'case-studies' | 'saved-ideas' | 'account';

interface BusinessIdea {
  id: number;
  business_idea_name: string;
  reddit_title: string;
  reddit_author: string;
  reddit_subreddit: string;
  reddit_score: number;
  reddit_comments: number;
  opportunity_points: string[];
  problems_solved: string[];
  target_customers: string[];
  market_size: string[];
  niche: string;
  category: string;
  marketing_strategy: string[];
  full_analysis: string;
  created_at: string;
  reddit_created_utc: number; // Added for Reddit post date
  reddit_url: string; // Added for Reddit post URL
}

export default function Dashboard() {
  const { user, profile, signOut } = useUser();
  const router = useRouter(); // Added useRouter hook
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [businessIdeas, setBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    todayIdeas: 0,
    totalIdeas: 0,
    savedIdeas: 0,
    caseStudies: 0
  });
  const [yesterdayStats, setYesterdayStats] = useState({
    totalIdeas: 0,
    averageScore: 0,
    averageComments: 0,
    topSubreddits: [] as Array<{ subreddit: string; count: number }>,
    topCategories: [] as Array<{ category: string; count: number }>,
    topNiches: [] as Array<{ niche: string; count: number }>
  });
  const [recentIdeas, setRecentIdeas] = useState<BusinessIdea[]>([]);
  const [generatingIdea, setGeneratingIdea] = useState(false);
  const [bookmarkedIdeas, setBookmarkedIdeas] = useState<Set<number>>(new Set());
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false); // Add this flag
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Mobile menu state
  const [signingOut, setSigningOut] = useState(false); // Add signing out state

  const handleSignOut = async () => {
    console.log('🚪 Sign out button clicked');
    setSigningOut(true);
    
    try {
      console.log('🔄 Calling signOut function...');
      await signOut();
      console.log('✅ SignOut function completed');
    } catch (error) {
      console.error('❌ Error in handleSignOut:', error);
      
      // Fallback: clear storage and redirect
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Fallback: Storage cleared');
        
        // Force redirect
        window.location.href = '/login';
      } catch (fallbackError) {
        console.error('❌ Fallback redirect failed:', fallbackError);
        // Last resort: reload page
        window.location.reload();
      }
    } finally {
      // Don't set signingOut to false if we're redirecting
      console.log('🏁 handleSignOut completed');
    }
  };

  // Fetch dashboard data when component mounts or when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Fetch business ideas when the business ideas tab is active - only once
  useEffect(() => {
    if (activeTab === 'business-ideas' && !hasAttemptedFetch && !loading) {
      setHasAttemptedFetch(true);
      fetchBusinessIdeas();
    }
  }, [activeTab, hasAttemptedFetch, loading]);

  const fetchBusinessIdeas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/business-ideas');
      const data = await response.json();
      
      if (data.success) {
        setBusinessIdeas(data.business_ideas || []);
        console.log('✅ Business ideas fetched:', data.business_ideas?.length || 0);
      } else {
        setError(data.message || 'Failed to fetch business ideas');
        console.error('❌ API error:', data.message);
      }
    } catch (err) {
      setError('Failed to fetch business ideas');
      console.error('❌ Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch business ideas for stats
      const response = await fetch('/api/business-ideas');
      const data = await response.json();
      
      if (data.success) {
        const ideas = data.business_ideas || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayIdeas = ideas.filter((idea: BusinessIdea) => {
          const ideaDate = new Date(idea.created_at);
          ideaDate.setHours(0, 0, 0, 0);
          return ideaDate.getTime() === today.getTime();
        }).length;

        setDashboardStats({
          todayIdeas,
          totalIdeas: ideas.length,
          savedIdeas: Math.floor(ideas.length * 0.2), // 20% saved rate estimate
          caseStudies: Math.floor(ideas.length * 0.15) // 15% case studies estimate
        });

        // Get recent ideas for activity feed
        setRecentIdeas(ideas.slice(0, 3));
      }

      // Fetch yesterday's statistics
      const yesterdayResponse = await fetch('/api/business-ideas?stats=yesterday');
      const yesterdayData = await yesterdayResponse.json();
      
      if (yesterdayData.success) {
        setYesterdayStats(yesterdayData.statistics);
        console.log('📊 Yesterday\'s stats loaded:', yesterdayData.statistics);
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
    }
  };

  const handleBookmarkToggle = (id: number) => {
    setBookmarkedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleViewDetails = (item: any) => {
    // Find the business idea and show details modal
    const idea = businessIdeas.find(bi => bi.id === item.id);
    if (idea) {
      setSelectedIdea(idea);
      setShowIdeaModal(true);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      setBusinessIdeas(prev => prev.filter(idea => idea.id !== id));
      setBookmarkedIdeas(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Convert business ideas to DataTable format
  const tableData = businessIdeas.map(idea => ({
    id: idea.id,
    title: idea.business_idea_name || idea.reddit_title,
    niche: idea.niche || 'Not Specified',
    category: idea.category || 'General',
    market_size: idea.market_size || ['Unknown'],
    dateGenerated: idea.reddit_created_utc ? new Date(idea.reddit_created_utc * 1000).toISOString() : idea.created_at,
    isBookmarked: bookmarkedIdeas.has(idea.id),
    reddit_score: idea.reddit_score,
    reddit_comments: idea.reddit_comments
  }));

  const generateNewIdea = async () => {
    setGeneratingIdea(true);
    try {
      console.log('🚀 Starting to generate new business ideas...');
      
      // Call your existing API endpoint with the new action
      console.log('📡 Making API call to /api/business-ideas...');
      const response = await fetch('/api/business-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'fetch_and_analyze'
        }),
      });

      console.log('📡 API response status:', response.status);
      const data = await response.json();
      console.log('📡 API response data:', data);
      
      if (data.success) {
        // Refresh data
        await fetchBusinessIdeas();
        await fetchDashboardData();
        
        alert(`Successfully analyzed and saved ${data.count || 0} new business ideas!`);
      } else {
        alert(data.message || 'Failed to generate new business ideas');
      }
      
    } catch (err) {
      console.error('❌ Error generating ideas:', err);
      alert('Failed to generate new business ideas. Please try again.');
    } finally {
      setGeneratingIdea(false);
    }
  };

  // Real data for dashboard stats
  const stats = [
    {
      title: "Today's Ideas",
      value: dashboardStats.todayIdeas.toString(),
      change: dashboardStats.todayIdeas > 0 ? `+${dashboardStats.todayIdeas}` : "0",
      trend: dashboardStats.todayIdeas > 0 ? 'up' : 'neutral',
      color: dashboardStats.todayIdeas > 0 ? 'text-green-600' : 'text-gray-600',
      icon: TrendingUp
    },
    {
      title: "Total Ideas",
      value: dashboardStats.totalIdeas.toString(),
      change: dashboardStats.totalIdeas > 0 ? `+${dashboardStats.totalIdeas}` : "0",
      trend: dashboardStats.totalIdeas > 0 ? 'up' : 'neutral',
      color: dashboardStats.totalIdeas > 0 ? 'text-blue-600' : 'text-gray-600',
      icon: Lightbulb
    },
    {
      title: "Saved Ideas",
      value: dashboardStats.savedIdeas.toString(),
      change: dashboardStats.savedIdeas > 0 ? `+${dashboardStats.savedIdeas}` : "0",
      trend: dashboardStats.savedIdeas > 0 ? 'up' : 'neutral',
      color: dashboardStats.savedIdeas > 0 ? 'text-purple-600' : 'text-gray-600',
      icon: Bookmark
    },
    {
      title: "Case Studies",
      value: dashboardStats.caseStudies.toString(),
      change: dashboardStats.caseStudies > 0 ? `+${dashboardStats.caseStudies}` : "0",
      trend: dashboardStats.caseStudies > 0 ? 'up' : 'neutral',
      color: dashboardStats.caseStudies > 0 ? 'text-orange-600' : 'text-gray-600',
      icon: BookOpen
    }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, active: activeTab === 'dashboard' },
    { id: 'business-ideas', label: 'Business Ideas', icon: Lightbulb, active: activeTab === 'business-ideas' },
    { id: 'marketing-ideas', label: 'Marketing Ideas', icon: Megaphone, active: activeTab === 'marketing-ideas' },
    { id: 'case-studies', label: 'Case Studies', icon: BookOpen, active: activeTab === 'case-studies' },
    { id: 'saved-ideas', label: 'Saved Ideas', icon: Bookmark, active: activeTab === 'saved-ideas' },
    { id: 'account', label: 'Account', icon: User, active: activeTab === 'account' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Greeting */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hello, {(profile?.display_name || profile?.name || user?.email?.split('@')[0] || 'User')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')}!
            </h1>
              <p className="text-gray-600">Welcome to your GOLDMINES dashboard. Here's what's new.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                    <span className={`text-sm font-semibold flex items-center ${stat.color}`}>
                      {stat.trend === 'up' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ideas Generated Over Time</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                  Line Chart Placeholder
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Idea Types Distribution</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                  Pie Chart Placeholder
                </div>
              </div>
            </div>

            {/* Yesterday's Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yesterday's Performance</h3>
              {yesterdayStats.totalIdeas > 0 ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">{yesterdayStats.totalIdeas}</div>
                      <div className="text-sm text-purple-700">Ideas Processed</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{yesterdayStats.averageScore}</div>
                      <div className="text-sm text-blue-700">Avg Reddit Score</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{yesterdayStats.averageComments}</div>
                      <div className="text-sm text-green-700">Avg Comments</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">{yesterdayStats.topSubreddits.length}</div>
                      <div className="text-sm text-orange-700">Active Subreddits</div>
                    </div>
                  </div>

                  {/* Top Subreddits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Top Subreddits</h4>
                      <div className="space-y-2">
                        {yesterdayStats.topSubreddits.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">r/{item.subreddit}</span>
                            <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Top Categories</h4>
                      <div className="space-y-2">
                        {yesterdayStats.topCategories.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{item.category}</span>
                            <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Top Niches</h4>
                      <div className="space-y-2">
                        {yesterdayStats.topNiches.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{item.niche}</span>
                            <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No data from yesterday</p>
                  <p className="text-sm">Start processing Reddit posts to see statistics</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentIdeas.length > 0 ? (
                  recentIdeas.map((idea, index) => (
                    <div key={idea.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New business idea generated</p>
                        <p className="text-xs text-gray-500">{idea.business_idea_name || idea.reddit_title}</p>
                  </div>
                      <span className="text-xs text-gray-400">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </span>
                </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No recent activity yet</p>
                    <p className="text-sm">Start generating business ideas to see them here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

             case 'business-ideas':
         return (
           <div className="space-y-6">


            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading business ideas...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">Error Loading Ideas</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={fetchBusinessIdeas}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                >
                  Try Again
              </button>
            </div>
            )}

            {/* No Ideas State */}
            {!loading && !error && businessIdeas.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Business Ideas Yet</h2>
                <p className="text-gray-600 mb-4">Start generating business ideas to see them here.</p>
                <button 
                  onClick={generateNewIdea}
                  disabled={generatingIdea}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingIdea ? 'Generating...' : 'Generate Your First Idea'}
                </button>
              </div>
            )}

                        {/* Modern DataTable View */}
            {!loading && !error && businessIdeas.length > 0 && (
              <DataTable
                data={tableData}
                onBookmarkToggle={handleBookmarkToggle}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            )}
          </div>
        );

      case 'marketing-ideas':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Marketing Ideas</h1>
                <p className="text-gray-600">Creative marketing strategies and campaigns</p>
              </div>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                Generate Strategy
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Marketing Ideas Content</h2>
              <p className="text-gray-600">This is where your marketing ideas will be displayed.</p>
            </div>
          </div>
        );

      case 'case-studies':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Case Studies</h1>
                <p className="text-gray-600">Learn from successful business stories</p>
              </div>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                Explore Cases
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Studies Content</h2>
              <p className="text-gray-600">This is where your case studies will be displayed.</p>
            </div>
          </div>
        );

      case 'saved-ideas':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Saved Ideas</h1>
                <p className="text-gray-600">Your bookmarked ideas and strategies</p>
              </div>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                View All
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Ideas Content</h2>
              <p className="text-gray-600">This is where your saved ideas will be displayed.</p>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Settings Content</h2>
              <p className="text-gray-600">This is where your account settings will be displayed.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setShowMobileMenu(false)} />
      )}

      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 flex-1">
          {/* Logo and Close Button for Mobile */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-2xl font-bold">
              <span className="text-purple-600">GOLD</span>
              <span className="text-black">MINES</span>
            </span>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setShowMobileMenu(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setShowMobileMenu(false); // Close mobile menu when item is clicked
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium ${
                  item.active
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.active ? 'text-purple-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-gray-100">
        </div>

        {/* Upgrade to Pro CTA and Signout - Fixed at bottom */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-purple-700 hover:to-blue-700">
            <Crown className="w-5 h-5" />
            <span>Upgrade to Pro</span>
          </button>
          <button 
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:ml-64 flex-1 flex flex-col">
                 {/* Fixed Top Navbar */}
         <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between z-20 sticky top-0">
           {/* Mobile Menu Button and Search Bar */}
           <div className="flex items-center space-x-4 flex-1">
             {/* Mobile Menu Button */}
             <button 
               onClick={() => setShowMobileMenu(true)}
               className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
             >
               <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </button>
             
             {/* Search Bar */}
             <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input 
                 type="text" 
                 placeholder="Search ideas, strategies, case studies..." 
                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
               />
             </div>
           </div>

           {/* Right side: Reload Icon, Notifications & User Profile */}
           <div className="flex items-center space-x-4">
             {/* Reload Icon for Business Ideas */}
             {activeTab === 'business-ideas' && (
               <button 
                 onClick={generateNewIdea}
                 disabled={generatingIdea}
                 className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 title="Generate New Ideas"
               >
                 {generatingIdea ? (
                   <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                 ) : (
                   <RefreshCw className="w-5 h-5" />
                 )}
               </button>
             )}
             
             <div className="relative">
               <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors" />
               <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
             </div>
             
             {/* User Profile Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setShowUserDropdown(!showUserDropdown)}
                 className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
               >
                 <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                   {profile?.display_name?.charAt(0)?.toUpperCase() || 
                    profile?.name?.charAt(0)?.toUpperCase() || 
                    user?.email?.charAt(0)?.toUpperCase() || 
                    'U'}
                 </div>
                 <ChevronDown className="w-4 h-4 text-gray-600" />
               </button>
               
               {showUserDropdown && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-40 border border-gray-100">
                   <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors">
                     Profile
                   </button>
                   <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors">
                     Settings
                   </button>
                 </div>
               )}
             </div>
           </div>
         </header>

        {/* Dynamic Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Click outside to close dropdown */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserDropdown(false)}
        />
      )}

      {/* Business Idea Details Modal */}
      {showIdeaModal && selectedIdea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowIdeaModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
            {/* Clean Header */}
            <div className="bg-gray-900 rounded-t-2xl p-6 text-white relative">
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => setShowIdeaModal(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Business Idea Title */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                  {selectedIdea.business_idea_name || selectedIdea.reddit_title}
                </h1>
                {/* Removed author/subreddit/date row */}
              </div>
            </div>

            {/* Clean Content */}
            <div className="p-6 space-y-8">
				
				{/* Category & Niche Tags */}
				<div className="flex flex-wrap gap-3">
					{selectedIdea.category && (
						<div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
							<span className="w-2 h-2 bg-gray-500 rounded-full"></span>
							<span className="font-semibold text-sm">{selectedIdea.category}</span>
						</div>
					)}
					{selectedIdea.niche && (
						<div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
							<span className="w-2 h-2 bg-gray-500 rounded-full"></span>
							<span className="font-semibold text-sm">{selectedIdea.niche}</span>
						</div>
					)}
				</div>

				{/* Two Column Layout for Main Content */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Left Column */}
					<div className="space-y-6">
						{/* Key Opportunities */}
						{selectedIdea.opportunity_points && selectedIdea.opportunity_points.length > 0 && (
							<div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
								<div className="flex items-center space-x-2 mb-4">
									<span className="w-2 h-2 bg-gray-400 rounded-full"></span>
									<h3 className="text-lg font-bold text-gray-900">Key Opportunities</h3>
								</div>
								<div className="space-y-3">
									{selectedIdea.opportunity_points.map((point, index) => (
										<div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
											<span className="text-gray-700 font-bold mt-0.5">•</span>
											<span className="text-gray-700 text-sm leading-relaxed">{point}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Target Customers */}
						{selectedIdea.target_customers && selectedIdea.target_customers.length > 0 && (
							<div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
								<div className="flex items-center space-x-2 mb-4">
									<span className="w-2 h-2 bg-gray-400 rounded-full"></span>
									<h3 className="text-lg font-bold text-gray-900">Target Customers</h3>
								</div>
								<div className="flex flex-wrap gap-2">
									{selectedIdea.target_customers.map((customer, index) => (
										<span key={index} className="px-3 py-2 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 font-medium">
											{customer}
										</span>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Right Column */}
					<div className="space-y-6">
						{/* Problems Solved */}
						{selectedIdea.problems_solved && selectedIdea.problems_solved.length > 0 && (
							<div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
								<div className="flex items-center space-x-2 mb-4">
									<span className="w-2 h-2 bg-gray-400 rounded-full"></span>
									<h3 className="text-lg font-bold text-gray-900">Problems Solved</h3>
								</div>
								<div className="space-y-3">
									{selectedIdea.problems_solved.map((problem, index) => (
										<div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
											<span className="text-gray-700 font-bold mt-0.5">•</span>
											<span className="text-gray-700 text-sm leading-relaxed">{problem}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Market Size */}
						{selectedIdea.market_size && selectedIdea.market_size.length > 0 && (
							<div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
								<div className="flex items-center space-x-2 mb-4">
									<span className="w-2 h-2 bg-gray-400 rounded-full"></span>
									<h3 className="text-lg font-bold text-gray-900">Market Size</h3>
								</div>
								<div className="flex flex-wrap gap-2">
									{selectedIdea.market_size.map((size, index) => (
										<span key={index} className="px-3 py-2 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 font-medium">
											{size}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

              {/* Marketing Strategy - Full Width */}
              {selectedIdea.marketing_strategy && selectedIdea.marketing_strategy.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">📈</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Marketing Strategy</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedIdea.marketing_strategy.map((strategy, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-gray-700 font-bold mt-0.5">•</span>
                        <span className="text-gray-700 text-sm leading-relaxed">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

				{/* Reddit Stats Card (moved to bottom) */}
				<div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
					<h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Reddit Performance</h3>
					<div className="grid grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-gray-900">{selectedIdea.reddit_score}</div>
							<span className="text-xs text-gray-500">Upvotes</span>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-gray-900">{selectedIdea.reddit_comments}</div>
							<span className="text-xs text-gray-500">Comments</span>
						</div>
						<div className="text-center">
							<div className="text-lg font-bold text-gray-900">{new Date(selectedIdea.reddit_created_utc * 1000).toLocaleDateString()}</div>
							<span className="text-xs text-gray-500">Posted</span>
						</div>
					</div>
				</div>

              {/* Action Footer */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <a 
                    href={selectedIdea.reddit_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <span>View Original Reddit Post</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <div />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate New Idea Modal */}
      {/* This modal is no longer used, but keeping it for now as it might be re-introduced or removed later */}
      {/* {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate New Business Idea</h2>
            <p className="text-gray-600 mb-4">
              Describe the type of business idea you'd like to generate.
              For example, "A subscription-based platform for pet owners to find and book dog walkers."
            </p>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              rows={5}
              placeholder="e.g., A subscription-based platform for pet owners to find and book dog walkers."
              value={ideaDescription}
              onChange={(e) => setIdeaDescription(e.target.value)}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateNewIdea}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                disabled={generatingIdea}
              >
                {generatingIdea ? 'Generating...' : 'Generate Idea'}
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

