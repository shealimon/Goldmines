'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { BookOpen, Calendar, DollarSign, Users, TrendingUp, ExternalLink, ArrowRight } from 'lucide-react';

interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  cover_image_url: string;
  current_revenue: string;
  valuation: string;
  starting_income: string;
  users_count: number;
  market_context: string;
  created_at: string;
  company_url: string;
  founder_name: string;
  app_name: string;
}

export default function CaseStudiesPage() {
  const router = useRouter();
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('case_studies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCaseStudies(data || []);
    } catch (err) {
      console.error('Error fetching case studies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch case studies');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading case studies...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Case Studies</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCaseStudies}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Case Studies</h1>
                <p className="text-xl text-gray-600">
                  Explore inspiring startup stories and entrepreneurial journeys
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {caseStudies.length}
                </div>
                <div className="text-sm text-gray-500">Total Case Studies</div>
              </div>
            </div>
          </div>
        </div>

        {/* Case Studies Grid */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {caseStudies.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Case Studies Yet</h3>
              <p className="text-gray-600 mb-6">
                Case studies will appear here once they are added to the database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudies.map((study) => (
                <div
                  key={study.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(`/dashboard/case-studies/${study.slug}`)}
                >
                  {/* Cover Image */}
                  {study.cover_image_url ? (
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      <img
                        src={study.cover_image_url}
                        alt={study.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-purple-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                          {study.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {study.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {study.current_revenue && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {study.current_revenue}
                          </div>
                          <div className="text-xs text-gray-500">Revenue</div>
                        </div>
                      )}
                      {study.valuation && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {study.valuation}
                          </div>
                          <div className="text-xs text-gray-500">Valuation</div>
                        </div>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{study.founder_name}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>{study.app_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(study.created_at)}</span>
                      </div>
                    </div>

                    {/* Category Badge */}
                    {study.category && (
                      <div className="mt-4">
                        <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {study.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}