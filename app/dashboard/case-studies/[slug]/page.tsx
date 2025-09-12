'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ArrowLeft, BookOpen, Calendar, DollarSign, Users, TrendingUp, Quote, ExternalLink } from 'lucide-react';

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
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <button
              onClick={() => router.push('/dashboard?tab=case-studies')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Case Studies
            </button>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Logo and Title */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-lg">G</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-1">{caseStudy.title}</h1>
                    <p className="text-xl text-gray-600">{caseStudy.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(caseStudy.created_at)}
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {caseStudy.category}
                  </div>
                </div>
              </div>
              
              {caseStudy.cover_image_url && (
                <div className="ml-6">
                  <img
                    src={caseStudy.cover_image_url}
                    alt={caseStudy.title}
                    className="w-32 h-32 object-cover rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {caseStudy.current_revenue && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {caseStudy.current_revenue}
                  </div>
                  <div className="text-sm text-gray-500">Current Revenue</div>
                </div>
              )}
              
              {caseStudy.valuation && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {caseStudy.valuation}
                  </div>
                  <div className="text-sm text-gray-500">Valuation</div>
                </div>
              )}
              
              {caseStudy.users_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {caseStudy.users_count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Users</div>
                </div>
              )}
              
              {caseStudy.starting_income && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {caseStudy.starting_income}
                  </div>
                  <div className="text-sm text-gray-500">Starting Income</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Sections */}
          {sections.map((section, index) => (
            <div key={index} className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-4xl mr-3">{section.emoji}</span>
                {section.heading}
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            </div>
          ))}

          {/* Funding Section */}
          {funding.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                Funding Timeline
              </h2>
              <div className="space-y-4">
                {funding.map((round, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{round.round_name}</h3>
                      <span className="text-2xl font-bold text-green-600">
                        {round.amount}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {formatDate(round.raised_at)}
                    </div>
                    {round.investors.length > 0 && (
                      <div className="text-sm text-gray-700">
                        <strong>Investors:</strong> {round.investors.join(', ')}
                      </div>
                    )}
                    {round.note && (
                      <div className="text-sm text-gray-600 mt-2 italic">
                        {round.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Section */}
          {quotes.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Quote className="w-8 h-8 mr-3 text-purple-600" />
                Key Quotes
              </h2>
              <div className="space-y-6">
                {quotes.map((quote, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-l-4 border-purple-500">
                    <blockquote className="text-lg text-gray-800 italic mb-3">
                      "{quote.quote}"
                    </blockquote>
                    <div className="text-sm text-gray-600">
                      <strong>— {quote.who}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company URL */}
          {caseStudy.company_url && (
            <div className="mb-12">
              <a
                href={caseStudy.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold"
              >
                Visit Company Website
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
