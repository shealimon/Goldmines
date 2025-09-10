'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search, 
  Filter,
  Lightbulb,
  Bookmark,
  Share2,
  MoreVertical,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Megaphone
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useNotification } from '@/app/components/NotificationProvider';
import { useRouter } from 'next/navigation';

interface SavedItem {
  id: number;
  item_type: 'business' | 'marketing';
  title: string;
  summary: string;
  category: string;
  niche?: string;
  saved_at: string;
}

export default function SavedIdeasPage() {
  const { user, profile, loading: authLoading } = useUser();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkLoading, setBookmarkLoading] = useState<Set<string>>(new Set());

  // Check if user is Pro (has premium subscription)
  const isProUser = profile?.plan_type === 'pro' || profile?.plan_type === 'premium';

  const fetchSavedItems = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/saved?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSavedItems(data.saved_items || []);
      } else {
        setError(data.message || 'Failed to fetch saved items');
      }
    } catch (err) {
      setError('Error loading saved items');
      console.error('Error fetching saved items:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🚫 No user found, redirecting to login');
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch saved items when user changes
  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  // Show loading state while authentication is being checked
  if (authLoading) {
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

  // Toggle bookmark (remove from saved)
  const toggleBookmark = async (itemId: string, itemType: 'business' | 'marketing') => {
    if (!user?.id) return;
    
    setBookmarkLoading(prev => new Set(prev).add(itemId));
    
    try {
      const response = await fetch('/api/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          item_type: itemType,
          item_id: parseInt(itemId)
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from saved items list
        setSavedItems(prev => prev.filter(item => item.id.toString() !== itemId));
        showNotification('Item removed from your collection', 'info');
      } else {
        console.error('Bookmark error:', data.message);
        showNotification(data.message || 'Failed to remove item', 'error');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      showNotification('Failed to remove item. Please try again.', 'error');
    } finally {
      setBookmarkLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Filter and sort logic
  const filteredItems = savedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'business' && item.item_type === 'business') ||
                         (selectedFilter === 'marketing' && item.item_type === 'marketing');
    
    return matchesSearch && matchesFilter;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
      case 'oldest':
        return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  // Filter options
  const filters = [
    { value: 'all', label: 'All Items', count: savedItems.length },
    { value: 'business', label: 'Business Ideas', count: savedItems.filter(item => item.item_type === 'business').length },
    { value: 'marketing', label: 'Marketing Ideas', count: savedItems.filter(item => item.item_type === 'marketing').length }
  ];

  // Sort options
  const sortOptions = [
    { value: 'recent', label: 'Recently Saved' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'category', label: 'Category' }
  ];

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getItemTypeIcon = (itemType: string) => {
    return itemType === 'business' ? Lightbulb : Megaphone;
  };

  const getItemTypeColor = (itemType: string) => {
    return itemType === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading saved ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Saved Ideas</h1>
              <p className="text-gray-600">Your bookmarked business and marketing ideas ({savedItems.length} items)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search saved ideas, categories, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                {filters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label} ({filter.count})
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredItems.length} of {savedItems.length} saved items
            {filteredItems.length !== savedItems.length && ` (filtered from ${savedItems.length} total)`}
          </p>
        </div>

        {/* Ideas Grid */}
        {sortedItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {sortedItems.map(item => {
              const ItemIcon = getItemTypeIcon(item.item_type);
              return (
                <div key={`${item.item_type}-${item.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <ItemIcon className="w-5 h-5 text-gray-600" />
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getItemTypeColor(item.item_type)}`}>
                            {item.item_type === 'business' ? 'Business Idea' : 'Marketing Idea'}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {item.summary}
                        </p>
                      </div>
                      <button 
                        className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="More options"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {item.category}
                      </span>
                      {item.niche && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {item.niche}
                        </span>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Saved {formatDate(item.saved_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => toggleBookmark(item.id.toString(), item.item_type)}
                          disabled={bookmarkLoading.has(item.id.toString())}
                          className="p-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          {bookmarkLoading.has(item.id.toString()) ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Bookmark className="w-5 h-5 fill-current" />
                          )}
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                          aria-label="Share idea"
                          title="Share idea"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <Link 
                        href={item.item_type === 'business' ? `/dashboard` : `/marketing-ideas`}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved ideas yet</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedFilter !== 'all' 
                ? 'No items match your current filters. Try adjusting your search or filters.'
                : 'Start bookmarking business and marketing ideas to see them here.'
              }
            </p>
            {!searchQuery && selectedFilter === 'all' && (
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Browse Business Ideas
                </Link>
                <Link 
                  href="/marketing-ideas"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Browse Marketing Ideas
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
