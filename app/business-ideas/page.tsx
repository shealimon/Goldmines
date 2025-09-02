'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search, 
  Filter,
  Plus,
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
  Lock
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface BusinessIdea {
  id: string;
  business_idea_name: string | null;
  reddit_title: string | null;
  reddit_content: string | null;
  reddit_author: string | null;
  reddit_subreddit: string | null;
  reddit_score: number | null;
  reddit_comments: number | null;
  opportunity_points: string[] | null;
  problems_solved: string[] | null;
  target_customers: string | null;
  market_size: string[];
  niche: string | null;
  category: string | null;
  marketing_strategy: string | null;
  created_at: string | null;
  analysis_status: string | null;
}

export default function BusinessIdeasPage() {
  const { user, profile } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [businessIdeas, setBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);
  const [tooltipPage, setTooltipPage] = useState(0);
  const itemsPerPage = 50; // Changed from 12 to 50

  // Check if user is Pro (has premium subscription)
  const isProUser = profile?.plan_type === 'pro' || profile?.plan_type === 'premium';

  const fetchBusinessIdeas = useCallback(async () => {
    try {
      setLoading(true);
      // Add pagination parameters to the API call
      const response = await fetch(`/api/business-ideas?page=${currentPage}&limit=${itemsPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        setBusinessIdeas(data.business_ideas || []);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
      } else {
        setError(data.message || 'Failed to fetch business ideas');
      }
    } catch (err) {
      setError('Error loading business ideas');
      console.error('Error fetching business ideas:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Fetch business ideas from API with pagination
  useEffect(() => {
    fetchBusinessIdeas();
  }, [fetchBusinessIdeas]);

  // Handle page change with subscription check
  const handlePageChange = (page: number) => {
    if (!isProUser && page > 1) {
      // Show upgrade tooltip for Free users trying to access pages > 1
      setTooltipPage(page);
      setShowUpgradeTooltip(true);
      setTimeout(() => setShowUpgradeTooltip(false), 3000); // Hide after 3 seconds
      return;
    }
    
    setCurrentPage(page);
  };

  // Filter and sort ideas
  const filteredIdeas = businessIdeas.filter(idea => {
    const matchesSearch = 
      (idea.business_idea_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (idea.reddit_title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (idea.reddit_content?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (idea.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (idea.niche?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (idea.category?.toLowerCase() || '').includes(selectedFilter) ||
                         (idea.niche?.toLowerCase() || '').includes(selectedFilter);
    
    return matchesSearch && matchesFilter;
  });

  // Sort ideas
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      case 'popular':
        return (b.reddit_score || 0) - (a.reddit_score || 0);
      case 'rating':
        return (b.reddit_comments || 0) - (a.reddit_comments || 0);
      case 'potential':
        return (b.opportunity_points?.length || 0) - (a.opportunity_points?.length || 0);
      default:
        return 0;
    }
  });

  // Get unique categories for filters
  const categories = Array.from(new Set(businessIdeas.map(idea => idea.category).filter((category): category is string => Boolean(category))));
  const filters = [
    { value: 'all', label: 'All Ideas', count: businessIdeas.length },
    ...categories.map(category => ({
      value: category.toLowerCase(),
      label: category,
      count: businessIdeas.filter(idea => idea.category === category).length
    }))
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Most Comments' },
    { value: 'potential', label: 'Highest Potential' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Always show as DD/MM/YYYY format
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getMarketSizeColor = (marketSize: string[] | string | null) => {
    if (!marketSize) return 'bg-gray-100 text-gray-700';
    
    // Handle both array and string formats
    const sizeString = Array.isArray(marketSize) ? marketSize[0] || '' : marketSize;
    if (!sizeString) return 'bg-gray-100 text-gray-700';
    
    const size = sizeString.toLowerCase();
    if (size.includes('large') || size.includes('massive') || size.includes('$1b') || size.includes('billion')) return 'bg-green-100 text-green-700';
    if (size.includes('medium') || size.includes('$100m') || size.includes('million')) return 'bg-yellow-100 text-yellow-700';
    if (size.includes('small') || size.includes('niche') || size.includes('$10m')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getPotentialColor = (opportunityPoints: string[] | null) => {
    if (!opportunityPoints) return 'bg-gray-100 text-gray-700';
    const count = opportunityPoints.length;
    if (count >= 5) return 'bg-purple-100 text-purple-700';
    if (count >= 3) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first few pages, current page, and last few pages
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading business ideas...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Business Ideas</h1>
              <p className="text-gray-600">Discover and explore {totalCount} innovative business opportunities</p>
            </div>
          </div>
          
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Generate New Idea</span>
          </button>
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
                  placeholder="Search business ideas, categories, or content..."
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
            Showing {filteredIdeas.length} of {businessIdeas.length} ideas 
            {filteredIdeas.length !== businessIdeas.length && ` (filtered from ${businessIdeas.length} total)`}
          </p>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {sortedIdeas.map(idea => (
            <div key={idea.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {idea.business_idea_name || idea.reddit_title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {idea.reddit_content?.substring(0, 150)}...
                    </p>
                  </div>
                  <button className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {idea.category && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {idea.category}
                    </span>
                  )}
                  {idea.niche && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {idea.niche}
                    </span>
                  )}
                  {idea.reddit_subreddit && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      r/{idea.reddit_subreddit}
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                      <Target className="w-4 h-4" />
                      <span>Market</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getMarketSizeColor(idea.market_size)}`}>
                      {Array.isArray(idea.market_size) ? (idea.market_size[0] || 'Unknown') : (idea.market_size || 'Unknown')}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Potential</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getPotentialColor(idea.opportunity_points)}`}>
                      {idea.opportunity_points?.length || 0} points
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span>Reddit</span>
                    </div>
                    <span className="text-sm font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                      {idea.reddit_score || 0} ⬆
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(idea.created_at || '')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Lightbulb className="w-4 h-4" />
                    <span>{idea.reddit_comments || 0} comments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>by {idea.reddit_author || 'Unknown'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Bookmark className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mb-8">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {generatePageNumbers().map((page, index) => (
                <div key={index} className="relative">
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-400">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      disabled={!isProUser && (page as number) > 1}
                      className={`w-10 h-10 rounded-full border transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-gray-900 text-white border-gray-900'
                          : !isProUser && (page as number) > 1
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                      title={!isProUser && (page as number) > 1 ? 'Upgrade to Pro to unlock more ideas' : ''}
                    >
                      {page}
                    </button>
                  )}
                  
                  {/* Upgrade Tooltip */}
                  {showUpgradeTooltip && tooltipPage === page && !isProUser && (page as number) > 1 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Upgrade to Pro to unlock more ideas</span>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || (!isProUser && currentPage >= 1)}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredIdeas.length === 0 && !loading && (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No business ideas found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters to find more ideas.</p>
            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
              Generate New Ideas
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">Error loading business ideas</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button 
                onClick={fetchBusinessIdeas}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
