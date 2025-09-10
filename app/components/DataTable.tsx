'use client';

import { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  MoreVertical, 
  Lightbulb, 
  Megaphone, 
  BookOpen,
  ChevronDown,
  Target,
  RefreshCw
} from 'lucide-react';

interface DataItem {
  id: number;
  title: string;
  niche: string;
  category: string;
  market_size: string[];
  dateGenerated: string;
  isBookmarked: boolean;
  reddit_score?: number;
  reddit_comments?: number;
}

interface DataTableProps {
  data: DataItem[];
  onBookmarkToggle: (id: number) => void;
  onViewDetails: (item: DataItem) => void;
  onDelete: (id: number) => void;
  onGenerateNew?: () => void;
  generateButtonText?: string;
  isGenerating?: boolean;
  title?: string;
  onLoad?: () => void;
  isLoading?: boolean;
}

const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('saas') || lowerCategory.includes('software')) {
    return <Lightbulb className="w-4 h-4 text-blue-600" />;
  } else if (lowerCategory.includes('fintech') || lowerCategory.includes('finance')) {
    return <Lightbulb className="w-4 h-4 text-green-600" />;
  } else if (lowerCategory.includes('edtech') || lowerCategory.includes('education')) {
    return <BookOpen className="w-4 h-4 text-purple-600" />;
  } else if (lowerCategory.includes('healthtech') || lowerCategory.includes('health')) {
    return <Lightbulb className="w-4 h-4 text-red-600" />;
  } else if (lowerCategory.includes('productivity') || lowerCategory.includes('productivity')) {
    return <Lightbulb className="w-4 h-4 text-orange-600" />;
  } else {
    return <Lightbulb className="w-4 h-4 text-gray-600" />;
  }
};

