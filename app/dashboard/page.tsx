'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { 
  LogOut, 
  User, 
  Mail, 
  Calendar, 
  Lightbulb, 
  TrendingUp, 
  DollarSign, 
  Settings,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X
} from 'lucide-react';

// Remove these interfaces - using types from UserContext

interface BusinessIdea {
  id: string;
  reddit_post_id: string;
  reddit_title: string;
  reddit_content: string;
  reddit_author: string;
  reddit_subreddit: string;
  reddit_score: number;
  reddit_comments: number;
  reddit_url: string;
  reddit_created_utc: number;
  reddit_permalink: string;
  business_idea_name: string;
  opportunity_points: string[];
  problems_solved: string[];
  target_customers: string[];
  market_size: string[];
  niche: string;
  category: string;
  marketing_strategy: string[];
  analysis_status: string;
  created_at: string;
  full_analysis?: string; // Added for the new modal
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useUser();
  const [activeTab, setActiveTab] = useState('business-ideas');
  const [businessIdeas, setBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Fixed at 50 rows per page
  const [totalItems, setTotalItems] = useState(0);
  
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [showIdeaDetail, setShowIdeaDetail] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Debug log for businessIdeas state changes
  useEffect(() => {
    console.log('🔍 BusinessIdeas state changed:', {
      length: businessIdeas.length,
      ideas: businessIdeas.map(idea => idea.business_idea_name)
    });
  }, [businessIdeas]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showIdeaDetail) {
        setShowIdeaDetail(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showIdeaDetail]);

  // Add this state for Reddit data
  const [redditPosts, setRedditPosts] = useState<any[]>([]);
  const [fetchingReddit, setFetchingReddit] = useState(false);



  // Function to fetch and analyze Reddit data with OpenAI
  const fetchRedditData = async () => {
    try {
      console.log('🚀 Starting fetchRedditData with OpenAI analysis...');
      setFetchingReddit(true);
      
      // POST request to fetch 1 post, analyze with OpenAI, and save to business_ideas table
      console.log('📡 Making POST request to /api/reddit with business analysis...');
      const response = await fetch('/api/reddit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMode: true
        })
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('📊 Response data:', responseData);
      
      if (responseData.success) {
        console.log('✅ Successfully processed Reddit posts');
        console.log('📊 Results:', {
          total_fetched: responseData.total_posts_fetched,
          successfully_processed: responseData.successfully_processed,
          processed_posts: responseData.processed_posts?.length || 0
        });
        
        // Force refresh the business ideas data
        console.log('🔄 Refreshing business ideas...');
        await loadBusinessIdeas();
        console.log('✅ Business ideas refreshed');
        
        // Show success message if any posts were processed
        if (responseData.successfully_processed > 0) {
          console.log(`🎉 ${responseData.successfully_processed} new business ideas added!`);
        } else {
          console.log('📭 No new business ideas were generated (posts may not contain business ideas)');
        }
        
      } else {
        console.error('❌ API returned error:', responseData.message);
        console.log('📋 Full response:', responseData);
        // Even on error, try to refresh business ideas to show current state
        await loadBusinessIdeas();
      }
      
    } catch (error) {
      console.error('💥 Error fetching Reddit data:', error);
      // Don't show generic alert - let the user see the actual error or handle it gracefully
    } finally {
      console.log('🔄 Setting fetchingReddit to false...');
      setFetchingReddit(false);
      console.log('✅ Fetch Reddit process completed');
    }
  };

