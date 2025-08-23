'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { CheckCircle, XCircle, Clock, Crown, Star } from 'lucide-react';

export default function SubscriptionStatus() {
  const { profile, isSubscriptionActive, canGenerateIdea } = useUser();
  const [loading, setLoading] = useState(false);

  if (!profile) return null;

  const canGenerate = isSubscriptionActive();
  const isActive = isSubscriptionActive();

  const getStatusColor = (role: string) => {
    switch (role) {
      case 'ultimate':
        return 'border-purple-500 bg-purple-50 text-purple-700';
      case 'pro':
        return 'border-green-500 bg-green-50 text-green-700';
      case 'trial':
        return 'border-orange-500 bg-orange-50 text-orange-700';
      default:
        return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  const getStatusIcon = (role: string) => {
    switch (role) {
      case 'ultimate':
        return <Crown className="w-4 h-4" />;
      case 'pro':
        return <Star className="w-4 h-4" />;
      case 'trial':
        return <Clock className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border ${getStatusColor(profile.role)}`}>
          {getStatusIcon(profile.role)}
          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Subscription Status</span>
          <span className={`flex items-center gap-2 ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            {isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Idea Generation</span>
          <span className={`flex items-center gap-2 ${canGenerate ? 'text-green-600' : 'text-red-600'}`}>
            {canGenerate ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {canGenerate ? 'Available' : 'Limited'}
          </span>
        </div>

        {profile.role === 'trial' && profile.trial_expires_at && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Trial Expires</span>
            <span className="text-orange-600">
              {new Date(profile.trial_expires_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {profile.role === 'trial' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Trial Account</h4>
            <p className="text-orange-700 text-sm">
              You're currently on a trial. Upgrade to Pro or Ultimate for unlimited access.
            </p>
          </div>
        )}

        {profile.role === 'pro' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Pro Plan Active</h4>
            <p className="text-green-700 text-sm">
              You have access to all features with your Pro subscription.
            </p>
          </div>
        )}

        {profile.role === 'ultimate' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">Ultimate Plan Active</h4>
            <p className="text-purple-700 text-sm">
              You have unlimited access to all premium features.
            </p>
          </div>
        )}

        {!canGenerate && profile.role === 'trial' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Trial Expired</h4>
            <p className="text-red-700 text-sm">
              Your trial has expired. Upgrade to continue using the service.
            </p>
          </div>
        )}

        {profile.role === 'trial' && canGenerate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Upgrade Available</h4>
            <p className="text-blue-700 text-sm">
              Upgrade to Pro or Ultimate for unlimited access and premium features.
            </p>
          </div>
        )}

        {profile.role === 'pro' && !isActive && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Subscription Expired</h4>
            <p className="text-red-700 text-sm">
              Your Pro subscription has expired. Renew to continue access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
