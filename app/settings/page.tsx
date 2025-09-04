'use client';

import React, { useState } from 'react';
import { User, Lock, Bell, CreditCard, Camera, Upload } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Checkbox } from '../components/ui/Checkbox';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

type TabType = 'profile' | 'password' | 'notification' | 'billing';

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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notification', label: 'Notification', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ] as const;

  const renderProfileTab = () => (
    <div className="space-y-8">
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
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Update
            </Button>
            <Button variant="secondary" size="sm">
              Remove
            </Button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            value={profileData.firstName}
            onChange={(e) => handleProfileChange('firstName', e.target.value)}
            placeholder="Enter first name"
          />
          <Input
            label="Last Name"
            value={profileData.lastName}
            onChange={(e) => handleProfileChange('lastName', e.target.value)}
            placeholder="Enter last name"
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          value={profileData.email}
          onChange={(e) => handleProfileChange('email', e.target.value)}
          placeholder="Enter email address"
        />

        <Textarea
          label="Write Your Bio"
          value={profileData.bio}
          onChange={(e) => handleProfileChange('bio', e.target.value)}
          placeholder="Write about you"
          rows={4}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Username"
            hint="You can change it later"
            prefix="rareblocks.co/user/"
            value={profileData.username}
            onChange={(e) => handleProfileChange('username', e.target.value)}
            placeholder="Enter username"
          />
          <Input
            label="Website"
            prefix="https://"
            value={profileData.website}
            onChange={(e) => handleProfileChange('website', e.target.value)}
            placeholder="Enter website"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Job Title"
            value={profileData.jobTitle}
            onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
            placeholder="Enter job title"
          />
          <Select
            label="Country"
            options={countryOptions}
            value={profileData.country}
            onChange={(e) => handleProfileChange('country', e.target.value)}
          />
        </div>

        <Checkbox
          label="Show this on my profile"
          checked={profileData.showOnProfile}
          onChange={(e) => handleProfileChange('showOnProfile', e.target.checked)}
        />

        <div className="pt-4">
          <Button type="submit" loading={loading}>
            Update Profile
          </Button>
        </div>
      </form>
    </div>
  );

  const renderPasswordTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Password</h2>
        <p className="text-sm text-gray-600 mt-1">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
        <Input
          label="Current Password"
          type="password"
          placeholder="Enter current password"
          required
        />
        <Input
          label="New Password"
          type="password"
          placeholder="Enter new password"
          required
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          required
        />

        <div className="pt-4">
          <Button type="submit" loading={loading}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );

  const renderNotificationTab = () => (
    <div className="space-y-8">
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
            <Checkbox
              label="New business ideas"
              checked={true}
            />
            <Checkbox
              label="Marketing insights"
              checked={true}
            />
            <Checkbox
              label="Account updates"
              checked={false}
            />
            <Checkbox
              label="Weekly reports"
              checked={true}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
          <div className="space-y-3">
            <Checkbox
              label="Browser notifications"
              checked={false}
            />
            <Checkbox
              label="Mobile notifications"
              checked={true}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-8">
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
            <Button variant="secondary" size="sm">
              Cancel Subscription
            </Button>
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
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="mt-4">
            + Add New Payment Method
          </Button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-3">
              <Select
                options={[
                  { value: 'recent', label: 'Sort by: Recent' },
                  { value: 'amount', label: 'Sort by: Amount' },
                  { value: 'date', label: 'Sort by: Date' }
                ]}
                value="recent"
                className="w-40"
              />
              <Button variant="secondary" size="sm">
                Export to CSV
              </Button>
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

  const renderTabContent = () => {
    switch (activeTab) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    transition-colors duration-200
                    ${
                      activeTab === tab.id
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

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
