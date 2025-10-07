import React, { useEffect, useState } from 'react';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import AboutSection from '@/components/AboutSection';
import CompanyLogosBar from '@/components/CompanyLogosBar';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import ContactSection from '@/components/ContactSection';
import TestimonialSubmission from '@/components/TestimonialSubmission';
import { AIFeaturesTabs } from '@/components/ai/AIFeaturesTabs';
import { PersonalizedRecommendations } from '@/components/ai/PersonalizedRecommendations';
import { BudgetCalculator } from '@/components/ai/BudgetCalculator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Calculator, 
  Target, 
  BarChart3, 
  Search, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useTestimonialStore } from '@/store/testimonialStore';
import { usePropertyStore } from '@/store/propertyStore';
import { mockTestimonials } from '@/data/mockTestimonials';

const HomePage: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'assistant' | 'recommendations' | 'calculator' | null>(null);
  const [showAIPreview, setShowAIPreview] = useState(false);
  
  const { setTestimonials, loadApprovedTestimonials } = useTestimonialStore();
  const { properties } = usePropertyStore();

  useEffect(() => {
    // Load testimonials from Supabase with fallback to mock data
    const loadData = async () => {
      try {
        await loadApprovedTestimonials();
      } catch (error) {
        console.warn('Failed to load from Supabase, using mock data:', error);
        setTestimonials(mockTestimonials);
      }
    };
    
    loadData();
  }, [loadApprovedTestimonials, setTestimonials]);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      
      {/* AI-Powered Features Showcase */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-blue-100/20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-10 relative">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Bot className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              AI-Powered Property Discovery
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Experience the future of real estate search with our advanced AI tools. 
              Get personalized recommendations, smart comparisons, and intelligent insights.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Search
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Target className="h-4 w-4 mr-2" />
                Smart Recommendations
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Calculator className="h-4 w-4 mr-2" />
                Budget Planning
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Property Analysis
              </Badge>
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
              onClick={() => setShowAIPreview(true)}
            >
              <Play className="h-5 w-5 mr-2" />
              Try AI Assistant
            </Button>
          </div>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* AI Assistant */}
            <Card className="p-8 bg-white/80 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  AI Property Assistant
                </h3>
                <p className="text-gray-600 mb-6">
                  Chat naturally with our AI to find properties that match your exact requirements. 
                  Get instant answers and personalized suggestions.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Natural language search
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Contextual recommendations
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Real-time property matching
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveDemo('assistant')}
                >
                  Try Demo
                </Button>
              </div>
            </Card>

            {/* Smart Recommendations */}
            <Card className="p-8 bg-white/80 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Personalized Recommendations
                </h3>
                <p className="text-gray-600 mb-6">
                  Our AI analyzes your preferences and behavior to suggest properties 
                  you'll love, with confidence scores and detailed reasoning.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Behavioral analysis
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Confidence scoring
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Detailed reasoning
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveDemo('recommendations')}
                >
                  View Recommendations
                </Button>
              </div>
            </Card>

            {/* Budget Calculator */}
            <Card className="p-8 bg-white/80 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Calculator className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Smart Budget Planning
                </h3>
                <p className="text-gray-600 mb-6">
                  Calculate comprehensive budgets with AI insights, including hidden costs, 
                  ROI projections, and optimization suggestions.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Comprehensive cost analysis
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ROI projections
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Optimization tips
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveDemo('calculator')}
                >
                  Calculate Budget
                </Button>
              </div>
            </Card>
          </div>

          {/* AI Stats */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-sm text-gray-600">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">60%</div>
                <div className="text-sm text-gray-600">Faster Search</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-sm text-gray-600">AI Assistance</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">1000+</div>
                <div className="text-sm text-gray-600">Happy Users</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Demo Modal */}
      {(activeDemo || showAIPreview) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    {activeDemo === 'assistant' || showAIPreview ? (
                      <MessageSquare className="h-6 w-6 text-white" />
                    ) : activeDemo === 'recommendations' ? (
                      <Target className="h-6 w-6 text-white" />
                    ) : (
                      <Calculator className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {activeDemo === 'assistant' || showAIPreview ? 'AI Property Assistant' :
                       activeDemo === 'recommendations' ? 'Personalized Recommendations' :
                       'Smart Budget Calculator'}
                    </h3>
                    <p className="text-sm text-gray-600">Experience AI-powered property discovery</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setActiveDemo(null);
                    setShowAIPreview(false);
                  }}
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-6">
              {(activeDemo === 'assistant' || showAIPreview) && (
                <AIFeaturesTabs
                  properties={properties}
                  onPropertySelect={() => {}}
                  onPropertyContact={() => {}}
                  onAddToComparison={() => {}}
                />
              )}
              {activeDemo === 'recommendations' && (
                <PersonalizedRecommendations
                  properties={properties}
                  onPropertySelect={() => {}}
                  onPropertyContact={() => {}}
                  onAddToComparison={() => {}}
                />
              )}
              {activeDemo === 'calculator' && (
                <BudgetCalculator
                  properties={properties}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <ServicesSection />
      
      {/* Enhanced AI Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose Our AI-Powered Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI technology transforms how you search, compare, and decide on office spaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-0 shadow-lg">
              <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Intelligent Matching
              </h3>
              <p className="text-gray-600">
                Our AI understands context and nuance, finding properties that truly match your needs beyond basic filters.
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Lightbulb className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Predictive Insights
              </h3>
              <p className="text-gray-600">
                Get ahead of the market with AI-driven insights about pricing trends, demand patterns, and investment opportunities.
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg">
              <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Continuous Learning
              </h3>
              <p className="text-gray-600">
                Our AI learns from every interaction, constantly improving recommendations and becoming smarter about your preferences.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <AboutSection />
      <CompanyLogosBar />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <TestimonialSubmission />
    </div>
  );
};

export default HomePage;
