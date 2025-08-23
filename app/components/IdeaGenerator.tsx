'use client';

import { useState } from 'react';
import { Brain, Zap, TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function IdeaGenerator() {
  const { profile, canGenerateIdea, incrementUsage } = useUser();
  const [loading, setLoading] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState(null);

  const generateIdea = async () => {
    if (!canGenerateIdea()) {
      if (profile?.role === 'trial') {
        alert('Your trial has expired. Upgrade to continue generating ideas.');
      } else {
        alert('You have reached your limit. Upgrade to continue generating ideas.');
      }
      return;
    }

    setLoading(true);
    
    // Simulate AI idea generation
    setTimeout(() => {
      const ideas = [
        {
          title: 'AI-Powered Personal Chef App',
          description: 'Mobile app that creates personalized meal plans based on dietary restrictions, budget, and cooking skills.',
          marketSize: '$45B',
          difficulty: 'Medium',
          redditScore: 95,
          category: 'Technology',
          painPoints: ['Meal planning takes too long', 'Hard to stick to dietary goals'],
          revenueModel: 'Subscription + Premium features'
        },
        {
          title: 'Remote Team Culture Builder',
          description: 'Platform that helps remote teams build culture through virtual team building activities.',
          marketSize: '$12B',
          difficulty: 'Low',
          redditScore: 88,
          category: 'Business',
          painPoints: ['Teams feel disconnected', 'Hard to maintain company culture'],
          revenueModel: 'SaaS subscription'
        }
      ];

      const randomIdea = ideas[Math.random() > 0.5 ? 0 : 1];
      setGeneratedIdea(randomIdea);
      incrementUsage();
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl p-8 border border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Generate Your Next Business Idea
        </h2>
        <p className="text-gray-600">
          Our AI analyzes market trends to create profitable business opportunities
        </p>
      </div>

      <div className="text-center mb-8">
        <button
          onClick={generateIdea}
          disabled={loading || !canGenerateIdea()}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg flex items-center space-x-2 mx-auto"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating Idea...</span>
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              <span>Generate Business Idea</span>
            </>
          )}
        </button>
      </div>

      {generatedIdea && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{generatedIdea.title}</h3>
          <p className="text-gray-600 mb-6">{generatedIdea.description}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Market Size: <strong>{generatedIdea.marketSize}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Difficulty: <strong>{generatedIdea.difficulty}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">Reddit Score: <strong>{generatedIdea.redditScore}%</strong></span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-600">Category: <strong>{generatedIdea.category}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Revenue: <strong>{generatedIdea.revenueModel}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div className="mt-6 text-center text-sm text-gray-600">
          {profile.role === 'trial' && (
            <p className="text-orange-600 mb-2">
              Trial expires: {new Date(profile.trial_expires_at).toLocaleDateString()}
            </p>
          )}
          {profile.role === 'free' && (
            <p className="text-blue-600 mt-2">
              Upgrade to Pro for unlimited ideas!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
