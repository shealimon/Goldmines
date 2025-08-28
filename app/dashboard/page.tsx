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
  ChevronsRight
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Fixed at 50 rows per page
  const [totalItems, setTotalItems] = useState(0);
  
  // Debug log for businessIdeas state changes
  useEffect(() => {
    console.log('🔍 BusinessIdeas state changed:', {
      length: businessIdeas.length,
      ideas: businessIdeas.map(idea => idea.business_idea_name)
    });
  }, [businessIdeas]);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [showIdeaDetail, setShowIdeaDetail] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

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



  // Mock data for now - will be replaced with Reddit API data
  // useEffect(() => {
  //   const mockIdeas: BusinessIdea[] = [
  //     {
  //       id: '1',
  //       title: 'AI-Powered Meal Planning App',
  //       description: 'An app that creates personalized meal plans based on dietary restrictions, budget, and local grocery prices',
  //       market_size: '$15.2B',
  //       target_audience: 'Health-conscious individuals, busy professionals, families',
  //       pain_point: 'People struggle to plan meals that are healthy, affordable, and easy to prepare',
  //       solution: 'AI algorithm that considers nutrition, cost, and preparation time',
  //       reddit_source: 'r/entrepreneur',
  //       created_at: '2024-01-15',
  //       upvotes: 245,
  //       comments: 67
  //     },
  //     {
  //       id: '2',
  //       title: 'Local Service Marketplace',
  //       description: 'A platform connecting local service providers with customers in need of home services',
  //       market_size: '$400B',
  //       target_audience: 'Homeowners, small businesses, service providers',
  //       pain_point: 'Finding reliable local service providers is difficult and time-consuming',
  //       solution: 'Verified marketplace with reviews, ratings, and instant booking',
  //       reddit_source: 'r/smallbusiness',
  //       created_at: '2024-01-14',
  //       upvotes: 189,
  //       comments: 43
  //     }
  //   ];
  //   setBusinessIdeas(mockIdeas);
  // }, []);

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
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-50 border-r border-gray-200 min-h-screen relative">
          <nav className="p-4">
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('business-ideas')}
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
                onClick={() => setActiveTab('marketing-ideas')}
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
                onClick={() => setActiveTab('case-studies')}
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
            
            {/* Bottom Section - Profile Options */}
            <div className="absolute bottom-4 left-4 right-4 space-y-1">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-all duration-200 text-sm"
              >
                <User className="w-4 h-4" />
                <span>{profile?.name || user?.email || 'User'}</span>
              </button>
              
              {showProfileMenu && (
                <div className="bg-white rounded-md shadow-lg border border-gray-200 py-1 mb-2">
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
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'business-ideas' && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">New Business Ideas</h1>
                  <p className="text-gray-600 text-sm">Discover validated business opportunities from Reddit discussions</p>
                </div>
                <button 
                  onClick={fetchRedditData}
                  disabled={fetchingReddit}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-md hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 font-medium text-sm flex items-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>Fetch New Ideas</span>
                </button>
              </div>

              {/* Search and Filters */}
              <div className="bg-gray-50 rounded-md p-4 mb-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search business ideas..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 text-sm">
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              {/* Ideas Table */}
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Idea</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentPageData && currentPageData.length > 0 ? (
                        currentPageData.map((idea, index) => (
                          <tr 
                            key={`data-page-${currentPage}-row-${startIndex + index}-id-${idea.id}`}
                            onClick={() => {
                              setSelectedIdea(idea);
                              setShowIdeaDetail(true);
                            }}
                            className="hover:bg-gray-50 cursor-pointer transition-all duration-200"
                          >
                            <td className="px-3 py-2 text-gray-500 text-sm font-medium">
                              {startIndex + index + 1}
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
                        // Always show empty rows when no data
                        Array.from({ length: Math.min(5, pageSize) }).map((_, index) => (
                          <tr key={`empty-page-${currentPage}-row-${index}-no-data`} className="border-b border-gray-200">
                            <td className="px-3 py-2 text-gray-400 text-sm">{startIndex + index + 1}</td>
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

                {/* Pagination Controls */}
                {totalItems > 0 && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      {/* Page Size Info - Fixed at 50 */}
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">50 rows</span> per page
                      </div>

                      {/* Pagination Info */}
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{endIndex}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> results
                      </div>

                      {/* Pagination Navigation */}
                      <div className="flex items-center space-x-1">
                        {/* First Page */}
                        <button
                          onClick={goToFirstPage}
                          disabled={currentPage === 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="First page"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </button>

                        {/* Previous Page */}
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                          {/* Show first page */}
                          {currentPage > 3 && (
                            <>
                              <button
                                onClick={() => goToPage(1)}
                                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              >
                                1
                              </button>
                              {currentPage > 4 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                            </>
                          )}

                          {/* Show current page and neighbors */}
                          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                            const page = Math.max(1, currentPage - 1 + i);
                            if (page > totalPages) return null;
                            return (
                              <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                  page === currentPage
                                    ? 'bg-emerald-500 text-white'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}

                          {/* Show last page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => goToPage(totalPages)}
                                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Next Page */}
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Last Page */}
                        <button
                          onClick={goToLastPage}
                          disabled={currentPage === totalPages}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Last page"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
        </main>
          </div>

      {/* Business Idea Detail Modal */}
      {showIdeaDetail && selectedIdea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-t-2xl p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Business Idea Analysis</h1>
                    <p className="text-blue-100 text-lg">AI-powered insights from Reddit</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIdeaDetail(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Business Idea Name */}
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-4xl font-bold text-white mb-2">{selectedIdea.business_idea_name || 'Untitled Business Idea'}</h2>
                <div className="flex items-center space-x-4 text-blue-100">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{selectedIdea.category || 'General Business'}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{selectedIdea.niche || 'Business Opportunity'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Two-column layout for better organization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Opportunity */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Opportunity</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedIdea.opportunity_points?.map((point, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Problem it Solves */}
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Problem it Solves</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedIdea.problems_solved?.map((problem, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 leading-relaxed">{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Target Customer */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Target Customer</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedIdea.target_customers?.map((customer, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 leading-relaxed">{customer}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Market Size */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Market Size</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedIdea.market_size?.map((size, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 leading-relaxed">{size}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Marketing Strategy */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Marketing Strategy</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedIdea.marketing_strategy?.map((strategy, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 leading-relaxed">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reddit Source Info */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Source Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Subreddit:</span>
                        <span className="font-medium text-gray-900">r/{selectedIdea.reddit_subreddit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Posted:</span>
                        <span className="font-medium text-gray-900">
                          {selectedIdea.reddit_created_utc ? 
                            new Date(selectedIdea.reddit_created_utc * 1000).toLocaleDateString() : 
                            'Unknown Date'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Score:</span>
                        <span className="font-medium text-gray-900">↑ {selectedIdea.reddit_score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Comments:</span>
                        <span className="font-medium text-gray-900">💬 {selectedIdea.reddit_comments}</span>
                      </div>
                    </div>
                    {selectedIdea.reddit_url && (
                      <a
                        href={selectedIdea.reddit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full inline-flex items-center justify-center px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 text-sm font-medium hover:scale-105"
                      >
                        🔗 View Original Reddit Post
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Analysis Section */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Full Analysis (Raw OpenAI Response)</h3>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedIdea.full_analysis || 'No full analysis available'}
                  </pre>
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

