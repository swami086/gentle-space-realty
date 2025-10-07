import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIPropertyAssistant } from './AIPropertyAssistant';
import { PersonalizedRecommendations } from './PersonalizedRecommendations';
import { BudgetCalculator } from './BudgetCalculator';
import { PropertyComparison } from './PropertyComparison';
import { AmenityExplorer } from './AmenityExplorer';
import GenUISdkTest from './GenUISdkTest';
import StreamTestComponent from './StreamTestComponent';
import { C1RealEstateComponent } from './C1RealEstateComponent';
import { Property } from '@/types/property';
import { 
  MessageSquare, 
  Target, 
  Calculator, 
  BarChart3, 
  Search,
  Bot,
  Bug,
  Lightbulb
} from 'lucide-react';

interface AIFeaturesTabsProps {
  properties?: Property[];
  onPropertySelect?: (property: Property) => void;
  onPropertyContact?: (property: Property) => void;
  onAddToComparison?: (property: Property) => void;
  className?: string;
}

export const AIFeaturesTabs: React.FC<AIFeaturesTabsProps> = ({
  properties = [],
  onPropertySelect,
  onPropertyContact,
  onAddToComparison,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('assistant');

  return (
    <div className={`w-full h-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-9 bg-gray-100 p-1 rounded-lg mb-6">
          <TabsTrigger 
            value="assistant" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="recommendations" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Recommendations</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="budget" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Budget Tool</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="compare" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="amenities" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Amenities</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="test" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">SDK Test</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="debug" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Bug className="h-4 w-4" />
            <span className="hidden sm:inline">Debug</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="c1" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">C1 AI</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="sample" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">GKG Sample</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="assistant" className="h-full mt-0">
            <AIPropertyAssistant
              availableProperties={properties}
              onPropertySelect={onPropertySelect}
              onPropertyContact={onPropertyContact}
              onAddToComparison={onAddToComparison}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="h-full mt-0">
            <PersonalizedRecommendations
              properties={properties}
              onPropertySelect={onPropertySelect}
              onPropertyContact={onPropertyContact}
              onAddToComparison={onAddToComparison}
            />
          </TabsContent>

          <TabsContent value="budget" className="h-full mt-0">
            <BudgetCalculator
              properties={properties}
              onCalculationComplete={(calculation) => {
                console.log('Calculation completed:', calculation);
              }}
            />
          </TabsContent>

          <TabsContent value="compare" className="h-full mt-0">
            <PropertyComparison
              properties={properties}
              comparisonCriteria={[
                'location',
                'price',
                'size',
                'amenities',
                'connectivity'
              ]}
              onComparisonComplete={(result) => {
                console.log('Comparison completed:', result);
              }}
            />
          </TabsContent>

          <TabsContent value="amenities" className="h-full mt-0">
            <AmenityExplorer
              properties={properties}
              onAmenityFilterChange={(filters) => {
                console.log('Amenity filters changed:', filters);
              }}
              onPropertyMatch={(matchedProperties) => {
                console.log('Properties matched:', matchedProperties);
              }}
            />
          </TabsContent>

          <TabsContent value="test" className="h-full mt-0">
            <GenUISdkTest />
          </TabsContent>

          <TabsContent value="debug" className="h-full mt-0">
            <StreamTestComponent />
          </TabsContent>

          <TabsContent value="c1" className="h-full mt-0">
            <C1RealEstateComponent
              availableProperties={properties}
              onPropertyAction={(action, propertyId) => {
                console.log('C1 Property Action:', action, propertyId);
                if (action === 'select' && propertyId && onPropertySelect) {
                  const property = properties.find(p => p.id === propertyId);
                  if (property) onPropertySelect(property);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="sample" className="h-full mt-0">
            <div className="h-full bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8">
                <Lightbulb className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-purple-800 mb-3">GKG Mandatory Integration! 🧠</h3>
                <p className="text-purple-700 mb-4">
                  GitLab Knowledge Graph (GKG) analysis is now mandatory for ALL development activities. 
                  Every development task leverages repository context and patterns.
                </p>
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-left text-sm">
                  <p className="font-semibold text-purple-800 mb-2">🚨 Mandatory Pre-Development:</p>
                  <ul className="text-purple-700 space-y-1 text-xs">
                    <li>✅ GKG server verification required</li>
                    <li>✅ Repository context analysis</li> 
                    <li>✅ Pattern discovery integration</li>
                    <li>✅ Agent coordination with GKG</li>
                    <li>✅ Evidence-based development</li>
                    <li>✅ SPARC + GKG methodology</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};