  // Function to load business ideas from business_ideas table
  const loadBusinessIdeas = async () => {
    try {
      console.log('📖 Loading business ideas from database...');
      const response = await fetch('/api/business-ideas');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Loaded business ideas:', data.count);
        const ideas = data.business_ideas || [];
        
        if (ideas.length > 0) {
          // Sort by most recent Reddit post date first (reddit_created_utc descending)
          const sortedIdeas = ideas.sort((a: BusinessIdea, b: BusinessIdea) => {
            const dateA = a.reddit_created_utc || 0;
            const dateB = b.reddit_created_utc || 0;
            return dateB - dateA; // Descending order (recent first)
          });
          setBusinessIdeas(sortedIdeas);
          setTotalItems(sortedIdeas.length); // Set total items for pagination
          console.log('📊 Business ideas set in state:', sortedIdeas.length);
        } else {
          setBusinessIdeas([]);
          setTotalItems(0);
          console.log('📭 No business ideas found - setting empty array');
        }
      } else {
        console.error('❌ Failed to load business ideas:', data.message);
        setBusinessIdeas([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('💥 Error loading business ideas:', error);
      setBusinessIdeas([]);
      setTotalItems(0);
    }
  };

  // Function to load analyzed ideas from storage
  const loadAnalyzedIdeas = async () => {
    try {
      console.log('🔄 Loading analyzed ideas...');
      setDataLoading(true);
      
      console.log('📥 Making GET request to /api/reddit...');
      const response = await fetch('/api/reddit');
      console.log('📥 GET response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 GET response data:', data);
      
      if (data.success && data.posts) {
        console.log('📋 Setting ideas in state:', data.posts.length);
        console.log('📝 Sample idea:', data.posts[0]);
        setBusinessIdeas(data.posts);
      } else {
        console.log('⚠️ No posts in response or API error');
        setBusinessIdeas([]);
      }
      
    } catch (error) {
      console.error('💥 Error loading analyzed ideas:', error);
      setBusinessIdeas([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Load existing data on component mount
  useEffect(() => {
    console.log('Component mounted, loading business ideas...');
    loadBusinessIdeas();
  }, []);

  // Check authentication using UserContext
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
      } else {
        console.log('User authenticated:', user.email);
      }
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout exception:', error);
    }
  };
 

  // Update the loading check to be less strict
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <div className="text-gray-600 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPageData = businessIdeas.slice(startIndex, endIndex);

  // Pagination navigation functions
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPreviousPage = () => goToPage(currentPage - 1);

  // Handle page size change - REMOVED since page size is fixed
  // const handlePageSizeChange = (newPageSize: number) => {
  //   setPageSize(newPageSize);
  //   setCurrentPage(1); // Reset to first page when changing page size
  // };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">G</span>
              </div>
              <span className="text-xl font-black text-gray-900">goldmines</span>
            </div>
            
            {/* User Info - Top Right */}
            <div className="flex items-center space-x-3">
              {/* Profile Menu Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => {
                    console.log('Profile button clicked, current state:', showProfileMenu);
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate max-w-32">
                    {profile?.display_name || user?.email || 'User'}
                  </span>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="text-xs text-gray-500 px-3 py-1 border-b border-gray-100">
                      Profile Menu
                    </div>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen bg-white">
        {/* Mobile overlay - Moved outside sidebar for better positioning */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-10 z-20"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside className={`${
          mobileMenuOpen ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:block'
        } w-56 bg-gray-50 border-r border-gray-200 flex-shrink-0`}>
          
          <nav className="p-4 h-full flex flex-col bg-gray-50 relative z-50">
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-end mb-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1 flex-1">
              <button
                onClick={() => {
                  setActiveTab('business-ideas');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 text-sm ${
                  activeTab === 'business-ideas' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>New Ideas</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('marketing-ideas');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 text-sm ${
                  activeTab === 'marketing-ideas' 
                    ? 'bg-cyan-500 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Marketing Ideas</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('case-studies');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 text-sm ${
                  activeTab === 'case-studies' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Case Studies</span>
              </button>
            </div>
            
            {/* Bottom Section - Profile Options - Fixed at bottom */}
            {/* This section is now moved to the header */}
          </nav>
        </aside>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 lg:p-6 bg-white">
            {activeTab === 'business-ideas' && (
              <div className="bg-white">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                  <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">New Business Ideas</h1>
                    <p className="text-gray-600 text-sm">Discover validated business opportunities from Reddit discussions</p>
                  </div>
                  <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2">
                    <button 
                      onClick={fetchRedditData}
                      disabled={fetchingReddit}
                      className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-md hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 font-medium text-sm flex items-center justify-center lg:justify-start space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Fetch New Ideas</span>
                    </button>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-gray-50 rounded-md p-4 mb-4 border border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search business ideas..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <button className="w-full lg:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center lg:justify-start space-x-2 text-sm">
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                    </button>
                  </div>
                </div>

                {/* Ideas Table */}
                <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                  {/* Mobile Cards View */}
                  <div className="lg:hidden bg-white">
                    {/* Mobile Table Headers */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-xs font-medium text-gray-500 uppercase tracking-wider">#</div>
                        <div className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Business Idea</div>
                        <div className="w-20 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</div>
                      </div>
                    </div>
                    
                    {businessIdeas && businessIdeas.length > 0 ? (
                      <div className="divide-y divide-gray-200 bg-white">
                        {businessIdeas.map((idea, index) => (
                          <div 
                            key={`mobile-idea-${idea.id}`}
                            onClick={() => {
                              console.log('🔍 Opening idea detail (mobile):', {
                                business_idea_name: idea.business_idea_name,
                                has_full_analysis: !!idea.full_analysis,
                                full_analysis_length: idea.full_analysis?.length || 0,
                                full_analysis_preview: idea.full_analysis?.substring(0, 100) || 'None'
                              });
                              setSelectedIdea(idea);
                              setShowIdeaDetail(true);
                            }}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-12 text-xs text-gray-400 font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">
                                  {idea.business_idea_name || 'Untitled Business Idea'}
                                </div>
                              </div>
                              <div className="w-20 text-xs text-gray-500">
                                {idea.reddit_created_utc ? 
                                  new Date(idea.reddit_created_utc * 1000).toLocaleDateString() : 
                                  'Unknown Date'
                                }
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">No business ideas yet</p>
                        <p className="text-xs mt-1">Click 'Fetch New Ideas' to get started</p>
                      </div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Idea</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {businessIdeas && businessIdeas.length > 0 ? (
                          businessIdeas.map((idea, index) => (
                            <tr 
                              key={`data-row-${index}-id-${idea.id}`}
                              onClick={() => {
                                console.log('🔍 Opening idea detail (desktop):', {
                                  business_idea_name: idea.business_idea_name,
                                  has_full_analysis: !!idea.full_analysis,
                                  full_analysis_length: idea.full_analysis?.length || 0,
                                  full_analysis_preview: idea.full_analysis?.substring(0, 100) || 'None'
                                });
                                setSelectedIdea(idea);
                                setShowIdeaDetail(true);
                              }}
                              className="hover:bg-gray-50 cursor-pointer transition-all duration-200"
                            >
                              <td className="px-3 py-2 text-gray-500 text-sm font-medium">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-gray-900 font-medium text-sm">{idea.business_idea_name || 'Untitled Business Idea'}</div>
                              </td>
                              <td className="px-3 py-2 text-gray-500 text-xs">
                                {idea.reddit_created_utc ? 
                                  new Date(idea.reddit_created_utc * 1000).toLocaleDateString() : 
                                  'Unknown Date'
                                }
                              </td>
                            </tr>
                          ))
                        ) : (
                          // Show empty rows when no data
                          Array.from({ length: 5 }).map((_, index) => (
                            <tr key={`empty-row-${index}-no-data`} className="border-b border-gray-200">
                              <td className="px-3 py-2 text-gray-400 text-sm">{index + 1}</td>
                              <td className="px-3 py-2 text-gray-400 text-sm">
                                {index === 0 ? "No business ideas yet - Click 'Fetch New Ideas' to get started" : ""}
                              </td>
                              <td className="px-3 py-2 text-gray-400 text-sm">-</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination section completely removed - showing all data */}
                </div>
              </div>
            )}

            {activeTab === 'marketing-ideas' && (
              <div className="text-center py-16">
                <TrendingUp className="w-12 h-12 text-cyan-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Marketing Ideas</h2>
                <p className="text-gray-600 text-sm">Coming soon - Marketing strategies and growth hacks</p>
              </div>
            )}

            {activeTab === 'case-studies' && (
              <div className="text-center py-16">
                <DollarSign className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Case Studies</h2>
                <p className="text-gray-600 text-sm">Coming soon - Real business success stories and analysis</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Business Idea Detail Modal */}
      {showIdeaDetail && selectedIdea && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowIdeaDetail(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with enhanced UI and colors */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-t-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">Business Idea</h2>
                    <p className="text-blue-100 text-sm">AI-powered analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIdeaDetail(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm hover:scale-105"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Business Idea Name with enhanced styling */}
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <h1 className="text-3xl font-bold text-white mb-3 leading-tight">{selectedIdea.business_idea_name || 'Untitled Business Idea'}</h1>
                <div className="flex items-center space-x-4 text-blue-100">
                  <span className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm font-medium">{selectedIdea.category || 'General Business'}</span>
                  </span>
                  <span className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium">{selectedIdea.niche || 'Business Opportunity'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Two-column layout for better organization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Opportunity */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Opportunity</h3>
                    </div>
                    <ul className="space-y-2">
                      {selectedIdea.opportunity_points?.map((point, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Problem it Solves */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Problem it Solves</h3>
                    </div>
                    <ul className="space-y-2">
                      {selectedIdea.problems_solved?.map((problem, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Target Customer */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Target Customer</h3>
                    </div>
                    <ul className="space-y-2">
                      {selectedIdea.target_customers?.map((customer, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{customer}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Market Size */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Market Size</h3>
                    </div>
                    <ul className="space-y-2">
                      {selectedIdea.market_size?.map((size, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{size}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Marketing Strategy */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Marketing Strategy</h3>
                    </div>
                    <ul className="space-y-2">
                      {selectedIdea.marketing_strategy?.map((strategy, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reddit Source Info */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Source Information</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Subreddit:</span>
                        <span className="text-gray-900">r/{selectedIdea.reddit_subreddit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Posted:</span>
                        <span className="text-gray-900">
                          {selectedIdea.reddit_created_utc ? 
                            new Date(selectedIdea.reddit_created_utc * 1000).toLocaleDateString() : 
                            'Unknown Date'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Score:</span>
                        <span className="text-gray-900">↑ {selectedIdea.reddit_score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Comments:</span>
                        <span className="text-gray-900">💬 {selectedIdea.reddit_comments}</span>
                      </div>
                    </div>
                    {selectedIdea.reddit_url && (
                      <a
                        href={selectedIdea.reddit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full inline-flex items-center justify-center p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                        title="View Original Reddit Post"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.25 1.25 0 0 1 1.25 1.25z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Popup - Separate from main content */}
      {fetchingReddit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-6 shadow-2xl border border-gray-100 max-w-md w-full mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">Loading Fresh Ideas</div>
              <div className="text-gray-600 text-center leading-relaxed">
                Analyzing Reddit posts with AI to discover new business opportunities...
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

