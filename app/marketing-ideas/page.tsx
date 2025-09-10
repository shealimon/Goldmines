'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useNotification } from '@/app/components/NotificationProvider';
import { 
  LogOut, 
  User, 
  Mail, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Settings,
  Plus,
  Search,
  Filter,
  Menu,
  X,
  Bookmark,
  Loader2
} from 'lucide-react';

interface MarketingIdea {
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
  marketing_idea_name: string;
  idea_description: string;
  channel: string[];
  target_audience: string[];
  potential_impact: 'High' | 'Medium' | 'Low';
  implementation_tips: string[];
  success_metrics: string[];
  analysis_status: string;
  created_at: string;
  full_analysis?: string;
}

export default function MarketingIdeasPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useUser();
  const { showNotification } = useNotification();
  const [marketingIdeas, setMarketingIdeas] = useState<MarketingIdea[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<MarketingIdea | null>(null);
  const [showIdeaDetail, setShowIdeaDetail] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [fetchingReddit, setFetchingReddit] = useState(false);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<Set<string>>(new Set());

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('🚫 No user found, redirecting to login');
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout exception:', error);
    }
  };

  // Fetch user's saved items
  const fetchSavedItems = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/saved?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        const marketingSavedIds = data.saved_items
          .filter((item: any) => item.item_type === 'marketing')
          .map((item: any) => item.id.toString());
        setBookmarkedItems(new Set(marketingSavedIds));
      }
    } catch (err) {
      console.error('Error fetching saved items:', err);
    }
  }, [user?.id]);

  // Fetch saved items when user changes
  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  // Load existing data on component mount
  useEffect(() => {
    console.log('Component mounted, loading marketing ideas...');
    loadMarketingIdeas();
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback(async (ideaId: string) => {
    if (!user?.id) {
      showNotification('Please log in to save bookmarks', 'error');
      return;
    }
    
    showNotification('Saving bookmark...', 'info');
    
    setBookmarkLoading(prev => new Set(prev).add(ideaId));
    
    try {
      const isCurrentlyBookmarked = bookmarkedItems.has(ideaId);
      
      const response = await fetch('/api/saved', {
        method: isCurrentlyBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          item_id: ideaId,
          item_type: 'marketing'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBookmarkedItems(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyBookmarked) {
            newSet.delete(ideaId);
          } else {
            newSet.add(ideaId);
          }
          return newSet;
        });
        
        showNotification(
          isCurrentlyBookmarked ? 'Bookmark removed' : 'Bookmark saved',
          'success'
        );
      } else {
        showNotification('Failed to save bookmark', 'error');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showNotification('Failed to save bookmark', 'error');
    } finally {
      setBookmarkLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(ideaId);
        return newSet;
      });
    }
  }, [user?.id, bookmarkedItems, showNotification]);

  // Show loading state while authentication is being checked
  if (loading) {
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

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Function to fetch and analyze Reddit data with OpenAI (BATCH PROCESSING)
  const fetchRedditData = async () => {
    try {
      console.log('🚀 Starting fetchRedditData with OpenAI analysis for Marketing Ideas...');
      setFetchingReddit(true);
      showNotification('Please wait while we analyze Reddit posts...', 'info');
      
      // POST request to fetch posts, analyze with OpenAI, and save to marketing_ideas table
      console.log('📡 Making POST request to /api/marketing-ideas...');
      const response = await fetch('/api/marketing-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 10
        })
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('📊 Response data:', responseData);
      
      if (responseData.success) {
        console.log('✅ Successfully processed marketing ideas from Reddit');
        console.log('📊 Results:', {
          total_fetched: responseData.total_posts_fetched,
          successfully_processed: responseData.successfully_processed,
          processed_posts: responseData.processed_posts?.length || 0
        });
        
        // Force refresh the marketing ideas data
        console.log('🔄 Refreshing marketing ideas...');
        await loadMarketingIdeas();
        console.log('✅ Marketing ideas refreshed');
        
        // Show success message if any posts were processed
        if (responseData.successfully_processed > 0) {
          console.log(`🎉 ${responseData.successfully_processed} new marketing ideas added!`);
          showNotification(
            `${responseData.successfully_processed} new marketing idea${responseData.successfully_processed > 1 ? 's' : ''} generated and added to your collection.`, 
            'success'
          );
        } else {
          console.log('📭 No new marketing ideas were generated (posts may not contain marketing content)');
          showNotification(
            'We analyzed the latest posts but didn\'t find any new marketing opportunities at this time. Try again later!', 
            'info'
          );
        }
        
      } else {
        console.error('❌ API returned error:', responseData.message);
        console.log('📋 Full response:', responseData);
        showNotification(
          responseData.message || 'Failed to generate new marketing ideas. Please try again.', 
          'error'
        );
        // Even on error, try to refresh marketing ideas to show current state
        await loadMarketingIdeas();
      }
      
    } catch (error) {
      console.error('💥 Error fetching Reddit data:', error);
      showNotification(
        'An error occurred while generating new marketing ideas. Please try again.', 
        'error'
      );
    } finally {
      console.log('🔄 Setting fetchingReddit to false...');
      setFetchingReddit(false);
      console.log('✅ Fetch Reddit process completed');
    }
  };

  // Function to load marketing ideas from marketing_ideas table
  const loadMarketingIdeas = async () => {
    try {
      console.log('📖 Loading marketing ideas from database...');
      const response = await fetch('/api/marketing-ideas');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Loaded marketing ideas:', data.count);
        const ideas = data.marketing_ideas || [];
        
        if (ideas.length > 0) {
          // Sort by most recent Reddit post date first (reddit_created_utc descending)
          const sortedIdeas = ideas.sort((a: MarketingIdea, b: MarketingIdea) => {
            const dateA = a.reddit_created_utc || 0;
            const dateB = b.reddit_created_utc || 0;
            return dateB - dateA; // Descending order (recent first)
          });
          setMarketingIdeas(sortedIdeas);
          console.log('📊 Marketing ideas set in state:', sortedIdeas.length);
        } else {
          setMarketingIdeas([]);
          console.log('📭 No marketing ideas found - setting empty array');
        }
      } else {
        console.error('❌ Failed to load marketing ideas:', data.message);
        setMarketingIdeas([]);
      }
    } catch (error) {
      console.error('💥 Error loading marketing ideas:', error);
      setMarketingIdeas([]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
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
                  router.push('/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 text-sm text-gray-700 hover:bg-gray-100"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 lg:p-6 bg-white">
            <div className="bg-white">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">Marketing Ideas</h1>
                  <p className="text-gray-600 text-sm">Discover actionable marketing strategies and growth hacks from Reddit</p>
                </div>
                <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2">
                  <button 
                    onClick={fetchRedditData}
                    disabled={fetchingReddit}
                    className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-md hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium text-sm flex items-center justify-center lg:justify-start space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Fetch New Marketing Ideas</span>
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
                      placeholder="Search marketing ideas..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-sm"
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
                      <div className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Marketing Idea</div>
                      <div className="w-20 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</div>
                    </div>
                  </div>
                  
                  {marketingIdeas && marketingIdeas.length > 0 ? (
                    <div className="divide-y divide-gray-200 bg-white">
                      {marketingIdeas.map((idea, index) => (
                        <div 
                          key={`mobile-idea-${idea.id}`}
                          className="p-4 hover:bg-gray-50 transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-12 text-xs text-gray-400 font-medium">
                              {index + 1}
                            </div>
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => {
                                console.log('🔍 Opening marketing idea detail (mobile):', {
                                  marketing_idea_name: idea.marketing_idea_name,
                                  has_full_analysis: !!idea.full_analysis,
                                  full_analysis_length: idea.full_analysis?.length || 0,
                                  full_analysis_preview: idea.full_analysis?.substring(0, 100) || 'None'
                                });
                                setSelectedIdea(idea);
                                setShowIdeaDetail(true);
                              }}
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {idea.marketing_idea_name || 'Untitled Marketing Idea'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(idea.id);
                                }}
                                disabled={bookmarkLoading.has(idea.id)}
                                className={`p-1 rounded transition-colors ${
                                  bookmarkedItems.has(idea.id) 
                                    ? 'text-yellow-500 hover:text-yellow-600' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {bookmarkLoading.has(idea.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Bookmark className={`w-4 h-4 ${bookmarkedItems.has(idea.id) ? 'fill-current' : ''}`} />
                                )}
                              </button>
                              <div className="w-20 text-xs text-gray-500">
                                {idea.reddit_created_utc ? 
                                  new Date(idea.reddit_created_utc * 1000).toLocaleDateString() : 
                                  'Unknown Date'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No marketing ideas yet</p>
                      <p className="text-xs mt-1">Click 'Fetch New Marketing Ideas' to get started</p>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketing Idea</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Save</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {marketingIdeas && marketingIdeas.length > 0 ? (
                        marketingIdeas.map((idea, index) => (
                          <tr 
                            key={`data-row-${index}-id-${idea.id}`}
                            className="hover:bg-gray-50 transition-all duration-200"
                          >
                            <td className="px-3 py-2 text-gray-500 text-sm font-medium">
                              {index + 1}
                            </td>
                            <td 
                              className="px-3 py-2 cursor-pointer"
                              onClick={() => {
                                console.log('🔍 Opening marketing idea detail (desktop):', {
                                  marketing_idea_name: idea.marketing_idea_name,
                                  has_full_analysis: !!idea.full_analysis,
                                  full_analysis_length: idea.full_analysis?.length || 0,
                                  full_analysis_preview: idea.full_analysis?.substring(0, 100) || 'None'
                                });
                                setSelectedIdea(idea);
                                setShowIdeaDetail(true);
                              }}
                            >
                              <div className="text-gray-900 font-medium text-sm">{idea.marketing_idea_name || 'Untitled Marketing Idea'}</div>
                            </td>
                            <td className="px-3 py-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(idea.id);
                                }}
                                disabled={bookmarkLoading.has(idea.id)}
                                className={`p-1 rounded transition-colors ${
                                  bookmarkedItems.has(idea.id) 
                                    ? 'text-yellow-500 hover:text-yellow-600' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {bookmarkLoading.has(idea.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Bookmark className={`w-4 h-4 ${bookmarkedItems.has(idea.id) ? 'fill-current' : ''}`} />
                                )}
                              </button>
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
                              {index === 0 ? "No marketing ideas yet - Click 'Fetch New Marketing Ideas' to get started" : ""}
                            </td>
                            <td className="px-3 py-2 text-gray-400 text-sm">-</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Marketing Idea Detail Modal */}
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
            <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 rounded-t-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">Marketing Idea</h2>
                    <p className="text-cyan-100 text-sm">AI-powered analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIdeaDetail(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm hover:scale-105"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Marketing Idea Name with enhanced styling */}
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
                  {selectedIdea.marketing_idea_name || 'Untitled Marketing Idea'}
                </h1>
                <div className="flex items-center space-x-4 text-cyan-100">
                  <span className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {selectedIdea.potential_impact || 'Medium'} Impact
                    </span>
                  </span>
                  <span className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm font-medium">
                      {selectedIdea.channel?.join(', ') || 'Multiple Channels'}
                    </span>
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
                  {/* Idea Description */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Idea Description</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedIdea.idea_description || 'No description available'}
                    </p>
                  </div>

                  {/* Target Audience */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Target Audience</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.target_audience?.map((audience: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Implementation Tips */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Implementation Tips</h3>
                    </div>
                    <ul className="space-y-2">
                      {selectedIdea.implementation_tips?.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Channels */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Marketing Channels</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.channel?.map((channel: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Success Metrics */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg text-gray-900">Success Metrics</h3>
                    </div>
                    <ul className="space-y-2">
                      {selectedIdea.success_metrics?.map((metric: string, index: number) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{metric}</span>
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
                        View Original Post
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
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">Loading Fresh Marketing Ideas</div>
              <div className="text-gray-600 text-center leading-relaxed">
                Analyzing Reddit posts with AI to discover new marketing strategies...
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-cyan-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
