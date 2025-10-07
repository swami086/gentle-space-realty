import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Filter,
  MapPin,
  Star,
  Wifi,
  Car,
  Coffee,
  Users,
  Shield,
  Zap,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Map,
  Grid,
  List,
  TrendingUp,
  Award,
  Navigation,
  Phone,
  Eye,
  Heart,
  Share2
} from 'lucide-react';
import { Property } from '@/types/property';
import { UserPreferences } from '@/types/thesys';
import { usePropertyStore } from '@/store/propertyStore';
import { useAIStore } from '@/store/aiStore';
import { useThesysC1 } from '@/hooks/useThesysC1';
import { GenUIRenderer } from './GenUIRenderer';

interface AmenityExplorerProps {
  properties?: Property[];
  userPreferences?: UserPreferences;
  onPropertySelect?: (property: Property) => void;
  onViewProperty?: (property: Property) => void;
  onContactProperty?: (property: Property) => void;
  className?: string;
}

interface AmenityData {
  id: string;
  name: string;
  category: 'essential' | 'comfort' | 'productivity' | 'leisure' | 'location';
  icon: React.ReactNode;
  importance: number; // 1-5 scale
  description: string;
  relatedTerms: string[];
}

interface PropertyAmenityScore {
  property: Property;
  score: number;
  matches: AmenityData[];
  missing: AmenityData[];
  nearbyFacilities: NearbyFacility[];
}

interface NearbyFacility {
  type: 'restaurant' | 'metro' | 'hospital' | 'bank' | 'gym' | 'shopping';
  name: string;
  distance: string;
  rating?: number;
}

