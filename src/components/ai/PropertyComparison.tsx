import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3,
  MapPin,
  Users,
  Building,
  Wifi,
  Car,
  Coffee,
  Shield,
  Star,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  Minus,
  Sparkles,
  Eye,
  Phone,
  Heart,
  Share2,
  Download
} from 'lucide-react';
import { Property } from '@/types/property';
import { ComparisonContext, UserPreferences } from '@/types/thesys';
import { useAIStore } from '@/store/aiStore';
import { useThesysC1 } from '@/hooks/useThesysC1';
import { GenUIRenderer } from './GenUIRenderer';

interface PropertyComparisonProps {
  properties: Property[];
  criteria?: string[];
  userPriorities?: string[];
  onPropertySelect?: (property: Property) => void;
  onViewProperty?: (property: Property) => void;
  onContactProperty?: (property: Property) => void;
  className?: string;
}

interface ComparisonScore {
  overall: number;
  location: number;
  amenities: number;
  size: number;
  value: number;
}

interface ComparisonInsight {
  type: 'pro' | 'con' | 'neutral';
  category: string;
  text: string;
  importance: 'high' | 'medium' | 'low';
}

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({
  properties,
  criteria = ['location', 'size', 'amenities', 'price'],
  userPriorities = [],
  onPropertySelect,
  onViewProperty,
  onContactProperty,
  className = ''
}) => {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>(properties.slice(0, 3));
  const [comparisonMode, setComparisonMode] = useState<'table' | 'cards' | 'chart'>('table');
  const [scores, setScores] = useState<Map<string, ComparisonScore>>(new Map());
  const [insights, setInsights] = useState<Map<string, ComparisonInsight[]>>(new Map());
  const [recommendedProperty, setRecommendedProperty] = useState<Property | null>(null);

  const { userPreferences } = useAIStore();
  const {
    uiSpec,
    loading,
    error,
    generateUI
  } = useThesysC1();

  useEffect(() => {
    calculateComparisonScores();
    generateInsights();
    generateAIComparison();
  }, [selectedProperties, userPriorities]);

  const calculateComparisonScores = () => {
    const newScores = new Map<string, ComparisonScore>();

    selectedProperties.forEach(property => {
      // Calculate scores based on various factors
      const locationScore = calculateLocationScore(property);
      const amenitiesScore = calculateAmenitiesScore(property);
      const sizeScore = calculateSizeScore(property);
      const valueScore = calculateValueScore(property);
      
      const overall = (locationScore + amenitiesScore + sizeScore + valueScore) / 4;

      newScores.set(property.id, {
        overall: Math.round(overall * 10) / 10,
        location: Math.round(locationScore * 10) / 10,
        amenities: Math.round(amenitiesScore * 10) / 10,
        size: Math.round(sizeScore * 10) / 10,
        value: Math.round(valueScore * 10) / 10
      });
    });

    setScores(newScores);

    // Find recommended property (highest overall score)
    let bestProperty = null;
    let bestScore = 0;
    
    selectedProperties.forEach(property => {
      const score = newScores.get(property.id);
      if (score && score.overall > bestScore) {
        bestScore = score.overall;
        bestProperty = property;
      }
    });
    
    setRecommendedProperty(bestProperty);
  };

  const calculateLocationScore = (property: Property): number => {
    // Mock scoring based on location desirability
    const locationScores: Record<string, number> = {
      'koramangala': 9.0,
      'indiranagar': 8.5,
      'whitefield': 8.0,
      'hsr layout': 8.5,
      'electronic city': 7.5,
      'marathahalli': 7.0
    };

    const location = property.location.toLowerCase();
    return locationScores[location] || 7.0;
  };

  const calculateAmenitiesScore = (property: Property): number => {
    const totalAmenities = property.tags.length;
    const importantAmenities = property.tags.filter(tag => 
      ['parking', 'wifi', 'meeting rooms', 'cafeteria', 'security'].includes(tag.toLowerCase())
    ).length;

    return Math.min((totalAmenities * 0.5 + importantAmenities * 2), 10);
  };

  const calculateSizeScore = (property: Property): number => {
    // Score based on how well the size matches user preferences
    if (!userPreferences.spaceSize) return 8.0;
    
    const { min, max } = userPreferences.spaceSize;
    const propertySize = property.area || 1000; // Default size if not specified
    
    if (propertySize >= min && propertySize <= max) return 10.0;
    if (propertySize < min) return Math.max(6.0, 10 - ((min - propertySize) / min) * 4);
    return Math.max(6.0, 10 - ((propertySize - max) / max) * 4);
  };

  const calculateValueScore = (property: Property): number => {
    // Mock value scoring (in real app, this would consider price vs features)
    const baseScore = 8.0;
    const amenityBonus = property.tags.length * 0.1;
    return Math.min(baseScore + amenityBonus, 10);
  };

  const generateInsights = () => {
    const newInsights = new Map<string, ComparisonInsight[]>();

    selectedProperties.forEach(property => {
      const propertyInsights: ComparisonInsight[] = [];
      const score = scores.get(property.id);

      if (!score) return;

      // Generate insights based on scores
      if (score.location >= 8.5) {
        propertyInsights.push({
          type: 'pro',
          category: 'Location',
          text: 'Excellent location with great connectivity and nearby amenities',
          importance: 'high'
        });
      } else if (score.location < 7.0) {
        propertyInsights.push({
          type: 'con',
          category: 'Location',
          text: 'Location may have limited connectivity or fewer nearby amenities',
          importance: 'medium'
        });
      }

      if (score.amenities >= 8.0) {
        propertyInsights.push({
          type: 'pro',
          category: 'Amenities',
          text: 'Comprehensive amenities package with all essential facilities',
          importance: 'high'
        });
      }

      if (score.size >= 9.0) {
        propertyInsights.push({
          type: 'pro',
          category: 'Space',
          text: 'Perfect size match for your team requirements',
          importance: 'high'
        });
      } else if (score.size < 7.0) {
        propertyInsights.push({
          type: 'con',
          category: 'Space',
          text: 'Space size may not be optimal for your team',
          importance: 'medium'
        });
      }

      if (score.value >= 8.5) {
        propertyInsights.push({
          type: 'pro',
          category: 'Value',
          text: 'Excellent value for money with great features',
          importance: 'medium'
        });
      }

      newInsights.set(property.id, propertyInsights);
    });

    setInsights(newInsights);
  };

  const generateAIComparison = async () => {
    if (selectedProperties.length < 2) return;

    try {
      const context: ComparisonContext = {
        properties: selectedProperties,
        criteria,
        userPriorities
      };

      await generateUI(
        `Generate a detailed comparison analysis for ${selectedProperties.length} properties with insights and recommendations`,
        context
      );
    } catch (error) {
      console.error('Failed to generate AI comparison:', error);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8.5) return 'text-green-600 bg-green-50';
    if (score >= 7.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getInsightIcon = (type: ComparisonInsight['type']) => {
    switch (type) {
      case 'pro': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'con': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'neutral': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderTableComparison = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-medium text-gray-900 bg-gray-50">Feature</th>
            {selectedProperties.map((property) => (
              <th key={property.id} className="text-center p-4 font-medium text-gray-900 bg-gray-50 min-w-48">
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={property.images[0] || '/placeholder-property.jpg'} 
                    alt={property.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <span className="text-sm">{property.title}</span>
                  {recommendedProperty?.id === property.id && (
                    <Badge className="bg-green-100 text-green-700">Recommended</Badge>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-4 font-medium">Location</td>
            {selectedProperties.map((property) => (
              <td key={`${property.id}-location`} className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{property.location}</span>
                </div>
              </td>
            ))}
          </tr>
          
          <tr className="border-b">
            <td className="p-4 font-medium">Size</td>
            {selectedProperties.map((property) => (
              <td key={`${property.id}-size`} className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{property.area || 'N/A'} sqft</span>
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-b">
            <td className="p-4 font-medium">Category</td>
            {selectedProperties.map((property) => (
              <td key={`${property.id}-category`} className="p-4 text-center">
                <Badge variant="outline">{property.category}</Badge>
              </td>
            ))}
          </tr>

          <tr className="border-b">
            <td className="p-4 font-medium">Amenities</td>
            {selectedProperties.map((property) => (
              <td key={`${property.id}-amenities`} className="p-4">
                <div className="flex flex-wrap gap-1 justify-center">
                  {property.tags.slice(0, 4).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {property.tags.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{property.tags.length - 4}
                    </Badge>
                  )}
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-b bg-blue-50">
            <td className="p-4 font-medium">Overall Score</td>
            {selectedProperties.map((property) => {
              const score = scores.get(property.id);
              return (
                <td key={`${property.id}-score`} className="p-4 text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score?.overall || 0)}`}>
                    <Star className="h-3 w-3 mr-1" />
                    {score?.overall || 'N/A'}/10
                  </div>
                </td>
              );
            })}
          </tr>

          <tr>
            <td className="p-4 font-medium">Actions</td>
            {selectedProperties.map((property) => (
              <td key={`${property.id}-actions`} className="p-4">
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => onViewProperty?.(property)}
                    className="w-full"
                    variant="outline"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onContactProperty?.(property)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderCardComparison = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {selectedProperties.map((property) => {
        const score = scores.get(property.id);
        const propertyInsights = insights.get(property.id) || [];
        const isRecommended = recommendedProperty?.id === property.id;

        return (
          <Card key={property.id} className={`p-6 ${isRecommended ? 'border-green-500 bg-green-50' : ''}`}>
            {isRecommended && (
              <div className="flex items-center justify-center mb-4">
                <Badge className="bg-green-100 text-green-700">
                  <Star className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </div>
            )}
            
            <img 
              src={property.images[0] || '/placeholder-property.jpg'} 
              alt={property.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            
            <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                {property.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                {property.area || 'Size not specified'} sqft
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getScoreColor(score?.overall || 0)}`}>
                  {score?.overall || 'N/A'}/10
                </div>
                <p className="text-xs text-gray-500 mt-1">Overall</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getScoreColor(score?.location || 0)}`}>
                  {score?.location || 'N/A'}/10
                </div>
                <p className="text-xs text-gray-500 mt-1">Location</p>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-2 mb-4">
              {propertyInsights.slice(0, 2).map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  {getInsightIcon(insight.type)}
                  <span className="text-xs text-gray-600">{insight.text}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewProperty?.(property)}
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                onClick={() => onContactProperty?.(property)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Phone className="h-3 w-3 mr-1" />
                Contact
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <Card className={`w-full bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Property Comparison
            </h2>
            <p className="text-sm text-gray-600">
              Comparing {selectedProperties.length} properties
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="cards">Cards</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* AI-Generated Comparison Insights */}
      {uiSpec && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-medium">AI Comparison Insights</h3>
          </div>
          <GenUIRenderer
            uiSpec={uiSpec}
            context={{
              properties: selectedProperties,
              criteria,
              userPriorities,
              scores: Object.fromEntries(scores),
              insights: Object.fromEntries(insights)
            }}
          />
        </div>
      )}

      {/* Recommended Property Banner */}
      {recommendedProperty && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                Based on your preferences, we recommend: <strong>{recommendedProperty.title}</strong>
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => onViewProperty?.(recommendedProperty)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Comparison Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating intelligent comparison...</p>
          </div>
        ) : comparisonMode === 'table' ? (
          renderTableComparison()
        ) : comparisonMode === 'cards' ? (
          renderCardComparison()
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Chart view coming soon</p>
          </div>
        )}
      </div>

      {/* Property Selection */}
      {properties.length > selectedProperties.length && (
        <div className="p-6 border-t bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Add More Properties to Compare</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {properties
              .filter(p => !selectedProperties.find(sp => sp.id === p.id))
              .slice(0, 3)
              .map((property) => (
                <div key={property.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                  <img 
                    src={property.images[0] || '/placeholder-property.jpg'} 
                    alt={property.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{property.title}</p>
                    <p className="text-xs text-gray-500">{property.location}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedProperties.length < 4) {
                        setSelectedProperties([...selectedProperties, property]);
                      }
                    }}
                    disabled={selectedProperties.length >= 4}
                  >
                    Add
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};