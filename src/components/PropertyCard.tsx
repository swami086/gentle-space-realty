import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/property';
import { 
  MapPin, 
  Wifi, 
  Car, 
  Shield, 
  Coffee, 
  Users, 
  Play, 
  Heart,
  Bot,
  BarChart3,
  Star,
  Calculator,
  Plus,
  Check,
  Target,
  Sparkles
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';
import MiniMap from '@/components/MiniMap';
import { parseRadiusToMeters, getPropertyCoordinates } from '@/lib/mapUtils';

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
  onContact: (property: Property) => void;
  onAddToComparison?: (property: Property) => void;
  onAIAnalysis?: (property: Property) => void;
  isInComparison?: boolean;
  showAIFeatures?: boolean;
  aiScore?: number;
  recommendation?: {
    score: number;
    reasoning: string;
    confidence: number;
  };
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onViewDetails, 
  onContact,
  onAddToComparison,
  onAIAnalysis,
  isInComparison = false,
  showAIFeatures = false,
  aiScore,
  recommendation
}) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { isAuthenticated, saveProperty, unsaveProperty, isPropertySaved } = useUserStore();
  const { toast } = useToast();
  
  const isPropertyCurrentlySaved = isAuthenticated ? isPropertySaved(property.id) : false;

  const formatLocation = (location: string) => {
    return location.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCategory = (category?: string) => {
    if (!category) return 'Property';
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getAIScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAIScoreBadgeColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getLocationDisplay = () => {
    return property.approximateLocation?.radius || formatLocation(property.location);
  };

  const getFeatureIcons = () => {
    const icons = [];
    if (property.features?.wifi) icons.push(<Wifi key="wifi" size={16} />);
    if (property.features?.parking) icons.push(<Car key="parking" size={16} />);
    if (property.features?.security) icons.push(<Shield key="security" size={16} />);
    if (property.features?.cafeteria) icons.push(<Coffee key="cafeteria" size={16} />);
    return icons;
  };

  // Get the primary media item (prefer media array, fallback to images)
  const getPrimaryMedia = () => {
    if (property.media && property.media.length > 0) {
      return property.media[0];
    }
    if (property.images && property.images.length > 0) {
      return {
        type: 'image' as const,
        url: property.images[0],
        filename: 'property-image.jpg',
        size: 0,
        createdAt: ''
      };
    }
    return null;
  };

  const primaryMedia = getPrimaryMedia();

  // Handle video hover play/pause
  const handleVideoHover = async () => {
    if (videoRef.current && primaryMedia?.type === 'video') {
      try {
        setIsVideoPlaying(true);
        videoRef.current.currentTime = 0; // Reset to start
        await videoRef.current.play();
      } catch (error) {
        console.warn('Video autoplay failed:', error);
        setIsVideoPlaying(false);
      }
    }
  };

  const handleVideoLeave = () => {
    if (videoRef.current && primaryMedia?.type === 'video') {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to save properties.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isPropertyCurrentlySaved) {
        const success = await unsaveProperty(property.id);
        if (success) {
          toast({
            title: 'Property Removed',
            description: 'Property has been removed from your saved list.',
          });
        }
      } else {
        const success = await saveProperty(property.id);
        if (success) {
          toast({
            title: 'Property Saved',
            description: 'Property has been added to your saved list.',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update saved property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare approximate location data for mini-map with coordinates
  const approximateLocationData = property.approximateLocation && property.coordinates ? {
    lat: property.coordinates?.lat || 0,
    lng: property.coordinates?.lng || 0,
    radius: property.approximateLocation?.radius || '1km',
    radiusMeters: parseRadiusToMeters(property.approximateLocation?.radius || '1km')
  } : undefined;

  console.log('PropertyCard Debug:', {
    hasApproximateLocation: !!property.approximateLocation,
    hasCoordinates: !!property.coordinates,
    approximateLocationData,
    propertyTitle: property.title
  });

  // Get coordinates using geocoding helper
  const propertyCoordinates = getPropertyCoordinates(property);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200">
      <div className="relative overflow-hidden rounded-t-lg">
        <div className="grid grid-cols-2 h-48">
          {/* Media Section */}
          <div className="relative">
            {primaryMedia ? (
              <>
                {primaryMedia.type === 'image' ? (
                  <img
                    src={primaryMedia.url}
                    alt={property.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className="relative"
                    onMouseEnter={handleVideoHover}
                    onMouseLeave={handleVideoLeave}
                  >
                    {/* Always show video element for hover playback */}
                    <video
                      ref={videoRef}
                      src={primaryMedia.url}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      preload="metadata"
                      muted // Required for autoplay
                      loop // Loop video during hover
                      playsInline // Better mobile support
                      poster={primaryMedia.thumbnailUrl} // Show thumbnail when not playing
                    />
                    
                    {/* Video Play Overlay - hide when video is playing */}
                    {!isVideoPlaying && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300">
                        <div className="bg-black/60 rounded-full p-3 transform group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-6 h-6 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Optional: Video duration indicator */}
                    {primaryMedia.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {Math.floor(primaryMedia.duration / 60)}:{(primaryMedia.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No media available</span>
              </div>
            )}
          </div>

          {/* Mini-Map Section */}
          <div className="relative border-l border-gray-200">
            <MiniMap
              coordinates={propertyCoordinates}
              approximateLocation={approximateLocationData}
              location={property.location}
              variant="propertyCard"
              className="w-full h-48"
              onClick={() => {
                const locationText = approximateLocationData?.radius || formatLocation(property.location);
                const searchQuery = `${locationText} Bengaluru office space`;
                window.open(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, '_blank');
              }}
              alt={`Map showing ${property.title} location`}
            />
          </div>
        </div>
        
        
        {/* Save Button */}
        <div className="absolute top-4 left-4">
          <Button
            size="sm"
            variant="ghost"
            className={`bg-white/80 hover:bg-white/90 transition-all duration-300 ${isPropertyCurrentlySaved ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSaveToggle();
            }}
            disabled={isSaving}
          >
            <Heart 
              size={20} 
              className={`transition-all duration-300 ${isPropertyCurrentlySaved ? 'fill-current' : ''}`}
            />
          </Button>
        </div>
        
        {/* Availability Status and AI Features */}
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          {/* AI Score Badge */}
          {aiScore && showAIFeatures && (
            <Badge className={`${getAIScoreBadgeColor(aiScore)} text-xs font-medium`}>
              <Bot className="h-3 w-3 mr-1" />
              AI Score: {aiScore}%
            </Badge>
          )}
          
          {/* Recommendation Badge */}
          {recommendation && (
            <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
              <Target className="h-3 w-3 mr-1" />
              {Math.round(recommendation.score)}% match
            </Badge>
          )}
          
          {/* Comparison Badge */}
          {isInComparison && (
            <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">
              <BarChart3 className="h-3 w-3 mr-1" />
              In Comparison
            </Badge>
          )}
          
          {property.availability?.status && property.availability.status !== 'available' && (
            <Badge 
              variant={{
                'not-available': 'destructive',
                'coming-soon': 'secondary',
                'under-maintenance': 'outline'
              }[property.availability.status] as any}
            >
              {property.availability.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          )}
          {property.availability && !property.availability.available && (
            <Badge variant="destructive">Not Available</Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-900 mb-2 gsr-line-clamp-2">
              {property.title}
            </CardTitle>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin size={16} className="mr-1" />
              <span className="text-sm">{getLocationDisplay()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {/* AI Insights */}
          {(aiScore || recommendation) && showAIFeatures && (
            <div className="flex items-center gap-2">
              {aiScore && (
                <div className="flex items-center gap-1">
                  <Bot className={`h-4 w-4 ${getAIScoreColor(aiScore)}`} />
                  <span className={`text-sm font-medium ${getAIScoreColor(aiScore)}`}>
                    {aiScore}%
                  </span>
                </div>
              )}
              {recommendation && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600 font-medium">
                    {Math.round(recommendation.confidence * 100)}% confident
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            {property.size && property.size.area > 0 && (
              <span>{property.size.area} {property.size.unit}</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-gray-600 mb-4 gsr-line-clamp-2">
          {property.description}
        </CardDescription>

        <div className="flex items-center gap-2 mb-4">
          {getFeatureIcons().slice(0, 4).map((icon, index) => (
            <div key={index} className="text-gray-500">
              {icon}
            </div>
          ))}
          {property.amenities && property.amenities.length > 4 && (
            <span className="text-xs text-gray-500">
              +{property.amenities.length - 4} more
            </span>
          )}
        </div>
        
        {/* Property Category and Custom Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {/* Property Category */}
          <Badge className="bg-primary-600 text-white text-xs">
            {formatCategory(property.category)}
          </Badge>
          
          {/* Custom Tags */}
          {property.customTags && property.customTags.map((tag) => (
            <Badge
              key={tag.id}
              className="text-xs"
              style={{
                backgroundColor: tag.backgroundColor,
                color: tag.color,
                borderColor: tag.color
              }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* AI Recommendation Reasoning */}
        {recommendation && showAIFeatures && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1">
                  AI Recommendation ({Math.round(recommendation.confidence * 100)}% confidence)
                </p>
                <p className="text-xs text-purple-600">
                  {recommendation.reasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Primary Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => onViewDetails(property)}
            >
              View Details
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-green-600 text-green-600 hover:bg-green-50 border-2"
              onClick={() => onContact(property)}
            >
              Contact
            </Button>
          </div>
          
          {/* AI Features */}
          {showAIFeatures && (
            <div className="flex gap-2">
              {onAddToComparison && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToComparison(property);
                  }}
                  disabled={isInComparison}
                >
                  {isInComparison ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Compare
                    </>
                  )}
                </Button>
              )}
              
              {onAIAnalysis && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAIAnalysis(property);
                  }}
                >
                  <Bot className="h-3 w-3 mr-1" />
                  AI Analysis
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={(e) => {
                  e.stopPropagation();
                  // Mock budget calculation trigger
                  toast({
                    title: 'AI Budget Calculator',
                    description: `Calculating budget for ${property.title}...`,
                  });
                }}
              >
                <Calculator className="h-3 w-3 mr-1" />
                Budget
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
