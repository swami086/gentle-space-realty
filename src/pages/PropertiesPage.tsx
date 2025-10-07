import React, { useState, useEffect } from 'react';
import PropertyListings from '@/components/PropertyListings';
import PropertyModal from '@/components/PropertyModal';
import TestimonialSubmission from '@/components/TestimonialSubmission';
import { AIPropertyAssistant } from '@/components/ai/AIPropertyAssistant';
import { PersonalizedRecommendations } from '@/components/ai/PersonalizedRecommendations';
import { PropertyComparison } from '@/components/ai/PropertyComparison';
import { BudgetCalculator } from '@/components/ai/BudgetCalculator';
import { AmenityExplorer } from '@/components/ai/AmenityExplorer';
import { SmartInquiryForm } from '@/components/ai/SmartInquiryForm';
import C1RealEstateComponent from '@/components/ai/C1RealEstateComponent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  MessageSquare, 
  Target, 
  Calculator, 
  Search,
  BarChart3,
  Bot,
  Zap,
  Star,
  Filter,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { Property } from '@/types/property';
import { useTestimonialStore } from '@/store/testimonialStore';
import { usePropertyStore } from '@/store/propertyStore';
import { mockTestimonials } from '@/data/mockTestimonials';

const PropertiesPage: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-search');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [propertiesForComparison, setPropertiesForComparison] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  
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

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handlePropertyContact = (property: Property) => {
    setSelectedProperty(property);
    setShowInquiryForm(true);
  };

  const handleAddToComparison = (property: Property) => {
    if (propertiesForComparison.length < 4 && !propertiesForComparison.find(p => p.id === property.id)) {
      setPropertiesForComparison(prev => [...prev, property]);
    }
  };

  const handleRemoveFromComparison = (propertyId: string) => {
    setPropertiesForComparison(prev => prev.filter(p => p.id !== propertyId));
  };

  const handleClearComparison = () => {
    setPropertiesForComparison([]);
  };

  const handleInquirySubmit = () => {
    setShowInquiryForm(false);
    setSelectedProperty(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-10 relative">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-white/20 rounded-full mr-4">
                <Bot className="h-8 w-8" />
              </div>
              <span className="text-lg font-medium">AI-Powered Property Discovery</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Find Your Perfect Office Space
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              Discover 100+ verified office spaces across Bengaluru with our AI-powered search. 
              Get personalized recommendations, smart comparisons, and intelligent insights.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-primary-100">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">AI-Powered Search</span>
              </div>
              <div className="flex items-center gap-2 text-primary-100">
                <Target className="h-4 w-4" />
                <span className="text-sm">Smart Recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-primary-100">
                <Calculator className="h-4 w-4" />
                <span className="text-sm">Budget Calculator</span>
              </div>
              <div className="flex items-center gap-2 text-primary-100">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Property Comparison</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Enhanced Property Discovery */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-purple-500 mr-2" />
              <h2 className="text-3xl font-bold text-gray-900">
                AI-Enhanced Property Discovery
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Use our advanced AI tools to find, compare, and analyze properties that match your exact requirements.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="ai-search" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Budget Tool
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Compare
              </TabsTrigger>
              <TabsTrigger value="amenities" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Amenities
              </TabsTrigger>
              <TabsTrigger value="c1-ai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                C1 AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai-search" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <AIPropertyAssistant
                    properties={properties}
                    onPropertySelect={handlePropertySelect}
                    onPropertyContact={handlePropertyContact}
                    onAddToComparison={handleAddToComparison}
                  />
                </div>
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Quick Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Properties</span>
                        <span className="font-medium">{properties.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">In Comparison</span>
                        <span className="font-medium">{propertiesForComparison.length}/4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prime Locations</span>
                        <span className="font-medium">8</span>
                      </div>
                    </div>
                  </Card>
                  {propertiesForComparison.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-green-500" />
                          Comparison List
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearComparison}
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {propertiesForComparison.map((property) => (
                          <div key={property.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span className="text-sm font-medium truncate">
                                {property.title}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromComparison(property.id)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => setActiveTab('compare')}
                        disabled={propertiesForComparison.length < 2}
                      >
                        Compare Properties
                      </Button>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-8">
              <PersonalizedRecommendations
                properties={properties}
                onPropertySelect={handlePropertySelect}
                onPropertyContact={handlePropertyContact}
                onAddToComparison={handleAddToComparison}
              />
            </TabsContent>

            <TabsContent value="budget" className="mt-8">
              <BudgetCalculator
                properties={properties}
                onCalculationComplete={(calculation) => {
                  console.log('Budget calculation completed:', calculation);
                }}
              />
            </TabsContent>

            <TabsContent value="compare" className="mt-8">
              {propertiesForComparison.length > 1 ? (
                <PropertyComparison
                  properties={propertiesForComparison}
                  onPropertySelect={handlePropertySelect}
                  onViewProperty={handlePropertySelect}
                  onContactProperty={handlePropertyContact}
                />
              ) : (
                <Card className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Properties to Compare
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add at least 2 properties to your comparison list to see detailed comparisons.
                  </p>
                  <Button onClick={() => setActiveTab('ai-search')}>
                    Browse Properties
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="amenities" className="mt-8">
              <AmenityExplorer
                properties={properties}
                onPropertySelect={handlePropertySelect}
                onPropertyContact={handlePropertyContact}
                onAddToComparison={handleAddToComparison}
              />
            </TabsContent>
            
            <TabsContent value="c1-ai" className="mt-8">
              <Card className="p-8">
                <C1RealEstateComponent
                  availableProperties={properties}
                  userPreferences={{
                    preferredLocation: '',
                    budgetRange: { min: 0, max: 100000 },
                    spaceSize: { min: 100, max: 10000 },
                    amenities: [],
                    workingStyle: 'hybrid'
                  }}
                  onPropertyAction={(action, propertyId) => {
                    console.log('C1 Property Action:', action, propertyId);
                    if (action === 'contact' && propertyId) {
                      const property = properties.find(p => p.id === propertyId);
                      if (property) {
                        handlePropertyContact(property);
                      }
                    }
                  }}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Traditional Property Listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              All Properties
            </h2>
            <p className="text-lg text-gray-600">
              Browse our complete collection of verified office spaces
            </p>
          </div>
          <PropertyListings onPropertySelect={handlePropertySelect} />
        </div>
      </section>

      {/* Property Modal */}
      <PropertyModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      
      {/* Smart Inquiry Form Modal */}
      {showInquiryForm && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <SmartInquiryForm
              property={selectedProperty}
              onSubmit={handleInquirySubmit}
              onClose={() => setShowInquiryForm(false)}
            />
          </div>
        </div>
      )}

      {/* Testimonial Submission */}
      <TestimonialSubmission />
    </div>
  );
};

export default PropertiesPage;