const getCategoryColor = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('saas') || lowerCategory.includes('software')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (lowerCategory.includes('fintech') || lowerCategory.includes('finance')) {
    return 'bg-green-50 text-green-700 border-green-200';
  } else if (lowerCategory.includes('edtech') || lowerCategory.includes('education')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (lowerCategory.includes('healthtech') || lowerCategory.includes('health')) {
    return 'bg-red-50 text-red-700 border-red-200';
  } else if (lowerCategory.includes('productivity') || lowerCategory.includes('productivity')) {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  } else {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getMarketSizeIcon = (marketSize: string[] | string | null) => {
  if (!marketSize) return <Target className="w-4 h-4 text-gray-600" />;
  
  const sizeString = Array.isArray(marketSize) ? marketSize[0] || '' : marketSize;
  const size = sizeString.toLowerCase();
  
  if (size.includes('$1b') || size.includes('billion') || size.includes('large') || size.includes('massive')) {
    return <Target className="w-4 h-4 text-green-600" />;
  } else if (size.includes('$100m') || size.includes('million') || size.includes('medium')) {
    return <Target className="w-4 h-4 text-yellow-600" />;
  } else if (size.includes('$10m') || size.includes('small') || size.includes('niche')) {
    return <Target className="w-4 h-4 text-blue-600" />;
  } else {
    return <Target className="w-4 h-4 text-gray-600" />;
  }
};

const getMarketSizeColor = (marketSize: string[] | string | null) => {
  if (!marketSize) return 'bg-gray-50 text-gray-700 border-gray-200';
  
  const sizeString = Array.isArray(marketSize) ? marketSize[0] || '' : marketSize;
  const size = sizeString.toLowerCase();
  
  if (size.includes('$1b') || size.includes('billion') || size.includes('large') || size.includes('massive')) {
    return 'bg-green-50 text-green-700 border-green-200';
  } else if (size.includes('$100m') || size.includes('million') || size.includes('medium')) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  } else if (size.includes('$10m') || size.includes('small') || size.includes('niche')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  } else {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function DataTable({ data, onBookmarkToggle, onViewDetails, onDelete, onGenerateNew, generateButtonText = "Generate New Idea", isGenerating = false, title = "Business Ideas", onLoad, isLoading = false }: DataTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'saved'>('date');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Debug logging
  console.log('🔍 DataTable Debug:', {
    title,
    dataLength: data.length,
    data: data.slice(0, 2), // Show first 2 items
    isLoading
  });

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime();
      case 'saved':
        return (b.isBookmarked ? 1 : 0) - (a.isBookmarked ? 1 : 0);
      default:
        return 0;
    }
  });

  // Debug sorted data
  console.log('🔍 Sorted Data Debug:', {
    sortedDataLength: sortedData.length,
    sortedData: sortedData.slice(0, 2) // Show first 2 items
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Always show as DD/MM/YYYY format
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {/* Header */}
       <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
         <div className="flex items-center space-x-3">
           <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
           
           {/* Load Icon Button - positioned after title */}
           {onLoad && (
             <button
               onClick={onLoad}
               disabled={isLoading}
               className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
               title={`Load New ${title}`}
             >
               {isLoading ? (
                 <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
               ) : (
                 <RefreshCw className="w-5 h-5" />
               )}
             </button>
           )}
         </div>
        
        <div className="flex items-center space-x-3">
          {/* Sort Dropdown */}
          <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 font-medium transition-colors"
          >
                         <span>Sort: {sortBy === 'date' ? 'Date (Newest)' : 'Saved'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
                                           {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-100">
                <button
                  onClick={() => {
                    setSortBy('date');
                    setShowSortDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    sortBy === 'date' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  }`}
                >
                  Date
                </button>

              <button
                onClick={() => {
                  setSortBy('saved');
                  setShowSortDropdown(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  sortBy === 'saved' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                Saved
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

             {/* Desktop Table */}
       <div className="hidden md:block overflow-x-auto">
         <table className="w-full">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Ideas
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Category
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Market Size
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Date
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Save
               </th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-100">
             {sortedData.map((item, index) => (
               <tr 
                 key={item.id} 
                 className="hover:bg-gray-50 transition-colors cursor-pointer"
                 onClick={() => onViewDetails(item)}
               >
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-gray-900 line-clamp-1">
                     {item.title}
                   </div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center space-x-2">
                     {getCategoryIcon(item.category)}
                     <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(item.category)}`}>
                       {item.category}
                     </span>
                   </div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center space-x-2">
                     {getMarketSizeIcon(item.market_size)}
                     <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getMarketSizeColor(item.market_size)}`}>
                       {Array.isArray(item.market_size) ? (item.market_size[0] || 'Unknown') : (item.market_size || 'Unknown')}
                     </span>
                   </div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {formatDate(item.dateGenerated)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onBookmarkToggle(item.id);
                     }}
                     className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                     title={item.isBookmarked ? "Unsave" : "Save"}
                   >
                     {item.isBookmarked ? (
                       <BookmarkCheck className="w-5 h-5 text-purple-600 fill-current" />
                     ) : (
                       <Bookmark className="w-5 h-5 text-purple-600 hover:text-purple-700 transition-colors" />
                     )}
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>

       {/* Mobile Cards */}
       <div className="md:hidden space-y-3">
         {sortedData.map((item, index) => (
           <div 
             key={item.id}
             className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
             onClick={() => onViewDetails(item)}
           >
             <div className="flex items-start justify-between mb-3">
               <div className="flex-1 min-w-0">
                 <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                   {item.title}
                 </h3>
                 <div className="flex items-center space-x-2 mb-2">
                   {getCategoryIcon(item.category)}
                   <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(item.category)}`}>
                     {item.category}
                   </span>
                 </div>
                 <div className="flex items-center space-x-2 mb-2">
                   {getMarketSizeIcon(item.market_size)}
                   <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getMarketSizeColor(item.market_size)}`}>
                     {Array.isArray(item.market_size) ? (item.market_size[0] || 'Unknown') : (item.market_size || 'Unknown')}
                   </span>
                 </div>
               </div>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   onBookmarkToggle(item.id);
                 }}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2 flex-shrink-0"
                 title={item.isBookmarked ? "Unsave" : "Save"}
               >
                 {item.isBookmarked ? (
                   <BookmarkCheck className="w-5 h-5 text-purple-600 fill-current" />
                 ) : (
                   <Bookmark className="w-5 h-5 text-gray-400 hover:text-purple-600 transition-colors" />
                 )}
               </button>
             </div>
             
             <div className="flex items-center justify-between text-xs text-gray-500">
               <span className="text-gray-400">{formatDate(item.dateGenerated)}</span>
             </div>
           </div>
         ))}
       </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {title === 'Case Studies' ? (
              <BookOpen className="w-8 h-8 text-gray-400" />
            ) : (
              <Lightbulb className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title === 'Case Studies' ? 'No case studies yet' : 'No content yet'}
          </h3>
          <p className="text-gray-500">
            {title === 'Case Studies' ? 'Start generating case studies to see them here' : 'Start generating ideas to see them here'}
          </p>
        </div>
      )}
    </div>
  );
}
