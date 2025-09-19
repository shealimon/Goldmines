'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ArrowLeft, BookOpen, Calendar, DollarSign, Users, TrendingUp, Quote, ExternalLink } from 'lucide-react';
import Image from 'next/image';

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
  raw_output: any;
  created_at: string;
  company_url: string;
}

interface CaseStudySection {
  name: string;
  emoji: string;
  heading: string;
  body: string;
}

interface CaseStudyFunding {
  round_name: string;
  amount: string;
  raised_at: string;
  investors: string[];
  source: string;
  note: string;
}

interface CaseStudyQuote {
  who: string;
  quote: string;
}

export default function CaseStudyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [sections, setSections] = useState<CaseStudySection[]>([]);
  const [funding, setFunding] = useState<CaseStudyFunding[]>([]);
  const [quotes, setQuotes] = useState<CaseStudyQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      fetchCaseStudy(params.slug as string);
    }
  }, [params.slug]);

  const fetchCaseStudy = async (slug: string) => {
    try {
      setLoading(true);
      
      // Fetch main case study data
      const { data: caseStudyData, error: caseStudyError } = await supabase
        .from('case_studies')
        .select('*')
        .eq('slug', slug)
        .single();

      if (caseStudyError) throw caseStudyError;
      if (!caseStudyData) throw new Error('Case study not found');

      setCaseStudy(caseStudyData);

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('case_study_sections')
        .select('*')
        .eq('case_study_id', caseStudyData.id)
        .order('sort_order', { ascending: true });

      if (!sectionsError && sectionsData) {
        setSections(sectionsData);
      }

      // Fetch funding
      const { data: fundingData, error: fundingError } = await supabase
        .from('case_study_funding')
        .select('*')
        .eq('case_study_id', caseStudyData.id)
        .order('raised_at', { ascending: false });

      if (!fundingError && fundingData) {
        setFunding(fundingData);
      }

      // Fetch quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('case_study_quotes')
        .select('*')
        .eq('case_study_id', caseStudyData.id);

      if (!quotesError && quotesData) {
        setQuotes(quotesData);
      }

    } catch (error) {
      console.error('Error fetching case study:', error);
      setError(error instanceof Error ? error.message : 'Failed to load case study');
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
            <p className="text-gray-600">Loading case study...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !caseStudy) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Study Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The case study you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/dashboard?tab=case-studies')}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200"
            >
              Back to Case Studies
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
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <button
              onClick={() => router.push('/dashboard?tab=case-studies')}
              className="flex items-center text-purple-100 hover:text-white mb-8 transition-colors text-lg font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Case Studies
            </button>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Logo and Title */}
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 flex-shrink-0">
                    <span className="text-white font-bold text-2xl">G</span>
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold text-white mb-3 leading-tight">{caseStudy.title}</h1>
                    <p className="text-xl text-purple-100 font-medium">{caseStudy.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8 text-lg text-purple-100">
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    {formatDate(caseStudy.created_at)}
                  </div>
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <BookOpen className="w-5 h-5 mr-2" />
                    {caseStudy.category}
                  </div>
                </div>
              </div>
              
              {caseStudy.cover_image_url && (
                <div className="ml-8">
                  <Image
                    src={caseStudy.cover_image_url}
                    alt={caseStudy.title}
                    width={160}
                    height={160}
                    className="object-cover rounded-2xl shadow-2xl border-4 border-white/20"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white shadow-lg">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {caseStudy.current_revenue && (
                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="text-4xl font-bold text-green-600 mb-3">
                    {caseStudy.current_revenue}
                  </div>
                  <div className="text-lg text-gray-600 font-semibold">Current Revenue</div>
                </div>
              )}
              
              {caseStudy.valuation && (
                <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-3">
                    {caseStudy.valuation}
                  </div>
                  <div className="text-lg text-gray-600 font-semibold">Valuation</div>
                </div>
              )}
              
              {caseStudy.users_count && (
                <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                  <div className="text-4xl font-bold text-purple-600 mb-3">
                    {caseStudy.users_count.toLocaleString()}
                  </div>
                  <div className="text-lg text-gray-600 font-semibold">Users</div>
                </div>
              )}
              
              {caseStudy.starting_income && (
                <div className="text-center bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
                  <div className="text-4xl font-bold text-orange-600 mb-3">
                    {caseStudy.starting_income}
                  </div>
                  <div className="text-lg text-gray-600 font-semibold">Starting Income</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 py-16 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          {/* Sections */}
          {sections.map((section, index) => (
            <div key={index} className="mb-20 bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
              <div className="flex items-start mb-8">
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-4 mr-6 flex-shrink-0">
                  <span className="text-6xl">{section.emoji}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {section.heading}
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="prose prose-xl max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-line text-lg font-medium">
                  {section.body}
                </div>
              </div>
            </div>
          ))}

          {/* Funding Section */}
          {funding.length > 0 && (
            <div className="mb-20 bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4 mr-6">
                  <DollarSign className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">Funding Timeline</h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-8">
                {funding.map((round, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{round.round_name}</h3>
                      <span className="text-3xl font-bold text-green-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                        {round.amount}
                      </span>
                    </div>
                    <div className="text-lg text-gray-600 mb-4 font-medium">
                      📅 {formatDate(round.raised_at)}
                    </div>
                    {round.investors.length > 0 && (
                      <div className="text-lg text-gray-700 mb-3">
                        <span className="font-semibold text-gray-900">Investors:</span> {round.investors.join(', ')}
                      </div>
                    )}
                    {round.note && (
                      <div className="text-lg text-gray-600 mt-4 italic bg-white p-4 rounded-lg">
                        💡 {round.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Section */}
          {quotes.length > 0 && (
            <div className="mb-20 bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mr-6">
                  <Quote className="w-12 h-12 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">Key Quotes</h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-8">
                {quotes.map((quote, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 border-l-4 border-purple-500 relative">
                    <div className="absolute top-4 left-4 text-4xl text-purple-300">"</div>
                    <blockquote className="text-xl text-gray-800 italic mb-6 pl-8 leading-relaxed font-medium">
                      {quote.quote}
                    </blockquote>
                    <div className="text-lg text-gray-600 font-semibold pl-8">
                      — {quote.who}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company URL */}
          {caseStudy.company_url && (
            <div className="mb-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Want to learn more?</h3>
              <p className="text-purple-100 mb-6 text-lg">Visit the company's official website</p>
              <a
                href={caseStudy.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-white text-purple-600 hover:bg-gray-50 font-bold text-xl px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Visit Company Website
                <ExternalLink className="w-6 h-6 ml-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
