'use client';

import { useState } from 'react';
import { Brain, TrendingUp, Users, Zap, ArrowRight, Search, Filter, BookOpen, Target, DollarSign } from 'lucide-react';

export default function DemoPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Categories', icon: Brain },
    { id: 'tech', name: 'Technology', icon: Zap },
    { id: 'health', name: 'Health & Wellness', icon: Target },
    { id: 'finance', name: 'Finance', icon: DollarSign },
    { id: 'education', name: 'Education', icon: BookOpen },
  ];

  const sampleIdeas = [
    {
      id: 1,
      title: 'AI-Powered Personal Chef App',
      description: 'Mobile app that creates personalized meal plans and shopping lists based on dietary restrictions, budget, and cooking skills.',
      category: 'tech',
      marketSize: '$45B',
      difficulty: 'Medium',
      redditScore: 95,
      subreddits: ['r/MealPrepSunday', 'r/EatCheapAndHealthy', 'r/1200isplenty'],
      painPoints: ['Meal planning takes too long', 'Hard to stick to dietary goals', 'Waste food due to poor planning'],
      revenueModel: 'Subscription + Premium features',
      estimatedRevenue: '$50K - $200K/year'
    },
    {
      id: 2,
      title: 'Remote Team Culture Builder',
      description: 'Platform that helps remote teams build culture through virtual team building activities, recognition systems, and communication tools.',
      category: 'tech',
      marketSize: '$12B',
      difficulty: 'Low',
      redditScore: 88,
      subreddits: ['r/remotework', 'r/digitalnomad', 'r/startups'],
      painPoints: ['Teams feel disconnected', 'Hard to maintain company culture', 'Lack of team bonding'],
      revenueModel: 'SaaS subscription',
      estimatedRevenue: '$100K - $500K/year'
    },
    {
      id: 3,
      title: 'Eco-Friendly Pet Products Marketplace',
      description: 'Online marketplace specializing in sustainable, biodegradable pet products from verified eco-friendly brands.',
      category: 'health',
      marketSize: '$8B',
      difficulty: 'Medium',
      redditScore: 92,
      subreddits: ['r/Pets', 'r/ZeroWaste', 'r/sustainability'],
      painPoints: ['Hard to find eco-friendly pet products', 'Concerns about pet safety', 'Limited sustainable options'],
      revenueModel: 'Commission + Featured listings',
      estimatedRevenue: '$75K - $300K/year'
    },
    {
      id: 4,
      title: 'Micro-Learning Platform for Skills',
      description: 'App that breaks down complex skills into 5-minute daily lessons with gamification and progress tracking.',
      category: 'education',
      marketSize: '$25B',
      difficulty: 'Medium',
      redditScore: 87,
      subreddits: ['r/selfimprovement', 'r/learnprogramming', 'r/productivity'],
      painPoints: ['Learning takes too long', 'Hard to stay motivated', 'Overwhelmed by complex topics'],
      revenueModel: 'Freemium + Premium courses',
      estimatedRevenue: '$200K - $1M/year'
    }
  ];

  const filteredIdeas = sampleIdeas.filter(idea => {
    const matchesCategory = selectedCategory === 'all' || idea.category === selectedCategory;
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Goldmines Demo</span>
            </div>
            <a 
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            See How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Goldmines</span> Works
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience our AI-powered platform that analyzes Reddit discussions to generate profitable business ideas. 
            Here's a preview of what you'll discover.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="px-6 py-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search business ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Ideas Grid */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredIdeas.map((idea) => (
              <div key={idea.id} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{idea.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{idea.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    <span>{idea.redditScore}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Market Size</div>
                    <div className="text-lg font-semibold text-gray-900">{idea.marketSize}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Difficulty</div>
                    <div className="text-lg font-semibold text-gray-900">{idea.difficulty}</div>
                  </div>
                </div>

                {/* Reddit Data */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Trending on Reddit
                  </h4>
                  <div className="space-y-2">
                    {idea.subreddits.map((subreddit, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {subreddit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pain Points */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Key Pain Points</h4>
                  <div className="space-y-2">
                    {idea.painPoints.map((point, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-red-50 px-3 py-2 rounded-lg">
                        {point}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Info */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Revenue Model</div>
                      <div className="font-semibold text-gray-900">{idea.revenueModel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Est. Revenue</div>
                      <div className="font-semibold text-green-600">{idea.estimatedRevenue}</div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <button className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2">
                    <span>Get Full Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredIdeas.length === 0 && (
            <div className="text-center py-16">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No ideas found</h3>
              <p className="text-gray-600">Try adjusting your search or filters to discover more business opportunities.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Discover Your Next Business Idea?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            This is just a preview. Get unlimited access to our full database of AI-generated business opportunities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a 
              href="/"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold text-lg"
            >
              Start Free Trial
            </a>
            <a 
              href="/"
              className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200 font-semibold text-lg"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
