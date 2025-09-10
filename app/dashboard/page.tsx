'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from '@/app/components/DataTable';
import { useUser } from '@/contexts/UserContext';
import { useNotification } from '@/app/components/NotificationProvider';
import { useRouter } from 'next/navigation'; // Added useRouter import
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/app/components/DashboardLayout';
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
  LogOut,
  Settings,
  Camera,
  Lock
} from 'lucide-react';

type TabType = 'dashboard' | 'business-ideas' | 'marketing-ideas' | 'case-studies' | 'saved-ideas' | 'settings';
type SettingsTabType = 'profile' | 'password' | 'notification' | 'billing';

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'in', label: 'India' },
  { value: 'br', label: 'Brazil' },
  { value: 'mx', label: 'Mexico' },
];

// Settings Content Component
function SettingsContent() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTabType>('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: 'Martin',
    lastName: 'Janiter',
    email: 'j.martin@gmail.com',
    bio: '',
    username: 'martin.janiter',
    website: 'postcrafts.co',
    jobTitle: 'Software Developer',
    showOnProfile: true,
    country: 'us'
  });

  const handleProfileChange = (field: string, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Profile updated:', profileData);
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Password updated');
    setLoading(false);
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notification', label: 'Notification', icon: Bell },
    { id: 'billing', label: 'Billing', icon: Settings },
  ] as const;

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your personal information and preferences.
        </p>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Profile Photo Section */}
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          <div className="flex space-x-3">
            <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Camera className="w-4 h-4 mr-2 inline" />
              Update
            </button>
            <button type="button" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Remove
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleProfileChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter first name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleProfileChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            placeholder="Enter email address"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Write Your Bio</label>
          <textarea
            value={profileData.bio}
            onChange={(e) => handleProfileChange('bio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 resize-none"
            placeholder="Write about you"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="text-xs text-gray-500">You can change it later</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">rareblocks.co/user/</span>
              </div>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => handleProfileChange('username', e.target.value)}
                className="w-full pl-32 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">https://</span>
              </div>
              <input
                type="text"
                value={profileData.website}
                onChange={(e) => handleProfileChange('website', e.target.value)}
                className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter website"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              value={profileData.jobTitle}
              onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter job title"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <select
              value={profileData.country}
              onChange={(e) => handleProfileChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            >
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              checked={profileData.showOnProfile}
              onChange={(e) => handleProfileChange('showOnProfile', e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
          </div>
          <div className="ml-3 text-sm">
            <label className="text-gray-700 cursor-pointer">
              Show this on my profile
            </label>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200 font-medium"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderPasswordTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Password</h2>
        <p className="text-sm text-gray-600 mt-1">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            placeholder="Enter current password"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            placeholder="Enter new password"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            placeholder="Confirm new password"
            required
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200 font-medium"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderNotificationTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-gray-700">New business ideas</label>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-gray-700">Marketing insights</label>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input type="checkbox" className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-gray-700">Account updates</label>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-gray-700">Weekly reports</label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input type="checkbox" className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-gray-700">Browser notifications</label>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-gray-700">Mobile notifications</label>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Billing Details</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your subscription and payment information.
        </p>
      </div>

      <div className="space-y-6">
        {/* Subscription Plan */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Subscription Plan</h3>
              <p className="text-sm text-gray-600">Pro Plan - Monthly</p>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              Cancel Subscription
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Your next payment is $20.00 USD, to be charged on January 15, 2024
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Your payment will be automatically renewed each month
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Method</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose your preferred payment method for making future payments
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-purple-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Visa ending 4331</p>
                  <p className="text-xs text-gray-500">Expiry 09/2024</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-purple-600 font-medium">Primary Card</span>
                <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
          
          <button className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            + Add New Payment Method
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-3">
              <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                <option>Sort by: Recent</option>
                <option>Sort by: Amount</option>
                <option>Sort by: Date</option>
              </select>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Export to CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Invoice</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 text-sm text-gray-900">Pro Plan - Dec 2023</td>
                  <td className="py-3 text-sm text-gray-600">15 December, 2023</td>
                  <td className="py-3 text-sm text-gray-900">$20.00</td>
                  <td className="py-3 text-sm">
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Complete
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-900">Pro Plan - Nov 2023</td>
                  <td className="py-3 text-sm text-gray-600">15 November, 2023</td>
                  <td className="py-3 text-sm text-gray-900">$20.00</td>
                  <td className="py-3 text-sm">
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Complete
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTabContent = () => {
    switch (activeSettingsTab) {
      case 'profile':
        return renderProfileTab();
      case 'password':
        return renderPasswordTab();
      case 'notification':
        return renderNotificationTab();
      case 'billing':
        return renderBillingTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id as SettingsTabType)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors duration-200
                  ${
                    activeSettingsTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Tab Content */}
      {renderSettingsTabContent()}
    </div>
  );
}

interface BusinessIdea {
  id: number;
  business_idea_name: string;
  opportunity_points: string[];
  problems_solved: string[];
  target_customers: string[];
  market_size: string[];
  niche: string;
  category: string;
  marketing_strategy: string[];
  full_analysis: string;
  created_at: string;
  
  // Premium fields
  problem_story?: string;
  solution_vision?: string;
  revenue_model?: string[];
  competitive_advantage?: string[];
  next_steps?: string[];
  
  // Reddit data (nested object)
  reddit_posts?: {
    reddit_title: string;
    reddit_author: string;
    reddit_subreddit: string;
    reddit_score: number;
    reddit_comments: number;
    reddit_url: string;
    reddit_permalink: string;
  };
}

export default function Dashboard() {
  const { user, profile, loading: authLoading, signOut } = useUser();
  const { showNotification } = useNotification();
  const router = useRouter(); // Added useRouter hook
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [businessIdeas, setBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<any>(null);
  const [showCaseStudyDetails, setShowCaseStudyDetails] = useState(false);
  const [caseStudyDetails, setCaseStudyDetails] = useState<any>(null);
  const [caseStudyDetailsLoading, setCaseStudyDetailsLoading] = useState(false);
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;
  
  // Marketing ideas state
  const [marketingIdeas, setMarketingIdeas] = useState<any[]>([]);
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingError, setMarketingError] = useState<string | null>(null);
  
  // Case studies state
  const [caseStudies, setCaseStudies] = useState<any[]>([]);
  const [caseStudyLoading, setCaseStudyLoading] = useState(false);
  const [caseStudyError, setCaseStudyError] = useState<string | null>(null);
  const [caseStudyBookmarked, setCaseStudyBookmarked] = useState<Set<number>>(new Set());
  const [generatingCaseStudy, setGeneratingCaseStudy] = useState(false);
  
  // Case studies pagination state
  const [caseStudyCurrentPage, setCaseStudyCurrentPage] = useState(1);
  const [caseStudyTotalPages, setCaseStudyTotalPages] = useState(1);
  const [caseStudyTotalCount, setCaseStudyTotalCount] = useState(0);
  const [marketingBookmarked, setMarketingBookmarked] = useState<Set<number>>(new Set());
  const [generatingMarketingIdea, setGeneratingMarketingIdea] = useState(false);
  
  // Marketing pagination state
  const [marketingCurrentPage, setMarketingCurrentPage] = useState(1);
  const [marketingTotalPages, setMarketingTotalPages] = useState(1);
  const [marketingTotalCount, setMarketingTotalCount] = useState(0);
  const marketingItemsPerPage = 50;

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

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🚫 No user found, redirecting to login');
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch dashboard data when component mounts or when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Fetch saved bookmarks when user changes
  useEffect(() => {
    fetchSavedBookmarks();
    fetchSavedMarketingBookmarks();
  }, [user?.id]);

  // Fetch business ideas when the business ideas tab is active - only once
  useEffect(() => {
    if (activeTab === 'business-ideas' && !hasAttemptedFetch && !loading) {
      setHasAttemptedFetch(true);
      fetchBusinessIdeas();
    }
  }, [activeTab, hasAttemptedFetch, loading]);

  // Fetch business ideas when page changes
  useEffect(() => {
    if (activeTab === 'business-ideas' && hasAttemptedFetch && !generatingIdea) {
      fetchBusinessIdeas(currentPage);
    }
  }, [currentPage, generatingIdea]);

  // Fetch marketing ideas when marketing tab is active
  useEffect(() => {
    if (activeTab === 'marketing-ideas' && marketingIdeas.length === 0 && !marketingLoading) {
      fetchMarketingIdeas();
    }
  }, [activeTab]);

  // Fetch marketing ideas when page changes
  useEffect(() => {
    if (activeTab === 'marketing-ideas' && marketingIdeas.length > 0) {
      fetchMarketingIdeas(marketingCurrentPage);
    }
  }, [marketingCurrentPage]);

  // Fetch case studies from Supabase
  const fetchCaseStudies = useCallback(async () => {
    console.log('🚀 Starting fetchCaseStudies...');
    setCaseStudyLoading(true);
    setCaseStudyError(null);
    
    try {
      console.log('📡 Fetching from Supabase...');
      const { data, error, count } = await supabase
        .from('case_studies')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(itemsPerPage)
        .range((caseStudyCurrentPage - 1) * itemsPerPage, caseStudyCurrentPage * itemsPerPage - 1);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Data received:', data?.length || 0, 'case studies');
      console.log('📊 Total count:', count);
      console.log('📊 Raw data:', data);
      
      setCaseStudies(data || []);
      setCaseStudyTotalCount(count || 0);
      setCaseStudyTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      console.log('📊 Case studies state updated:', data?.length || 0, 'items');
      
      // If no data, show the empty state
      if (!data || data.length === 0) {
        console.log('📭 No case studies found, showing empty state');
      }
    } catch (error) {
      console.error('❌ Error fetching case studies:', error);
      setCaseStudyError(error instanceof Error ? error.message : 'Failed to fetch case studies');
    } finally {
      console.log('🏁 Setting loading to false');
      setCaseStudyLoading(false);
    }
  }, [caseStudyCurrentPage, itemsPerPage]);

  // Fetch case studies when tab is active
  useEffect(() => {
    if (activeTab === 'case-studies') {
      console.log('🔄 Fetching case studies...');
      fetchCaseStudies();
    }
  }, [activeTab, fetchCaseStudies]);

  // Fetch case studies when page changes
  useEffect(() => {
    if (activeTab === 'case-studies' && caseStudyCurrentPage > 1) {
      console.log('🔄 Fetching case studies for page:', caseStudyCurrentPage);
      fetchCaseStudies();
    }
  }, [caseStudyCurrentPage, activeTab, fetchCaseStudies]);

  // Convert case studies to DataTable format
  const caseStudyTableData = useMemo(() => {
    const mappedData = caseStudies.map(study => ({
      id: study.id,
      title: study.title || 'Untitled Case Study',
      subtitle: study.subtitle || '',
      niche: study.category || 'Not Specified',
      category: study.category || 'Not Specified',
      market_size: [study.market_context || 'Not specified'],
      dateGenerated: study.created_at,
      slug: study.slug || '',
      current_revenue: study.current_revenue || 0,
      valuation: study.valuation || 0,
      users_count: study.users_count || 0,
      is_published: study.is_published || false,
      needs_review: study.needs_review || true,
      founder_name: study.founder_name || 'Not disclosed',
      app_name: study.app_name || study.title || 'Not disclosed',
      isBookmarked: caseStudyBookmarked.has(study.id)
    }));

    // Debug: Check for duplicate IDs
    const ids = mappedData.map(item => item.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.warn('⚠️ Duplicate case study IDs detected:', ids);
    }

    return mappedData;
  }, [caseStudies, caseStudyBookmarked]);

  // Convert business ideas to DataTable format
  const tableData = useMemo(() => {
    return businessIdeas.map(idea => ({
    id: idea.id,
    title: idea.business_idea_name || idea.reddit_posts?.reddit_title || 'Untitled Business Idea',
    niche: idea.niche || 'Not Specified',
    category: idea.category || 'General',
    market_size: idea.market_size || ['Unknown'],
    dateGenerated: idea.created_at,
    isBookmarked: bookmarkedIdeas.has(idea.id),
    reddit_score: idea.reddit_posts?.reddit_score || 0,
    reddit_comments: idea.reddit_posts?.reddit_comments || 0
  }));
  }, [businessIdeas, bookmarkedIdeas]);

  // Convert marketing ideas to DataTable format
  const marketingTableData = useMemo(() => {
    console.log('🔖 Creating marketing table data...');
    console.log('🔖 Marketing ideas count:', marketingIdeas.length);
    console.log('🔖 Marketing bookmarked set:', Array.from(marketingBookmarked));
    
    return marketingIdeas.map(idea => {
      const isBookmarked = marketingBookmarked.has(idea.id);
      console.log(`🔖 Idea ${idea.id} (${idea.marketing_idea_name}): isBookmarked = ${isBookmarked}`);
      
      return {
        id: idea.id,
        title: idea.marketing_idea_name || 'Untitled Marketing Idea',
        niche: idea.channel?.join(', ') || 'Not Specified',
        category: idea.channel?.join(', ') || 'General',
        market_size: idea.target_audience || ['Unknown'],
        dateGenerated: idea.created_at,
        isBookmarked: isBookmarked,
        potential_impact: idea.potential_impact || 'Unknown',
        implementation_tips: idea.implementation_tips || [],
        success_metrics: idea.success_metrics || []
      };
    });
  }, [marketingIdeas, marketingBookmarked]);

  // Generate new case study from CSV
  const generateNewCaseStudy = async () => {
    setGeneratingCaseStudy(true);
    showNotification('Starting case study generation...', 'info');
    try {
      // Read the CSV file
      const csvResponse = await fetch('/sample-companies.csv');
      const csvText = await csvResponse.text();
      
      // Parse CSV and get a random company
      const lines = csvText.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const companies = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const company: any = {};
        headers.forEach((header, index) => {
          company[header] = values[index] || '';
        });
        return company;
      });
      
      // Get a random company
      const randomCompany = companies[Math.floor(Math.random() * companies.length)];
      console.log('🎲 Selected random company:', randomCompany);
      
      // Generate case study
      const response = await fetch('/api/case-studies/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_name: randomCompany.founder_name || 'Unknown Founder',
          company_name: randomCompany.company_name || 'Unknown Company',
          image_url: randomCompany.logo_url || null,
          cofounders: randomCompany.cofounders ? randomCompany.cofounders.split(',').map((c: string) => c.trim()) : []
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate case study');
      }
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Case study generated successfully!', 'success');
        // Refresh the case studies list
        fetchCaseStudies();
      } else {
        throw new Error(result.message || 'Failed to generate case study');
      }
    } catch (error) {
      console.error('Error generating case study:', error);
      showNotification('Failed to generate case study. Please try again.', 'error');
    } finally {
      setGeneratingCaseStudy(false);
    }
  };

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

  // Handle case study bookmark toggle
  const handleCaseStudyBookmarkToggle = async (id: number) => {
    // Implementation for case study bookmarking
    console.log('Toggle case study bookmark:', id);
  };

  const fetchBusinessIdeas = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/business-ideas?page=${page}&limit=${itemsPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        setBusinessIdeas(data.business_ideas || []);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
        console.log('✅ Business ideas fetched:', data.business_ideas?.length || 0, 'of', data.count || 0);
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

  const fetchMarketingIdeas = async (page: number = marketingCurrentPage) => {
    setMarketingLoading(true);
    setMarketingError(null);
    
    try {
      const response = await fetch(`/api/marketing-ideas?page=${page}&limit=${marketingItemsPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        setMarketingIdeas(data.marketing_ideas || []);
        setMarketingTotalCount(data.count || 0);
        setMarketingTotalPages(Math.ceil((data.count || 0) / marketingItemsPerPage));
        console.log('✅ Marketing ideas fetched:', data.marketing_ideas?.length || 0, 'of', data.count || 0);
        
        // Fetch saved bookmarks after loading marketing ideas
        await fetchSavedMarketingBookmarks();
      } else {
        setMarketingError(data.message || 'Failed to fetch marketing ideas');
        console.error('❌ Marketing API error:', data.message);
      }
    } catch (err) {
      setMarketingError('Failed to fetch marketing ideas');
      console.error('❌ Marketing fetch error:', err);
    } finally {
      setMarketingLoading(false);
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

  // Fetch saved bookmarks
  const fetchSavedBookmarks = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/saved?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        const businessSavedIds = data.saved_items
          .filter((item: any) => item.item_type === 'business')
          .map((item: any) => item.id);
        setBookmarkedIdeas(new Set(businessSavedIds));
      }
    } catch (err) {
      console.error('Error fetching saved bookmarks:', err);
    }
  };

  const fetchSavedMarketingBookmarks = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/saved?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        const marketingSavedIds = data.saved_items
          .filter((item: any) => item.item_type === 'marketing')
          .map((item: any) => item.item_id); // Use item_id, not id
        setMarketingBookmarked(new Set(marketingSavedIds));
        console.log('🔖 Loaded marketing bookmarks:', marketingSavedIds);
      }
    } catch (err) {
      console.error('Error fetching saved marketing bookmarks:', err);
    }
  };

  const handleBookmarkToggle = async (id: number) => {
    if (!user?.id) {
      showNotification('Please log in to save bookmarks', 'error');
      return;
    }
    
    const isBookmarked = bookmarkedIdeas.has(id);
    
    try {
      const response = await fetch('/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          item_type: 'business',
          item_id: id,
          action: isBookmarked ? 'remove' : 'save'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show notification BEFORE updating state
        if (isBookmarked) {
          showNotification('Bookmark removed successfully!', 'success');
        } else {
          showNotification('Bookmark saved successfully!', 'success');
        }
        
        // Update state after showing notification
    setBookmarkedIdeas(prev => {
      const newSet = new Set(prev);
          if (isBookmarked) {
      if (newSet.has(id)) {
        newSet.delete(id);
            }
      } else {
            if (!newSet.has(id)) {
        newSet.add(id);
            }
      }
      return newSet;
    });
      } else {
        showNotification(data.message || 'Failed to save bookmark', 'error');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      showNotification('Failed to save bookmark. Please try again.', 'error');
    }
  };

  const handleMarketingBookmarkToggle = async (id: number) => {
    if (!user?.id) {
      showNotification('Please log in to save bookmarks', 'error');
      return;
    }
    
    const isBookmarked = marketingBookmarked.has(id);
    
    try {
      const response = await fetch('/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          item_type: 'marketing',
          item_id: id,
          action: isBookmarked ? 'remove' : 'save'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show notification BEFORE updating state
        if (isBookmarked) {
          showNotification('Marketing idea bookmark removed successfully!', 'success');
        } else {
          showNotification('Marketing idea saved successfully!', 'success');
        }
        
        // Update state after showing notification
        setMarketingBookmarked(prev => {
          const newSet = new Set(prev);
          if (isBookmarked) {
            if (newSet.has(id)) {
              newSet.delete(id);
            }
          } else {
            if (!newSet.has(id)) {
              newSet.add(id);
            }
          }
          return newSet;
        });
      } else if (data.message === 'Item already saved') {
        // Item is already saved, update UI to show it as bookmarked
        console.log('🔖 Item already saved, updating UI to show as bookmarked');
        setMarketingBookmarked(prev => {
          const newSet = new Set(prev);
          if (!newSet.has(id)) {
            newSet.add(id);
          }
          return newSet;
        });
        showNotification('Marketing idea is already in your collection', 'info');
      } else {
        showNotification(data.message || 'Failed to save bookmark', 'error');
      }
    } catch (err) {
      console.error('Error toggling marketing bookmark:', err);
      showNotification('Failed to save bookmark. Please try again.', 'error');
    }
  };

  // Fetch case study details for inline view
  const fetchCaseStudyDetails = async (slug: string) => {
    try {
      setCaseStudyDetailsLoading(true);
      console.log('🔍 Fetching case study details for slug:', slug);
      
      // Fetch main case study data with all related data in one query
      const { data: caseStudyData, error: caseStudyError } = await supabase
        .from('case_studies')
        .select(`
          *,
          case_study_sections (*),
          case_study_funding (*),
          case_study_quotes (*)
        `)
        .eq('slug', slug)
        .single();

      if (caseStudyError) {
        console.error('❌ Error fetching case study:', caseStudyError);
        throw caseStudyError;
      }
      
      if (!caseStudyData) {
        console.error('❌ Case study not found for slug:', slug);
        throw new Error('Case study not found');
      }

      console.log('✅ Case study data fetched:', {
        id: caseStudyData.id,
        title: caseStudyData.title,
        sectionsCount: caseStudyData.case_study_sections?.length || 0,
        fundingCount: caseStudyData.case_study_funding?.length || 0,
        quotesCount: caseStudyData.case_study_quotes?.length || 0,
        current_revenue: caseStudyData.current_revenue,
        valuation: caseStudyData.valuation,
        users_count: caseStudyData.users_count,
        starting_income: caseStudyData.starting_income,
        founder_name: caseStudyData.founder_name,
        app_name: caseStudyData.app_name,
        category: caseStudyData.category,
        market_context: caseStudyData.market_context,
        company_url: caseStudyData.company_url,
        raw_output: caseStudyData.raw_output
      });

      // Transform the data to match expected structure
      const transformedData = {
        ...caseStudyData,
        // Use raw_output data as fallback if main fields are empty
        current_revenue: caseStudyData.current_revenue || caseStudyData.raw_output?.current_revenue || 'Not disclosed',
        valuation: caseStudyData.valuation || caseStudyData.raw_output?.valuation || 'Not disclosed',
        starting_income: caseStudyData.starting_income || caseStudyData.raw_output?.starting_income || 'Not disclosed',
        users_count: caseStudyData.users_count || caseStudyData.raw_output?.users_count || null,
        founder_name: caseStudyData.founder_name || caseStudyData.raw_output?.founder_name || 'Not disclosed',
        app_name: caseStudyData.app_name || caseStudyData.raw_output?.title || caseStudyData.title || 'Not disclosed',
        category: caseStudyData.category || caseStudyData.raw_output?.category || 'Not specified',
        market_context: caseStudyData.market_context || caseStudyData.raw_output?.market_context || 'Not specified',
        company_url: caseStudyData.company_url || caseStudyData.raw_output?.company_url || null,
        sections: (caseStudyData.case_study_sections || []).map((section: any) => ({
          name: section.name,
          emoji: section.emoji,
          heading: section.heading,
          body: section.body
        })),
        funding: (caseStudyData.case_study_funding || []).map((funding: any) => ({
          round: funding.round_name,
          amount: funding.amount,
          date: funding.raised_at,
          investors: funding.investors || [],
          source: funding.source
        })),
        quotes: (caseStudyData.case_study_quotes || []).map((quote: any) => ({
          who: quote.who,
          quote: quote.quote
        }))
      };

      setCaseStudyDetails(transformedData);
      console.log('✅ Case study details set successfully:', {
        title: transformedData.title,
        current_revenue: transformedData.current_revenue,
        valuation: transformedData.valuation,
        users_count: transformedData.users_count,
        starting_income: transformedData.starting_income,
        founder_name: transformedData.founder_name,
        app_name: transformedData.app_name,
        category: transformedData.category,
        market_context: transformedData.market_context,
        company_url: transformedData.company_url
      });

    } catch (error) {
      console.error('❌ Error fetching case study details:', error);
      showNotification('Failed to load case study details', 'error');
    } finally {
      setCaseStudyDetailsLoading(false);
    }
  };

  const handleViewDetails = async (item: any) => {
    // Check if this is a case study (has slug property)
    if (item.slug) {
      // Show case study details inline and fetch details
      setSelectedCaseStudy(item);
      setShowCaseStudyDetails(true);
      await fetchCaseStudyDetails(item.slug);
      return;
    }
    
    // Find the business idea and show details modal
    const idea = businessIdeas.find(bi => bi.id === item.id);
    if (idea) {
      setSelectedIdea(idea);
      setShowIdeaModal(true);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Marketing pagination handlers
  const handleMarketingPageChange = (page: number) => {
    if (page >= 1 && page <= marketingTotalPages) {
      setMarketingCurrentPage(page);
    }
  };

  const handleMarketingPreviousPage = () => {
    if (marketingCurrentPage > 1) {
      setMarketingCurrentPage(marketingCurrentPage - 1);
    }
  };

  const handleMarketingNextPage = () => {
    if (marketingCurrentPage < marketingTotalPages) {
      setMarketingCurrentPage(marketingCurrentPage + 1);
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


  const generateNewIdea = async () => {
    console.log('🚀 generateNewIdea function called');
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
        console.log('✅ API call successful, refreshing data...');
        // Refresh data - go to first page to show new ideas
        setCurrentPage(1);
        
        // Wait a bit before showing notification to ensure data is loaded
        setTimeout(() => {
          console.log('📢 Showing success notification...');
          showNotification(`Successfully analyzed and saved ${data.business_ideas_saved || 0} new business ideas!`, 'success');
        }, 1000);
        
        // Fetch data in background
        await fetchBusinessIdeas(1);
        await fetchDashboardData();
        
        console.log('✅ generateNewIdea completed successfully');
      } else {
        console.log('❌ API call failed:', data.message);
        showNotification(data.message || 'Failed to generate new business ideas', 'error');
      }
      
    } catch (err) {
      console.error('❌ Error generating ideas:', err);
      showNotification('Failed to generate new business ideas. Please try again.', 'error');
    } finally {
      console.log('🏁 Setting generatingIdea to false');
      setGeneratingIdea(false);
    }
  };

  const generateNewMarketingIdea = async () => {
    setGeneratingMarketingIdea(true);
    try {
      console.log('🚀 Starting to generate new marketing ideas...');
      
      // Call marketing ideas API endpoint
      console.log('📡 Making API call to /api/marketing-ideas...');
      const response = await fetch('/api/marketing-ideas', {
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
        // Refresh marketing ideas data - go to first page to show new ideas
        setMarketingCurrentPage(1);
        await fetchMarketingIdeas(1);
        await fetchDashboardData();
        
        showNotification(`Successfully analyzed and saved ${data.marketing_ideas_saved || 0} new marketing ideas!`, 'success');
      } else {
        showNotification(data.message || 'Failed to generate new marketing ideas', 'error');
      }
    } catch (err) {
      console.error('❌ Error generating marketing ideas:', err);
      showNotification('Failed to generate new marketing ideas. Please try again.', 'error');
    } finally {
      setGeneratingMarketingIdea(false);
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
    { id: 'settings', label: 'Settings', icon: Settings, active: activeTab === 'settings' }
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
                        <p className="text-xs text-gray-500">{idea.business_idea_name || idea.reddit_posts?.reddit_title}</p>
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
                  onClick={() => fetchBusinessIdeas()}
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
              <>
              <DataTable
                  key={`datatable-${bookmarkedIdeas.size}`}
                data={tableData}
                onBookmarkToggle={handleBookmarkToggle}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
                  onLoad={generateNewIdea}
                  isLoading={generatingIdea}
                  title="Business Ideas"
                />
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} business ideas
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-purple-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Next Button */}
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'marketing-ideas':
        return (
          <div className="space-y-6">
            {/* Loading State */}
            {marketingLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading marketing ideas...</span>
              </div>
            )}

            {/* Error State */}
            {marketingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
            </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading marketing ideas</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{marketingError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!marketingLoading && !marketingError && marketingIdeas.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Marketing Ideas Yet</h2>
                <p className="text-gray-600 mb-6">Generate your first marketing strategy to get started.</p>
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                  Generate Your First Strategy
                </button>
            </div>
            )}

            {/* Data Table */}
            {!marketingLoading && !marketingError && marketingIdeas.length > 0 && (
              <>
                <DataTable
                  key={`marketing-datatable-${marketingBookmarked.size}`}
                  data={marketingTableData}
                  onBookmarkToggle={handleMarketingBookmarkToggle}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDelete}
                  title="Marketing Ideas"
                  onLoad={generateNewMarketingIdea}
                  isLoading={generatingMarketingIdea}
                />
                
                {/* Pagination */}
                {marketingTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {((marketingCurrentPage - 1) * marketingItemsPerPage) + 1} to {Math.min(marketingCurrentPage * marketingItemsPerPage, marketingTotalCount)} of {marketingTotalCount} marketing ideas
          </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={handleMarketingPreviousPage}
                        disabled={marketingCurrentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, marketingTotalPages) }, (_, i) => {
                          let pageNum;
                          if (marketingTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (marketingCurrentPage <= 3) {
                            pageNum = i + 1;
                          } else if (marketingCurrentPage >= marketingTotalPages - 2) {
                            pageNum = marketingTotalPages - 4 + i;
                          } else {
                            pageNum = marketingCurrentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handleMarketingPageChange(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                marketingCurrentPage === pageNum
                                  ? 'bg-purple-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Next Button */}
                      <button
                        onClick={handleMarketingNextPage}
                        disabled={marketingCurrentPage === marketingTotalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'case-studies':
        return (
          <div className="space-y-6">
            {/* Loading State */}
            {caseStudyLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading case studies...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
              </div>
            )}

            {/* Error State */}
            {caseStudyError && !caseStudyLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">Error Loading Case Studies</h2>
                <p className="text-red-600 mb-4">{caseStudyError}</p>
                <button 
                  onClick={() => fetchCaseStudies()}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Case Studies Content */}
            {!caseStudyLoading && !caseStudyError && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Case Studies</h2>
                    <p className="text-gray-600 mt-1">Learn from successful business stories</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {showCaseStudyDetails && (
                      <button
                        onClick={() => {
                          setShowCaseStudyDetails(false);
                          setSelectedCaseStudy(null);
                          setCaseStudyDetails(null);
                        }}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to List
                      </button>
                    )}
                    <button
                      onClick={generateNewCaseStudy}
                      disabled={generatingCaseStudy}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {generatingCaseStudy ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Load Case Studies
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Case Study Details View */}
                {showCaseStudyDetails && selectedCaseStudy && (
                  <div className="space-y-8">

                    {/* Header Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          {/* Company Name with Logo */}
                          <div className="flex items-center mb-6">
                            {caseStudyDetails?.cover_image_url || selectedCaseStudy.cover_image_url ? (
                              <div className="w-16 h-16 rounded-xl overflow-hidden mr-4 flex-shrink-0">
                                <img 
                                  src={caseStudyDetails?.cover_image_url || selectedCaseStudy.cover_image_url} 
                                  alt={`${caseStudyDetails?.app_name || selectedCaseStudy.app_name} logo`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                <span className="text-white font-bold text-xl">
                                  {(caseStudyDetails?.app_name || selectedCaseStudy.app_name || 'C').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">
                                {caseStudyDetails?.app_name || selectedCaseStudy.app_name || 'Company Name'}
                              </h2>
                            </div>
                          </div>

                          {/* Inspiring Journey Title */}
                          <h1 className="text-4xl font-bold text-gray-900 mb-3">
                            {caseStudyDetails?.title || selectedCaseStudy.title || `The Inspiring Journey of ${caseStudyDetails?.app_name || selectedCaseStudy.app_name}`}
                          </h1>
                          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                            {caseStudyDetails?.subtitle || selectedCaseStudy.subtitle || `How ${caseStudyDetails?.founder_name || selectedCaseStudy.founder_name || 'the founder'} turned a vision into a groundbreaking company`}
                          </p>
                        </div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {caseStudyDetails?.current_revenue || selectedCaseStudy.current_revenue || selectedCaseStudy.raw_output?.current_revenue || 'Not disclosed'}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">Annual Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {caseStudyDetails?.valuation || selectedCaseStudy.valuation || selectedCaseStudy.raw_output?.valuation || 'Not disclosed'}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">Company Valuation</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {caseStudyDetails?.users_count ? caseStudyDetails.users_count.toLocaleString() : 
                             selectedCaseStudy.users_count ? selectedCaseStudy.users_count.toLocaleString() : 
                             selectedCaseStudy.raw_output?.users_count ? selectedCaseStudy.raw_output.users_count.toLocaleString() : 'Not disclosed'}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">Active Users</div>
                        </div>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500 block mb-1">App Name</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {caseStudyDetails?.app_name || selectedCaseStudy.app_name || selectedCaseStudy.raw_output?.title || selectedCaseStudy.title || 'Not disclosed'}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 block mb-1">Founder</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {caseStudyDetails?.founder_name || selectedCaseStudy.founder_name || 'Not disclosed'}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 block mb-1">Category</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {caseStudyDetails?.category || selectedCaseStudy.category || selectedCaseStudy.raw_output?.category || 'Not specified'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500 block mb-1">Market Context</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {caseStudyDetails?.market_context || selectedCaseStudy.market_context || 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 block mb-1">Created</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {caseStudyDetails?.created_at ? new Date(caseStudyDetails.created_at).toLocaleDateString() : 
                               selectedCaseStudy.created_at ? new Date(selectedCaseStudy.created_at).toLocaleDateString() : 'Not available'}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 block mb-1">Company URL</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {caseStudyDetails?.company_url || selectedCaseStudy.company_url || selectedCaseStudy.raw_output?.company_url ? (
                                <a href={caseStudyDetails?.company_url || selectedCaseStudy.company_url || selectedCaseStudy.raw_output?.company_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                  Visit Website
                                </a>
                              ) : 'Not available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {caseStudyDetailsLoading ? (
                      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading case study details...</p>
                      </div>
                    ) : caseStudyDetails ? (
                      <div className="space-y-8">
                        {caseStudyDetails.sections && caseStudyDetails.sections.length > 0 && (
                          <div className="space-y-8">
                            {caseStudyDetails.sections.map((section: any, index: number) => (
                              <div key={index} className="bg-white rounded-xl border border-gray-200 p-8">
                                <div className="flex items-start mb-6">
                                  <div className="text-4xl mr-4 flex-shrink-0">{section.emoji}</div>
                                  <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                      {section.heading}
                                    </h3>
                                    <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
                                  </div>
                                </div>
                                <div className="prose prose-lg max-w-none">
                                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                                    {section.body}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Funding Information */}
                        {caseStudyDetails.funding && caseStudyDetails.funding.length > 0 && (
                          <div className="bg-white rounded-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Funding History</h2>
                            <div className="space-y-4">
                              {caseStudyDetails.funding.map((funding: any, index: number) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{funding.round}</h4>
                                      <p className="text-sm text-gray-600">{funding.source}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-gray-900">{funding.amount || 'Amount not disclosed'}</p>
                                      <p className="text-sm text-gray-600">{funding.date || 'Date not available'}</p>
                                    </div>
                                  </div>
                                  {funding.investors && funding.investors.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-sm text-gray-600">
                                        <strong>Investors:</strong> {funding.investors.join(', ')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quotes Section */}
                        {caseStudyDetails.quotes && caseStudyDetails.quotes.length > 0 && (
                          <div className="bg-white rounded-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Founder Quotes</h2>
                            <div className="space-y-6">
                              {caseStudyDetails.quotes.map((quote: any, index: number) => (
                                <div key={index} className="border-l-4 border-purple-500 pl-6">
                                  <blockquote className="text-lg text-gray-700 italic mb-2">
                                    "{quote.quote}"
                                  </blockquote>
                                  <cite className="text-sm text-gray-600 font-medium">
                                    — {quote.who}
                                  </cite>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load case study details</h3>
                        <p className="text-gray-500 mb-4">Unable to load detailed information for this case study.</p>
                        <button
                          onClick={() => {
                            if (selectedCaseStudy?.slug) {
                              fetchCaseStudyDetails(selectedCaseStudy.slug);
                            }
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Case Studies Grid */}
                {!showCaseStudyDetails && (
                  <>
                    {caseStudyTableData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {caseStudyTableData.map((study, index) => (
                          <div
                            key={`${study.id}-${study.slug}-${index}`}
                            className="bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer group h-full flex flex-col"
                            onClick={() => handleViewDetails({ id: study.id, slug: study.slug })}
                          >
                            <div className="p-6 flex flex-col h-full text-left">
                              <div className="mb-4">
                                <h2 className="text-lg text-gray-900 group-hover:text-gray-700 transition-colors">
                                  {study.app_name}
                                </h2>
                              </div>
                              <div className="flex-1 flex flex-col justify-center mb-6">
                                <h3 className="text-base text-gray-800 group-hover:text-gray-600 transition-colors mb-2 line-clamp-2">
                                  {study.subtitle || study.title}
                                </h3>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <div className="text-gray-500">
                                    <span className="block text-xs text-gray-400 mb-1">Yearly Revenue</span>
                                    <span className="text-gray-900">{study.current_revenue || 'Not disclosed'}</span>
                                  </div>
                                  <div className="text-gray-500">
                                    <span className="block text-xs text-gray-400 mb-1">Valuation</span>
                                    <span className="text-gray-900">{study.valuation || 'Not disclosed'}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="text-left">
                                    <span className="block text-xs text-gray-400 mb-1">Founder</span>
                                    <span className="text-sm text-gray-700">{study.founder_name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-xs text-gray-400 mb-1">Category</span>
                                    <span className="text-sm text-gray-700">{study.niche}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No case studies yet</h3>
                        <p className="text-gray-500 mb-4">Click "Load Case Studies" to generate some inspiring business stories</p>
                      </div>
                    )}

                    {/* Pagination */}
                    {caseStudyTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-600">
                          Showing {((caseStudyCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(caseStudyCurrentPage * itemsPerPage, caseStudyTotalCount)} of {caseStudyTotalCount} case studies
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCaseStudyCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={caseStudyCurrentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, caseStudyTotalPages) }, (_, i) => {
                              let pageNum;
                              if (caseStudyTotalPages <= 5) {
                                pageNum = i + 1;
                              } else if (caseStudyCurrentPage <= 3) {
                                pageNum = i + 1;
                              } else if (caseStudyCurrentPage >= caseStudyTotalPages - 2) {
                                pageNum = caseStudyTotalPages - 4 + i;
                              } else {
                                pageNum = caseStudyCurrentPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCaseStudyCurrentPage(pageNum)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    caseStudyCurrentPage === pageNum
                                      ? 'bg-purple-600 text-white'
                                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setCaseStudyCurrentPage(prev => Math.min(prev + 1, caseStudyTotalPages))}
                            disabled={caseStudyCurrentPage === caseStudyTotalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
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

      case 'settings':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            
            {/* Settings Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <SettingsContent />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* OLD SIDEBAR - Active sidebar (always visible) */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40 flex flex-col transform transition-transform duration-300 ease-in-out ${
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

           {/* Right side: Toggle Button, Notifications & User Profile */}
           <div className="flex items-center space-x-4">
             
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
                   <button 
                     onClick={() => {
                       setShowUserDropdown(false);
                       router.push('/settings');
                     }}
                     className="flex items-center space-x-2 w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
                   >
                     <Settings className="w-4 h-4" />
                     <span>Settings</span>
                   </button>
                   <button 
                     onClick={() => {
                       setShowUserDropdown(false);
                       setSigningOut(true);
                       signOut();
                     }}
                     className="flex items-center space-x-2 w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
                   >
                     <LogOut className="w-4 h-4" />
                     <span>Sign Out</span>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl p-6 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                    {selectedIdea.business_idea_name || selectedIdea.reddit_posts?.reddit_title}
                  </h1>
                  <div className="flex items-center space-x-4 text-white/80 text-sm">
                    {selectedIdea.category && (
                      <span className="bg-white/20 px-3 py-1 rounded-full font-medium">
                        {selectedIdea.category}
                      </span>
                    )}
                    {selectedIdea.niche && (
                      <span className="bg-white/20 px-3 py-1 rounded-full font-medium">
                        {selectedIdea.niche}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setShowIdeaModal(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 ml-4"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Problem Story */}
              {selectedIdea.problem_story && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400 rounded-r-xl p-8 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Problem Story</h3>
                      <p className="text-gray-700 leading-relaxed text-base">{selectedIdea.problem_story}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Solution Vision */}
              {selectedIdea.solution_vision && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400 rounded-r-xl p-8 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Solution Vision</h3>
                      <p className="text-gray-700 leading-relaxed text-base">{selectedIdea.solution_vision}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Target Customers */}
                  {selectedIdea.target_customers && selectedIdea.target_customers.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Target Customers</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedIdea.target_customers.map((customer, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 leading-relaxed">{customer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue Model */}
                  {selectedIdea.revenue_model && selectedIdea.revenue_model.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Revenue Model</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedIdea.revenue_model.map((model, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 leading-relaxed">{model}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Market Size */}
                  {selectedIdea.market_size && selectedIdea.market_size.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Market Size</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedIdea.market_size.map((size, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 leading-relaxed">{size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Niche */}
                  {selectedIdea.niche && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Niche</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{selectedIdea.niche}</p>
                    </div>
                  )}

                  {/* Category */}
                  {selectedIdea.category && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Category</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{selectedIdea.category}</p>
                    </div>
                  )}

                  {/* Competitive Advantage */}
                  {selectedIdea.competitive_advantage && selectedIdea.competitive_advantage.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Competitive Advantage</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedIdea.competitive_advantage.map((advantage, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 leading-relaxed">{advantage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Marketing Strategy - Full Width */}
              {selectedIdea.marketing_strategy && selectedIdea.marketing_strategy.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Marketing Strategy</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedIdea.marketing_strategy.map((strategy, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 leading-relaxed">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps - Full Width */}
              {selectedIdea.next_steps && selectedIdea.next_steps.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Next Steps</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedIdea.next_steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-100">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* Action Footer */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <a 
                    href={selectedIdea.reddit_posts?.reddit_url || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => {
                      console.log('Reddit button clicked:', {
                        reddit_url: selectedIdea.reddit_posts?.reddit_url,
                        full_idea: selectedIdea
                      });
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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

