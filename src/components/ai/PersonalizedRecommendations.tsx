import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart,
  Star,
  MapPin,
  Building,
  Users,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Phone,
  Share2,
  RefreshCw,
  Sparkles,
  Target,
  Zap,
  Award,
  Clock,
  ArrowRight,
  Info,
  CheckCircle,
  Filter
} from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyRecommendation, UserPreferences, PropertyInteraction } from '@/types/thesys';
import { useAIStore } from '@/store/aiStore';
import { usePropertyStore } from '@/store/propertyStore';
import { useThesysC1 } from '@/hooks/useThesysC1';
import { GenUIRenderer } from './GenUIRenderer';

interface PersonalizedRecommendationsProps {
  userPreferences?: UserPreferences;
  userBehavior?: {
    viewedProperties: string[];
    timeSpent: Record<string, number>;
    interactions: PropertyInteraction[];
  };
  onPropertySelect?: (property: Property) => void;
  onViewProperty?: (property: Property) => void;
  onContactProperty?: (property: Property) => void;
  onFeedback?: (propertyId: string, feedback: 'like' | 'dislike') => void;
  className?: string;
}

interface RecommendationCard extends PropertyRecommendation {
  matchingCriteria: string[];
  uniqueSellingPoint: string;
  similarProperties: Property[];
  trend: 'up' | 'down' | 'stable';
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  userPreferences,
  userBehavior,
  onPropertySelect,
  onViewProperty,
  onContactProperty,
  onFeedback,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'size' | 'rating'>('relevance');
  const [showExplanations, setShowExplanations] = useState(true);

  const { properties } = usePropertyStore();
  const { 
    userPreferences: storePreferences, 
    browsingHistory,
    recommendationCache,
    updateRecommendationFeedback 
  } = useAIStore();

  const {
    uiSpec,
    loading: aiLoading,
    error: aiError,
    generateUI,
    regenerate
  } = useThesysC1();

  const effectivePreferences = userPreferences || storePreferences;
  const effectiveBehavior = userBehavior || {
    viewedProperties: browsingHistory.map(b => b.propertyId),
    timeSpent: browsingHistory.reduce((acc, b) => ({
      ...acc,
      [b.propertyId]: b.timeSpent || 0
    }), {}),
    interactions: browsingHistory
  };

  useEffect(() => {
    generatePersonalizedRecommendations();
  }, [effectivePreferences, effectiveBehavior, properties]);

  useEffect(() => {
    generateAIRecommendations();
  }, [recommendations]);