export const AmenityExplorer: React.FC<AmenityExplorerProps> = ({
  properties: propProperties,
  userPreferences,
  onPropertySelect,
  onViewProperty,
  onContactProperty,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [importanceFilter, setImportanceFilter] = useState<number>(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [propertyScores, setPropertyScores] = useState<PropertyAmenityScore[]>([]);
  const [loading, setLoading] = useState(false);

  const { properties: storeProperties } = usePropertyStore();
  const { userPreferences: storePreferences } = useAIStore();
  const {
    uiSpec,
    loading: aiLoading,
    error: aiError,
    generateUI
  } = useThesysC1();

  const properties = propProperties || storeProperties;
  const effectivePreferences = userPreferences || storePreferences;

  // Define comprehensive amenity data
  const amenityData: AmenityData[] = [
    {
      id: 'wifi',
      name: 'High-Speed WiFi',
      category: 'essential',
      icon: <Wifi className="h-4 w-4" />,
      importance: 5,
      description: 'Reliable high-speed internet connectivity',
      relatedTerms: ['internet', 'broadband', 'fiber', 'connectivity']
    },
    {
      id: 'parking',
      name: 'Parking Space',
      category: 'essential',
      icon: <Car className="h-4 w-4" />,
      importance: 4,
      description: 'Dedicated parking facilities for vehicles',
      relatedTerms: ['car park', 'vehicle', 'valet', 'garage']
    },
    {
      id: 'security',
      name: '24/7 Security',
      category: 'essential',
      icon: <Shield className="h-4 w-4" />,
      importance: 5,
      description: 'Round-the-clock security and surveillance',
      relatedTerms: ['cctv', 'guard', 'access control', 'surveillance']
    },
    {
      id: 'meeting-rooms',
      name: 'Meeting Rooms',
      category: 'productivity',
      icon: <Users className="h-4 w-4" />,
      importance: 4,
      description: 'Professional meeting and conference rooms',
      relatedTerms: ['conference', 'boardroom', 'discussion', 'presentation']
    },
    {
      id: 'cafeteria',
      name: 'Cafeteria',
      category: 'comfort',
      icon: <Coffee className="h-4 w-4" />,
      importance: 3,
      description: 'On-site food and beverage facilities',
      relatedTerms: ['food court', 'restaurant', 'dining', 'canteen']
    },
    {
      id: 'power-backup',
      name: 'Power Backup',
      category: 'essential',
      icon: <Zap className="h-4 w-4" />,
      importance: 4,
      description: 'Uninterrupted power supply with backup',
      relatedTerms: ['generator', 'ups', 'electricity', 'power']
    },
    {
      id: 'gym',
      name: 'Fitness Center',
      category: 'leisure',
      icon: <TrendingUp className="h-4 w-4" />,
      importance: 2,
      description: 'On-site fitness and wellness facilities',
      relatedTerms: ['fitness', 'exercise', 'wellness', 'health']
    },
    {
      id: 'reception',
      name: 'Reception/Front Desk',
      category: 'comfort',
      icon: <Building className="h-4 w-4" />,
      importance: 3,
      description: 'Professional reception and visitor management',
      relatedTerms: ['front desk', 'concierge', 'visitor', 'lobby']
    },
    {
      id: 'lounge',
      name: 'Common Lounge',
      category: 'comfort',
      icon: <Users className="h-4 w-4" />,
      importance: 2,
      description: 'Shared relaxation and networking space',
      relatedTerms: ['common area', 'break room', 'social', 'networking']
    },
    {
      id: 'metro-access',
      name: 'Metro Accessibility',
      category: 'location',
      icon: <Navigation className="h-4 w-4" />,
      importance: 4,
      description: 'Easy access to metro/public transport',
      relatedTerms: ['metro', 'subway', 'public transport', 'connectivity']
    }
  ];

  useEffect(() => {
    if (effectivePreferences.amenities) {
      setSelectedAmenities(effectivePreferences.amenities);
    }
  }, [effectivePreferences]);

  useEffect(() => {
    calculatePropertyScores();
  }, [properties, selectedAmenities, importanceFilter]);

  useEffect(() => {
    if (propertyScores.length > 0) {
      generateAIAmenityInsights();
    }
  }, [propertyScores]);

  const calculatePropertyScores = async () => {
    setLoading(true);

    try {
      const scores: PropertyAmenityScore[] = properties.map(property => {
        const matches: AmenityData[] = [];
        const missing: AmenityData[] = [];

        // Determine which amenities the property has
        amenityData.forEach(amenity => {
          const hasAmenity = property.tags.some(tag =>
            amenity.relatedTerms.some(term =>
              tag.toLowerCase().includes(term.toLowerCase())
            ) || tag.toLowerCase().includes(amenity.name.toLowerCase())
          );

          if (hasAmenity || selectedAmenities.includes(amenity.id)) {
            if (hasAmenity) {
              matches.push(amenity);
            } else {
              missing.push(amenity);
            }
          }
        });

        // Calculate score based on matches and importance
        const totalImportance = selectedAmenities.length > 0 
          ? amenityData.filter(a => selectedAmenities.includes(a.id)).reduce((sum, a) => sum + a.importance, 0)
          : amenityData.reduce((sum, a) => sum + a.importance, 0);
        
        const matchedImportance = matches.reduce((sum, a) => sum + a.importance, 0);
        const score = totalImportance > 0 ? (matchedImportance / totalImportance) * 100 : 0;

        // Generate mock nearby facilities
        const nearbyFacilities = generateNearbyFacilities(property);

        return {
          property,
          score: Math.round(score * 10) / 10,
          matches,
          missing,
          nearbyFacilities
        };
      });

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);
      setPropertyScores(scores);
    } catch (error) {
      console.error('Failed to calculate property scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNearbyFacilities = (property: Property): NearbyFacility[] => {
    // Mock nearby facilities based on location
    const facilitiesByLocation: Record<string, NearbyFacility[]> = {
      'koramangala': [
        { type: 'metro', name: 'Koramangala Metro Station', distance: '0.5 km', rating: 4.2 },
        { type: 'restaurant', name: 'Social Koramangala', distance: '0.2 km', rating: 4.5 },
        { type: 'hospital', name: 'Manipal Hospital', distance: '1.2 km', rating: 4.3 },
        { type: 'shopping', name: 'Forum Mall', distance: '0.8 km', rating: 4.4 }
      ],
      'indiranagar': [
        { type: 'metro', name: 'Indiranagar Metro Station', distance: '0.3 km', rating: 4.1 },
        { type: 'restaurant', name: 'Toit Brewpub', distance: '0.4 km', rating: 4.6 },
        { type: 'hospital', name: 'St. Theresa Hospital', distance: '0.9 km', rating: 4.2 },
        { type: 'gym', name: 'Gold\'s Gym', distance: '0.6 km', rating: 4.3 }
      ]
    };

    const locationKey = property.location.toLowerCase();
    return facilitiesByLocation[locationKey] || [
      { type: 'restaurant', name: 'Local Restaurant', distance: '0.5 km' },
      { type: 'bank', name: 'ATM/Bank', distance: '0.3 km' }
    ];
  };

  const generateAIAmenityInsights = async () => {
    if (propertyScores.length === 0) return;

    try {
      await generateUI(
        `Generate amenity exploration interface with scoring and nearby facilities`,
        {
          amenities: selectedAmenities,
          properties: propertyScores.map(ps => ps.property)
        }
      );
    } catch (error) {
      console.error('Failed to generate AI amenity insights:', error);
    }
  };

  const filteredAmenities = amenityData.filter(amenity => {
    const matchesSearch = amenity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         amenity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || amenity.category === categoryFilter;
    const matchesImportance = amenity.importance >= importanceFilter;
    
    return matchesSearch && matchesCategory && matchesImportance;
  });

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getFacilityIcon = (type: string) => {
    const icons = {
      'restaurant': <Coffee className="h-3 w-3" />,
      'metro': <Navigation className="h-3 w-3" />,
      'hospital': <Building className="h-3 w-3" />,
      'bank': <Building className="h-3 w-3" />,
      'gym': <TrendingUp className="h-3 w-3" />,
      'shopping': <Building className="h-3 w-3" />
    };
    return icons[type as keyof typeof icons] || <MapPin className="h-3 w-3" />;
  };

  const renderPropertyCard = (scoreData: PropertyAmenityScore) => {
    const { property, score, matches, missing, nearbyFacilities } = scoreData;

    return (
      <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={property.images[0] || '/placeholder-property.jpg'} 
            alt={property.title}
            className="w-full h-48 object-cover"
          />
          
          {/* Score Badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full border text-xs font-medium ${getScoreColor(score)}`}>
            <Award className="h-3 w-3 inline mr-1" />
            {score}% match
          </div>
          
          {/* View Mode Toggle */}
          <div className="absolute top-3 right-3 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="bg-white/90 backdrop-blur-sm p-1 h-auto"
              onClick={() => onViewProperty?.(property)}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="bg-white/90 backdrop-blur-sm p-1 h-auto"
            >
              <Heart className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1">{property.title}</h3>
          
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <MapPin className="h-3 w-3" />
            {property.location}
            {property.area && (
              <>
                <span>•</span>
                <Building className="h-3 w-3" />
                {property.area} sqft
              </>
            )}
          </div>

          {/* Matching Amenities */}
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Available ({matches.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {matches.slice(0, 4).map(amenity => (
                <Badge key={amenity.id} variant="default" className="text-xs bg-green-100 text-green-700">
                  {amenity.icon}
                  <span className="ml-1">{amenity.name}</span>
                </Badge>
              ))}
              {matches.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{matches.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Missing Amenities */}
          {missing.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                Missing ({missing.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {missing.slice(0, 3).map(amenity => (
                  <Badge key={amenity.id} variant="outline" className="text-xs text-red-600">
                    {amenity.name}
                  </Badge>
                ))}
                {missing.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{missing.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Nearby Facilities */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Map className="h-3 w-3" />
              Nearby
            </h4>
            <div className="space-y-1">
              {nearbyFacilities.slice(0, 3).map((facility, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                  {getFacilityIcon(facility.type)}
                  <span className="flex-1">{facility.name}</span>
                  <span className="text-gray-400">{facility.distance}</span>
                  {facility.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-2 w-2 fill-current text-yellow-400" />
                      <span>{facility.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewProperty?.(property)}
              className="flex-1 mr-2"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
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
        </div>
      </Card>
    );
  };

  return (
    <Card className={`w-full bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Amenity Explorer
            </h2>
            <p className="text-sm text-gray-600">
              Find properties with amenities that matter to you
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="rounded-none border-l border-r"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              onClick={() => setViewMode('map')}
              className="rounded-l-none"
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="explorer" className="w-full">
        <TabsList className="w-full grid grid-cols-3 p-6 pb-0">
          <TabsTrigger value="explorer">Explorer</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="p-6 space-y-6">
          {/* Amenity Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Select Important Amenities</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAmenities([])}
              >
                Clear All
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search amenities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                <option value="essential">Essential</option>
                <option value="comfort">Comfort</option>
                <option value="productivity">Productivity</option>
                <option value="leisure">Leisure</option>
                <option value="location">Location</option>
              </select>
            </div>

            {/* Amenity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAmenities.map(amenity => (
                <div
                  key={amenity.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAmenities.includes(amenity.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleAmenity(amenity.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedAmenities.includes(amenity.id)}
                      onChange={() => {}} // Handled by div click
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {amenity.icon}
                        <span className="text-sm font-medium">{amenity.name}</span>
                        <div className="flex">
                          {Array.from({ length: amenity.importance }, (_, i) => (
                            <Star key={i} className="h-2 w-2 fill-current text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{amenity.description}</p>
                      <Badge variant="secondary" className="text-xs mt-1 capitalize">
                        {amenity.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          {propertyScores.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Property Matches ({propertyScores.length})
                </h3>
                <div className="text-sm text-gray-600">
                  Sorted by amenity score
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-300 h-48 rounded-t-lg"></div>
                      <div className="p-4 space-y-3">
                        <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                        <div className="bg-gray-300 h-3 rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="bg-gray-300 h-6 rounded w-16"></div>
                          <div className="bg-gray-300 h-6 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {propertyScores.map(renderPropertyCard)}
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-4">
                  {propertyScores.map(scoreData => (
                    <Card key={scoreData.property.id} className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src={scoreData.property.images[0] || '/placeholder-property.jpg'} 
                          alt={scoreData.property.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold truncate">{scoreData.property.title}</h3>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(scoreData.score)}`}>
                              {scoreData.score}% match
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {scoreData.property.location}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-green-600">{scoreData.matches.length}</span> amenities
                            </div>
                            <div className="text-sm">
                              <span className="text-red-600">{scoreData.missing.length}</span> missing
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">{scoreData.nearbyFacilities.length}</span> nearby
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Map className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Map view coming soon</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="p-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Detailed amenity comparison coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="p-6">
          {uiSpec ? (
            <GenUIRenderer
              uiSpec={uiSpec}
              context={{
                amenities: selectedAmenities,
                properties: propertyScores.map(ps => ps.property),
                scores: propertyScores
              }}
            />
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Select amenities to see AI-powered insights</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};