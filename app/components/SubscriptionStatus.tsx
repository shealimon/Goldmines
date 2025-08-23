'use client';

import { useUser } from '@/contexts/UserContext';
import { Crown, Zap, CreditCard, Calendar, Zap as Lightning, Infinity, AlertTriangle } from 'lucide-react';

export default function SubscriptionStatus() {
  const { profile, loading, isSubscriptionActive, canGenerateIdea, getUsagePercentage } = useUser();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'yearly': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'lifetime': return 'text-purple-600 bg-purple-100 border-purple-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'yearly': return <Crown className="w-4 h-4" />;
      case 'lifetime': return <Infinity className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const usagePercentage = getUsagePercentage();
  const isActive = isSubscriptionActive();
  const canGenerate = canGenerateIdea();

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border ${getStatusColor(profile.user_type)}`}>
          {getStatusIcon(profile.user_type)}
          {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
        </span>
      </div>

      {/* Subscription Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Active' : 'Expired'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Lightning className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Monthly Usage</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {profile.ideas_generated_this_month}
          </span>
          <span className="text-xs text-gray-500 block">
            of {profile.monthly_usage_limit === 999999 ? '∞' : profile.monthly_usage_limit}
          </span>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Total Generated</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {profile.total_ideas_generated}
          </span>
        </div>
      </div>

      {/* Usage Progress Bar for Free Users */}
      {profile.user_type === 'free' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Monthly Usage</span>
            <span>{Math.round(usagePercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercentage >= 80 ? 'bg-red-500' : 
                usagePercentage >= 60 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Member Since
          </span>
          <span className="font-medium">
            {new Date(profile.subscription_start_date).toLocaleDateString()}
          </span>
        </div>
        
        {profile.subscription_end_date && profile.user_type === 'yearly' && (
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-gray-600">Renews</span>
            <span className="font-medium">
              {new Date(profile.subscription_end_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Usage Status Messages */}
      {!canGenerate && profile.user_type === 'free' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">
              <strong>Monthly limit reached!</strong> Upgrade to continue generating ideas.
            </p>
          </div>
        </div>
      )}

      {profile.user_type === 'free' && canGenerate && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Free Plan:</strong> {profile.monthly_usage_limit - profile.ideas_generated_this_month} ideas remaining this month
          </p>
        </div>
      )}

      {profile.user_type === 'yearly' && !isActive && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">
            <strong>Subscription Expired</strong> - Renew to continue accessing unlimited ideas!
          </p>
        </div>
      )}
    </div>
  );
}
