import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/property';
import MediaPlayer from '@/components/MediaPlayer';
import StaticMapView from './StaticMapView';
import MapView from './MapView';
import MiniMap from '@/components/MiniMap';
import { parseRadiusToMeters, getPropertyCoordinates } from '@/lib/mapUtils';
import { 
  MapPin, 
  IndianRupee, 
  Square, 
  Calendar, 
  Wifi, 
  Car, 
  Shield, 
  Coffee, 
  Users,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Map,
  Eye,
  ExternalLink
} from 'lucide-react';

interface PropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ property, isOpen, onClose }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullMap, setShowFullMap] = useState(false);

  if (!property) return null;

  // Get all media items (prefer media array, fallback to images for backward compatibility)
  const getAllMedia = () => {
    if (property.media && property.media.length > 0) {
      return property.media;
    }
    if (property.images && property.images.length > 0) {
      return property.images.map((url, index) => ({
        type: 'image' as const,
        url,
        filename: `property-image-${index + 1}.jpg`,
        size: 0,
        createdAt: ''
      }));
    }
    return [];
  };

  const allMedia = getAllMedia();

  // Removed formatPrice as per "contact for pricing" model

  const handleOpenInMaps = () => {
    const locationText = property.approximateLocation?.radius || formatLocation(property.location);
    const searchQuery = `${locationText} Bengaluru office space`;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, '_blank');
  };

  const formatLocation = (location: string) => {
    return location.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getLocationDisplay = () => {
    return property.approximateLocation?.radius || formatLocation(property.location);
  };

  // Prepare approximate location data for mini-map with coordinates
  const approximateLocationData = property.approximateLocation && property.coordinates && property.approximateLocation.radius ? {
    lat: property.coordinates.lat,
    lng: property.coordinates.lng,
    radius: property.approximateLocation.radius,
    radiusMeters: parseRadiusToMeters(property.approximateLocation.radius)
  } : undefined;

  console.log('PropertyModal Debug:', {
    hasApproximateLocation: !!property.approximateLocation,
    hasCoordinates: !!property.coordinates,
    approximateLocationRaw: property.approximateLocation,
    coordinatesRaw: property.coordinates,
    approximateLocationData,
    propertyTitle: property.title
  });

  // Get coordinates using geocoding helper
  const propertyCoordinates = getPropertyCoordinates(property);

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => 
      prev === allMedia.length - 1 ? 0 : prev + 1
    );
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => 
      prev === 0 ? allMedia.length - 1 : prev - 1
    );
  };

  const handleContact = (method: 'phone' | 'email' | 'whatsapp') => {
    const locationText = property.approximateLocation?.radius ? `in the ${property.approximateLocation.radius} area` : `located in ${formatLocation(property.location)}`;
    const message = `Hi, I'm interested in ${property.title} ${locationText}. Can you provide more details and pricing information?`;
    
    switch (method) {
      case 'phone':
        window.open(`tel:${property.contact.phone}`);
        break;
      case 'email':
        window.open(`mailto:${property.contact.email}?subject=Inquiry about ${property.title}&body=${encodeURIComponent(message)}`);
        break;
      case 'whatsapp':
        if (property.contact.whatsapp) {
          const whatsappUrl = `https://wa.me/${property.contact.whatsapp.replace('+', '')}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 pr-8">
            {property.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mixed Media Gallery */}
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              {allMedia.length > 0 ? (
                <>
                  {allMedia[currentMediaIndex].type === 'image' ? (
                    <img
                      src={allMedia[currentMediaIndex].url}
                      alt={`${property.title} - ${allMedia[currentMediaIndex].type} ${currentMediaIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MediaPlayer
                      src={allMedia[currentMediaIndex].url}
                      poster={allMedia[currentMediaIndex].thumbnailUrl}
                      className="w-full h-full"
                      controls={true}
                      autoPlay={false}
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span>No media available</span>
                </div>
              )}
            </div>
            
            {allMedia.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={prevMedia}
                >
                  <ChevronLeft size={20} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={nextMedia}
                >
                  <ChevronRight size={20} />
                </Button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {allMedia.map((mediaItem, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentMediaIndex(index)}
                      title={`${mediaItem.type} ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="bg-primary-600 text-white">
                  {formatCategory(property.category)}
                </Badge>
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-1" />
                  <span>{getLocationDisplay()}</span>
                </div>
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
                {!property.availability.available && (
                  <Badge variant="destructive">Not Available</Badge>
                )}
              </div>
              
              {/* Custom Tags */}
              {property.customTags && property.customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {property.customTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      className="text-sm"
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
              )}

              {/* Contact for Pricing and Size */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-lg">
                  Contact for Pricing
                </div>
                {property.size.area > 0 && (
                  <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <Square size={16} className="mr-1" />
                    <span>{property.size.area} {property.size.unit}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.features.wifi && (
                    <div className="flex items-center text-gray-600">
                      <Wifi size={16} className="mr-2 text-green-600" />
                      <span>High-Speed WiFi</span>
                    </div>
                  )}
                  {property.features.parking && (
                    <div className="flex items-center text-gray-600">
                      <Car size={16} className="mr-2 text-green-600" />
                      <span>Parking Available</span>
                    </div>
                  )}
                  {property.features.security && (
                    <div className="flex items-center text-gray-600">
                      <Shield size={16} className="mr-2 text-green-600" />
                      <span>24/7 Security</span>
                    </div>
                  )}
                  {property.features.cafeteria && (
                    <div className="flex items-center text-gray-600">
                      <Coffee size={16} className="mr-2 text-green-600" />
                      <span>Cafeteria</span>
                    </div>
                  )}
                  {property.features.ac && (
                    <div className="flex items-center text-gray-600">
                      <div className="w-4 h-4 mr-2 text-green-600">❄️</div>
                      <span>Air Conditioning</span>
                    </div>
                  )}
                  {property.features.furnished && (
                    <div className="flex items-center text-gray-600">
                      <div className="w-4 h-4 mr-2 text-green-600">🪑</div>
                      <span>Fully Furnished</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (  <Badge key={index} variant="outline" className="text-sm">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                  <div className="flex items-center space-x-2">
                    {(property.coordinates || property.approximateLocation) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullMap(!showFullMap)}
                        className="flex items-center space-x-1"
                      >
                        {showFullMap ? (
                          <><Eye size={16} /><span>Show Preview</span></>
                        ) : (
                          <><Map size={16} /><span>Full Map</span></>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInMaps}
                      className="flex items-center space-x-1"
                    >
                      <ExternalLink size={16} />
                      <span>Open in Maps</span>
                    </Button>
                  </div>
                </div>
                
                {(property.coordinates || property.approximateLocation) ? (
                  showFullMap ? (
                    <MapView
                      coordinates={property.coordinates}
                      approximateLocation={property.approximateLocation}
                      className="rounded-lg border"
                      height="300px"
                      zoom={15}
                      showRadius={!!property.approximateLocation}
                      interactive={true}
                    />
                  ) : (
                    <div className="space-y-3">
                      <MiniMap
                        coordinates={propertyCoordinates}
                        approximateLocation={approximateLocationData}
                        location={property.location}
                        variant="modal"
                        className="rounded-lg border cursor-pointer"
                        onClick={() => setShowFullMap(true)}
                        alt={`Map preview for ${property.title}`}
                      />
                      <div className="text-sm text-gray-600 text-center">
                        Click map to view interactive version
                      </div>
                    </div>
                  )
                ) : (
                  <MiniMap
                    coordinates={propertyCoordinates}
                    location={property.location}
                    variant="modal"
                    className="rounded-lg border"
                    alt={`Location map for ${property.title}`}
                  />
                )}
                
                {/* Location Benefits */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs font-medium text-gray-900">Transport</div>
                    <div className="text-xs text-green-600">Excellent</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs font-medium text-gray-900">Business Hub</div>
                    <div className="text-xs text-green-600">Prime</div>
                  </div>
                </div>
              </div>
              
              {/* Availability */}
              {property.availability.availableFrom && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Available from {new Date(property.availability.availableFrom).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">Get Pricing & Details</p>
                    <p className="text-xs text-blue-600">Contact us for competitive rates and availability</p>
                  </div>
                  
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleContact('whatsapp')}
                  >
                    <MessageCircle size={16} className="mr-2" />
                    WhatsApp for Pricing
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleContact('phone')}
                  >
                    <Phone size={16} className="mr-2" />
                    Call for Details
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleContact('email')}
                  >
                    <Mail size={16} className="mr-2" />
                    Email Inquiry
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center">
                      <Phone size={14} className="mr-2" />
                      <span>{property.contact.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2" />
                      <span>{property.contact.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-xs text-gray-500 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>24-hour response guarantee</span>
                    </div>
                    <p>We'll provide pricing and availability details within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyModal;
