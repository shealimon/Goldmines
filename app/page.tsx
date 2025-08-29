'use client';

import { ArrowRight, Brain, TrendingUp, Users, Zap, CheckCircle, Star, Menu, X } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="px-6 lg:px-8 pt-0 pb-48 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-2 h-2 bg-emerald-400 rounded-full"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-cyan-400 rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-emerald-300 rounded-full"></div>
        </div>
        
        {/* Navigation inside hero */}
        <nav className="flex items-center justify-between px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-normal text-lg">G</span>
            </div>
            <span className="text-2xl font-normal text-white">goldmines</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#product" className="text-white hover:text-emerald-400 transition-colors font-normal text-lg cursor-pointer">Product</a>
            <a href="#pricing" className="text-white hover:text-emerald-400 transition-colors font-normal text-lg cursor-pointer">Pricing</a>
            <a href="#about" className="text-white hover:text-emerald-400 transition-colors font-normal text-lg cursor-pointer">About</a>
            <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-normal shadow-lg shadow-cyan-500/25">
              Login
            </Link>
            <Link href="/signup" className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-normal shadow-lg shadow-purple-500/25">
              Signup
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white hover:text-emerald-400 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed top-0 left-0 right-0 bottom-0 bg-slate-900/95 backdrop-blur-md z-50">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between px-6 py-8 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-normal text-lg">G</span>
                  </div>
                  <span className="text-2xl font-normal text-white">goldmines</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-emerald-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Mobile Menu Items */}
              <div className="flex-1 px-6 py-8 space-y-6">
                <a 
                  href="#product" 
                  className="block text-white hover:text-emerald-400 transition-colors font-normal text-xl py-4 border-b border-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Product
                </a>
                <a 
                  href="#pricing" 
                  className="block text-white hover:text-emerald-400 transition-colors font-normal text-xl py-4 border-b border-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#about" 
                  className="block text-white hover:text-emerald-400 transition-colors font-normal text-xl py-4 border-b border-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </a>
                
                {/* Mobile Menu Buttons */}
                <div className="pt-8 space-y-4">
                  <Link 
                    href="/login" 
                    className="block w-full text-center px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-semibold shadow-lg shadow-cyan-500/25"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="block w-full text-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg shadow-purple-500/25"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Signup
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-medium text-white mb-8 leading-tight mt-16">
              Discover Your Next
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent font-normal">
                Million-Dollar
              </span>
              <br />
              Business Ideas
            </h1>
            
            <p className="text-base text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto font-normal tracking-wide">
              Transform Reddit discussions into validated business opportunities with AI that understands market signals before anyone else.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-6">
              <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium text-base shadow-lg shadow-purple-500/25 transform hover:scale-105">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How Goldmines Works Section */}
      <section id="how-it-works" className="px-6 lg:px-8 py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How Goldmines connects ideas to builders</h2>
          </div>
          
          <div className="space-y-20">
            {/* Aggregate */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-sm font-semibold text-emerald-400 mb-2">AGGREGATE</div>
                <h3 className="text-3xl font-bold text-white mb-4">Every signal, captured</h3>
                <p className="text-gray-300 mb-6">
                  Consolidate and analyze Reddit discussions across all communities - instantly identifying emerging problems and market gaps.
                </p>
                <div className="bg-white/10 backdrop-blur-sm border-l-4 border-emerald-400 p-4 rounded-r-lg">
                  <p className="text-gray-200 italic">
                    "Goldmines connected millions of Reddit posts immediately for our team to see what problems users were desperately trying to solve."
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Sarah Chen, Founder at TechStartup</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-lg border border-white/20">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="font-semibold mb-2 text-white">AI-Powered Analysis</h4>
                <p className="text-gray-300 text-sm">Advanced algorithms process thousands of posts to identify trending problems.</p>
              </div>
            </div>

            {/* Analyze */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-lg border border-white/20 order-2 md:order-1">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="font-semibold mb-2 text-white">Real-Time Market Intelligence</h4>
                <p className="text-gray-300 text-sm">Instant insights into market demand and opportunity validation.</p>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-semibold text-cyan-400 mb-2">ANALYZE</div>
                <h3 className="text-3xl font-bold text-white mb-4">Know, don't guess</h3>
                <p className="text-gray-300 mb-6">
                  Uncover key market insights at the speed of thought with AI that understands context and sentiment.
                </p>
                <div className="bg-white/10 backdrop-blur-sm border-l-4 border-cyan-400 p-4 rounded-r-lg">
                  <p className="text-gray-200 italic">
                    "Goldmines helps us have a holistic view. We can actually understand: What are the broader market sentiments? What problems are users facing?"
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Alex Rodriguez, Product Manager</p>
                </div>
              </div>
            </div>

            {/* Act */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-sm font-semibold text-purple-400 mb-2">ACT</div>
                <h3 className="text-3xl font-bold text-white mb-4">Build with confidence</h3>
                <p className="text-gray-300 mb-6">
                  Transform insights into validated business opportunities with data-driven confidence.
                </p>
                <div className="bg-white/10 backdrop-blur-sm border-l-4 border-purple-400 p-4 rounded-r-lg">
                  <p className="text-gray-200 italic">
                    "Goldmines helps us focus on the 20% of opportunities that cause 80% of the impact. No more needles in haystacks."
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Maria Thompson, Entrepreneur</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-lg border border-white/20">
                <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="font-semibold mb-2 text-white">Validated Opportunities</h4>
                <p className="text-gray-300 text-sm">Turn community insights into profitable business ideas with proven demand.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="px-6 lg:px-8 py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">Features that scale with your vision</h2>
            <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto">Everything you need to discover, validate, and act on market opportunities.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Source of truth</h3>
              <p className="text-gray-300">
                Unify all Reddit discussions in minutes to get the most comprehensive view of market opportunities and problems.
              </p>
            </div>
            
            <div className="p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Custom opportunity taxonomy</h3>
              <p className="text-gray-300">
                Give structure to unstructured discussions - customized for your industry. Taxonomy adapts to market changes over time.
              </p>
            </div>
            
            <div className="p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Co-pilot for market insights</h3>
              <p className="text-gray-300">
                Get instant insights through an intuitive chat interface. Ask any question and get answers without complexity.
              </p>
            </div>
            
            <div className="p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">User-friendly analytics</h3>
              <p className="text-gray-300">
                Get powerful insights with easy dashboards, automated summaries, and alerts - no technical expertise required.
              </p>
            </div>
            
            <div className="p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Dedicated support</h3>
              <p className="text-gray-300">
                From implementation onwards, get dedicated analysts for weekly model updates, plus a CSM partner.
              </p>
            </div>
            
            <div className="p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Unlimited team access</h3>
              <p className="text-gray-300">
                Bring your entire team into Goldmines without prohibitive costs and foster a culture of opportunity-driven strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 lg:px-8 py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-black text-white mb-6">Simple pricing, no surprises</h2>
          <p className="text-xl text-gray-300 mb-16">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="text-5xl font-black text-white mb-2">
                  $0
                </div>
                <p className="text-gray-300">7-day trial</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-200">5 business idea generations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-200">Basic market analysis</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-200">Community access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-200">Email support</span>
                </li>
              </ul>
              <button className="w-full py-4 px-6 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-200 font-bold border border-white/30">
                Start Free Trial
              </button>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl p-8 relative hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-emerald-600 px-4 py-2 rounded-full text-sm font-bold">Most Popular</span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="text-5xl font-black text-white mb-2">
                  $19
                </div>
                <p className="text-emerald-100">per month / billed yearly</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Unlimited idea generations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Advanced market analysis</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Export reports</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">API access</span>
                </li>
              </ul>
              <button className="w-full py-4 px-6 bg-white text-emerald-600 rounded-full hover:bg-gray-100 transition-all duration-200 font-bold shadow-lg">
                Get Started
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Ultimate</h3>
                <div className="text-5xl font-black text-white mb-2">
                  $299
                </div>
                <p className="text-purple-100">one-time payment</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Lifetime access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">All future updates</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">VIP support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Early access features</span>
                </li>
              </ul>
              <button className="w-full py-4 px-6 bg-white text-purple-600 rounded-full hover:bg-gray-100 transition-all duration-200 font-bold shadow-lg">
                Get Ultimate Access
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-6 lg:px-8 py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black text-white mb-4">About Goldmines</h2>
          <p className="text-xl text-gray-300 mb-8">
            We're on a mission to democratize business intelligence by making market research accessible to everyone.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Our Mission</h3>
              <p className="text-gray-300">
                To help entrepreneurs discover and validate business opportunities through data-driven insights.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Our Approach</h3>
              <p className="text-gray-300">
                Combining AI technology with real-time community insights to deliver actionable business intelligence.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Our Community</h3>
              <p className="text-gray-300">
                A growing network of entrepreneurs, innovators, and business leaders sharing insights and opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-1 h-1 bg-emerald-400 rounded-full"></div>
          <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-purple-400 rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-emerald-300 rounded-full"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-black text-lg">G</span>
                </div>
                <span className="text-2xl font-black">Goldmines</span>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-md mb-6">
                Discover your next million-dollar business idea with AI-powered market intelligence that sees opportunities before your competition.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                  <span className="text-white font-bold">T</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                  <span className="text-white font-bold">L</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                  <span className="text-white font-bold">G</span>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 text-emerald-400">Product</h4>
              <ul className="space-y-3">
                <li><a href="#product" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Features</a></li>
                <li><a href="#pricing" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Pricing</a></li>
                <li><a href="/demo" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Demo</a></li>
                <li><a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 text-cyan-400">Company</h4>
              <ul className="space-y-3">
                <li><a href="#about" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">About</a></li>
                <li><a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 Goldmines. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

