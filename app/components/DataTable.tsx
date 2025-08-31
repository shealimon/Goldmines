'use client';

import { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  MoreVertical, 
  Lightbulb, 
  Megaphone, 
  BookOpen,
  ChevronDown
} from 'lucide-react';

interface DataItem {
  id: number;
  title: string;
  niche: string;
  category: string;
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
}

const getNicheIcon = (niche: string) => {
  const lowerNiche = niche.toLowerCase();
  if (lowerNiche.includes('business') || lowerNiche.includes('startup') || lowerNiche.includes('saas')) {
    return <Lightbulb className="w-4 h-4 text-yellow-600" />;
  } else if (lowerNiche.includes('marketing') || lowerNiche.includes('advertising') || lowerNiche.includes('promotion')) {
    return <Megaphone className="w-4 h-4 text-blue-600" />;
  } else if (lowerNiche.includes('case study') || lowerNiche.includes('study') || lowerNiche.includes('analysis')) {
    return <BookOpen className="w-4 h-4 text-green-600" />;
  } else {
    return <Lightbulb className="w-4 h-4 text-gray-600" />;
  }
};

const getNicheColor = (niche: string) => {
  const lowerNiche = niche.toLowerCase();
  if (lowerNiche.includes('business') || lowerNiche.includes('startup') || lowerNiche.includes('saas')) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  } else if (lowerNiche.includes('marketing') || lowerNiche.includes('advertising') || lowerNiche.includes('promotion')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (lowerNiche.includes('case study') || lowerNiche.includes('study') || lowerNiche.includes('analysis')) {
    return 'bg-green-50 text-green-700 border-green-200';
  } else {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function DataTable({ data, onBookmarkToggle, onViewDetails, onDelete }: DataTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'popularity' | 'saved'>('popularity');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime();
      case 'popularity':
        return (b.reddit_score || 0) - (a.reddit_score || 0);
      case 'saved':
        return (b.isBookmarked ? 1 : 0) - (a.isBookmarked ? 1 : 0);
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // For older dates, show as DD/MM/YYYY format
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
         <h2 className="text-xl font-semibold text-gray-900">Business Ideas</h2>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 font-medium transition-colors"
          >
                         <span>Sort: {sortBy === 'date' ? 'Date (Newest)' : sortBy === 'popularity' ? 'Popularity' : 'Saved'}</span>
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
                  setSortBy('popularity');
                  setShowSortDropdown(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  sortBy === 'popularity' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                Popularity
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

             {/* Desktop Table */}
       <div className="hidden md:block overflow-x-auto">
         <table className="w-full">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Ideas
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Niche
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Like
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Comments
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
                     {getNicheIcon(item.niche)}
                     <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getNicheColor(item.niche)}`}>
                       {item.niche}
                     </span>
                   </div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {item.reddit_score ? (
                     <div className="flex items-center space-x-1 text-green-600">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                       </svg>
                       <span>{item.reddit_score.toLocaleString()}</span>
                     </div>
                   ) : (
                     <span className="text-gray-400">-</span>
                   )}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {item.reddit_comments ? (
                     <div className="flex items-center space-x-1 text-blue-600">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                       </svg>
                       <span>{item.reddit_comments.toLocaleString()}</span>
                     </div>
                   ) : (
                     <span className="text-gray-400">-</span>
                   )}
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
                       <Bookmark className="w-5 h-5 text-gray-400 hover:text-purple-600 transition-colors" />
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
                   {getNicheIcon(item.niche)}
                   <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getNicheColor(item.niche)}`}>
                     {item.niche}
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
               <div className="flex items-center space-x-4">
                 {item.reddit_score && (
                   <div className="flex items-center space-x-1 text-green-600">
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                     </svg>
                     <span>{item.reddit_score.toLocaleString()}</span>
                   </div>
                 )}
                 {item.reddit_comments && (
                   <div className="flex items-center space-x-1 text-blue-600">
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                     </svg>
                     <span>{item.reddit_comments.toLocaleString()}</span>
                   </div>
                 )}
               </div>
               <span className="text-gray-400">{formatDate(item.dateGenerated)}</span>
             </div>
           </div>
         ))}
       </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
          <p className="text-gray-500">Start generating ideas to see them here</p>
        </div>
      )}
    </div>
  );
}