  const generatePersonalizedRecommendations = async () => {
    setLoading(true);

    try {
      // Check cache first
      if (recommendationCache.recommendations.length > 0) {
        const cachedRecommendations = await enrichRecommendations(recommendationCache.recommendations);
        setRecommendations(cachedRecommendations);
        setLoading(false);
        return;
      }

      // Generate new recommendations
      const scored = await scoreProperties();
      const filtered = await filterByPreferences(scored);
      const enriched = await enrichRecommendations(filtered);
      const sorted = sortRecommendations(enriched);

      setRecommendations(sorted.slice(0, 6)); // Top 6 recommendations
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const scoreProperties = async (): Promise<PropertyRecommendation[]> => {
    return properties.map(property => {
      let score = 0;
      const reasoning: string[] = [];

      // Location preference scoring
      if (effectivePreferences.preferredLocation) {
        const locationMatch = property.location.toLowerCase().includes(
          effectivePreferences.preferredLocation.toLowerCase()
        );
        if (locationMatch) {
          score += 25;
          reasoning.push(`Matches your preferred location: ${effectivePreferences.preferredLocation}`);
        }
      }

      // Size preference scoring
      if (effectivePreferences.spaceSize && property.area) {
        const { min, max } = effectivePreferences.spaceSize;
        if (property.area >= min && property.area <= max) {
          score += 20;
          reasoning.push(`Perfect size match (${property.area} sqft)`);
        } else if (property.area >= min * 0.8 && property.area <= max * 1.2) {
          score += 10;
          reasoning.push(`Good size fit (${property.area} sqft)`);
        }
      }

      // Amenities scoring
      if (effectivePreferences.amenities) {
        const matchingAmenities = effectivePreferences.amenities.filter(amenity =>
          property.tags.some(tag => tag.toLowerCase().includes(amenity.toLowerCase()))
        );
        score += matchingAmenities.length * 8;
        if (matchingAmenities.length > 0) {
          reasoning.push(`Has ${matchingAmenities.length} of your preferred amenities`);
        }
      }

      // Working style scoring
      if (effectivePreferences.workingStyle) {
        const workingStyleBonus = calculateWorkingStyleMatch(property, effectivePreferences.workingStyle);
        score += workingStyleBonus;
        if (workingStyleBonus > 0) {
          reasoning.push(`Suitable for ${effectivePreferences.workingStyle} working style`);
        }
      }

      // Browsing behavior scoring
      const behaviorScore = calculateBehaviorScore(property.id);
      score += behaviorScore;
      if (behaviorScore > 0) {
        reasoning.push('Based on your browsing behavior');
      }

      // Popular properties boost
      const popularityScore = Math.min(property.tags.length * 2, 10);
      score += popularityScore;

      return {
        property,
        score: Math.min(score, 100),
        reasoning,
        confidence: calculateConfidence(score, reasoning.length)
      };
    });
  };

  const calculateWorkingStyleMatch = (property: Property, workingStyle: string): number => {
    const styleMapping = {
      'private': ['private office', 'individual', 'quiet', 'focus'],
      'collaborative': ['co-working', 'shared', 'meeting rooms', 'collaboration'],
      'hybrid': ['flexible', 'hot desk', 'meeting rooms', 'variety']
    };

    const keywords = styleMapping[workingStyle as keyof typeof styleMapping] || [];
    const matches = keywords.filter(keyword =>
      property.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
      property.title.toLowerCase().includes(keyword) ||
      property.description?.toLowerCase().includes(keyword)
    );

    return matches.length * 5;
  };

  const calculateBehaviorScore = (propertyId: string): number => {
    const timeSpent = effectiveBehavior.timeSpent[propertyId] || 0;
    const interactions = effectiveBehavior.interactions.filter(i => i.propertyId === propertyId);
    
    let score = 0;
    
    // Time spent scoring
    if (timeSpent > 60) score += 15; // More than 1 minute
    else if (timeSpent > 30) score += 10; // More than 30 seconds
    else if (timeSpent > 10) score += 5; // More than 10 seconds

    // Interaction scoring
    interactions.forEach(interaction => {
      switch (interaction.action) {
        case 'save': score += 20; break;
        case 'contact': score += 15; break;
        case 'compare': score += 10; break;
        case 'view': score += 5; break;
      }
    });

    return Math.min(score, 25);
  };

  const calculateConfidence = (score: number, reasoningCount: number): number => {
    const baseConfidence = Math.min(score / 80, 1);
    const reasoningBonus = Math.min(reasoningCount * 0.1, 0.3);
    return Math.round((baseConfidence + reasoningBonus) * 100) / 100;
  };

  const filterByPreferences = async (recommendations: PropertyRecommendation[]): Promise<PropertyRecommendation[]> => {
    return recommendations.filter(rec => {
      // Filter out properties that don't meet minimum requirements
      if (effectivePreferences.budgetRange && rec.property.category) {
        // Add budget filtering logic here if price data is available
      }

      if (effectivePreferences.spaceSize && rec.property.area) {
        const { min, max } = effectivePreferences.spaceSize;
        // Allow some flexibility (±20%)
        if (rec.property.area < min * 0.8 || rec.property.area > max * 1.2) {
          return false;
        }
      }

      return rec.score > 20; // Minimum score threshold
    });
  };

  const enrichRecommendations = async (recommendations: PropertyRecommendation[]): Promise<RecommendationCard[]> => {
    return recommendations.map(rec => {
      // Find matching criteria
      const matchingCriteria: string[] = [];
      if (effectivePreferences.preferredLocation && 
          rec.property.location.toLowerCase().includes(effectivePreferences.preferredLocation.toLowerCase())) {
        matchingCriteria.push('Location');
      }
      if (effectivePreferences.amenities) {
        const matches = effectivePreferences.amenities.filter(amenity =>
          rec.property.tags.some(tag => tag.toLowerCase().includes(amenity.toLowerCase()))
        );
        matchingCriteria.push(...matches);
      }

      // Determine unique selling point
      let uniqueSellingPoint = 'Great value property';
      if (rec.score > 80) uniqueSellingPoint = 'Perfect match for your needs';
      else if (rec.property.tags.includes('premium')) uniqueSellingPoint = 'Premium amenities';
      else if (rec.property.location.toLowerCase().includes('koramangala')) uniqueSellingPoint = 'Prime location';

      // Find similar properties
      const similarProperties = properties
        .filter(p => p.id !== rec.property.id && p.location === rec.property.location)
        .slice(0, 3);

      return {
        ...rec,
        matchingCriteria,
        uniqueSellingPoint,
        similarProperties,
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
      };
    });
  };

  const sortRecommendations = (recommendations: RecommendationCard[]): RecommendationCard[] => {
    return [...recommendations].sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.score - a.score;
        case 'price':
          // Mock price sorting (would use real price data)
          return a.property.title.localeCompare(b.property.title);
        case 'size':
          return (b.property.area || 0) - (a.property.area || 0);
        case 'rating':
          return b.confidence - a.confidence;
        default:
          return b.score - a.score;
      }
    });
  };

  const generateAIRecommendations = async () => {
    if (recommendations.length === 0) return;

    try {
      await generateUI(
        `Generate personalized property recommendations with explanations`,
        {
          userPreferences: effectivePreferences,
          availableProperties: recommendations.map(r => r.property),
          userBehavior: effectiveBehavior
        }
      );
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
    }
  };

  const handleFeedback = (propertyId: string, feedback: 'like' | 'dislike') => {
    updateRecommendationFeedback(propertyId, feedback);
    onFeedback?.(propertyId, feedback);

    // Update local recommendations
    setRecommendations(prev => prev.map(rec => {
      if (rec.property.id === propertyId) {
        return {
          ...rec,
          score: feedback === 'like' ? Math.min(rec.score + 10, 100) : Math.max(rec.score - 10, 0)
        };
      }
      return rec;
    }));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default: return <Zap className="h-3 w-3 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <Card className={`w-full bg-white shadow-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analyzing Your Preferences
          </h3>
          <p className="text-gray-600">
            Creating personalized property recommendations just for you...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`w-full bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Personalized Recommendations
            </h2>
            <p className="text-sm text-gray-600">
              {recommendations.length} properties tailored to your preferences
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExplanations(!showExplanations)}
          >
            <Info className="h-4 w-4 mr-1" />
            {showExplanations ? 'Hide' : 'Show'} Why
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => generatePersonalizedRecommendations()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI-Generated Recommendation Insights */}
      {uiSpec && (
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-medium">AI-Powered Insights</h3>
          </div>
          <GenUIRenderer
            uiSpec={uiSpec}
            context={{
              userPreferences: effectivePreferences,
              recommendations: recommendations.map(r => r.property),
              userBehavior: effectiveBehavior
            }}
          />
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="relevance">Relevance</option>
                <option value="price">Price</option>
                <option value="size">Size</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Last updated: {recommendationCache.lastUpdated ? 
              new Date(recommendationCache.lastUpdated).toLocaleTimeString() : 
              'Just now'
            }
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="p-6">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Update your preferences to get personalized recommendations
            </p>
            <Button onClick={() => generatePersonalizedRecommendations()}>
              Generate Recommendations
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <Card key={rec.property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="relative">
                  <img 
                    src={rec.property.images[0] || '/placeholder-property.jpg'} 
                    alt={rec.property.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Score Badge */}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full border text-xs font-medium ${getScoreColor(rec.score)}`}>
                    <Star className="h-3 w-3 inline mr-1" />
                    {Math.round(rec.score)}% match
                  </div>
                  
                  {/* Trend Indicator */}
                  <div className="absolute top-3 right-3 bg-white rounded-full p-1">
                    {getTrendIcon(rec.trend)}
                  </div>
                  
                  {/* Ranking Badge */}
                  {index < 3 && (
                    <div className="absolute bottom-3 left-3 bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                      #{index + 1} Recommended
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {/* Property Title */}
                  <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                    {rec.property.title}
                  </h3>
                  
                  {/* Location and Size */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {rec.property.location}
                    </div>
                    {rec.property.area && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {rec.property.area} sqft
                      </div>
                    )}
                  </div>

                  {/* Unique Selling Point */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {rec.uniqueSellingPoint}
                      </span>
                    </div>
                  </div>

                  {/* Matching Criteria */}
                  {rec.matchingCriteria.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {rec.matchingCriteria.slice(0, 3).map((criteria, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <CheckCircle className="h-2 w-2 mr-1" />
                            {criteria}
                          </Badge>
                        ))}
                        {rec.matchingCriteria.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{rec.matchingCriteria.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Why Recommended */}
                  {showExplanations && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-xs font-medium text-blue-900 mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Why recommended:
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        {rec.reasoning.slice(0, 2).map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-blue-500 mt-0.5">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-600">Confidence</span>
                          <span className="font-medium">{Math.round(rec.confidence * 100)}%</span>
                        </div>
                        <Progress value={rec.confidence * 100} className="h-1 mt-1" />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewProperty?.(rec.property)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onContactProperty?.(rec.property)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFeedback(rec.property.id, 'like')}
                        className="p-1 text-gray-400 hover:text-green-500"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFeedback(rec.property.id, 'dislike')}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Similar Properties */}
      {recommendations.length > 0 && (
        <div className="p-6 border-t bg-gray-50">
          <h3 className="text-lg font-medium mb-4">You might also like</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {properties
              .filter(p => !recommendations.find(r => r.property.id === p.id))
              .slice(0, 3)
              .map((property) => (
                <div key={property.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => onViewProperty?.(property)}>
                  <img 
                    src={property.images[0] || '/placeholder-property.jpg'} 
                    alt={property.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{property.title}</p>
                    <p className="text-xs text-gray-500">{property.location}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};