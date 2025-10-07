/**
 * MiniMap Component - Static Google Maps integration with circle overlays
 * Uses Google Static Maps API for embedded mini-maps in property tiles
 */

import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { 
  parseRadiusToMeters, 
  isValidCoordinates,
  MAP_STYLES,
  type Coordinates,
  type ApproximateLocation,
  type MiniMapLocation
} from '@/lib/mapUtils';
import { generateStaticMapUrl as backendGenerateStaticMapUrl } from '@/services/mapsService';
import { DEFAULT_CIRCLE_OVERLAY } from '@/lib/mapTheme';

export interface MiniMapProps {
  /** Exact coordinates for the map center */
  coordinates?: Coordinates;
  /** Approximate location with radius circle */
  approximateLocation?: ApproximateLocation;
  /** Location string for fallback display */
  location?: string;
  /** Pre-processed location data (alternative to individual props) */
  miniMapLocation?: MiniMapLocation;
  /** Map style variant */
  variant?: 'property' | 'propertyCard' | 'modal';
  /** Custom width */
  width?: number;
  /** Custom height */
  height?: number;
  /** Custom CSS classes */
  className?: string;
  /** Click handler for opening in Google Maps */
  onClick?: () => void;
  /** Whether to show loading state */
  loading?: boolean;
  /** Alt text for accessibility */
  alt?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({
  coordinates,
  approximateLocation,
  location,
  miniMapLocation,
  variant = 'property',
  width,
  height,
  className = '',
  onClick,
  loading = false,
  alt
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Use miniMapLocation data if provided, otherwise use individual props
  const resolvedCoordinates = miniMapLocation?.coordinates || coordinates;
  const resolvedApproximateLocation = miniMapLocation?.approximateLocation || approximateLocation;
  const resolvedLocation = miniMapLocation?.location || location;

  // Debug logging
  console.log('MiniMap Debug:', {
    resolvedCoordinates,
    resolvedApproximateLocation,
    hasRadius: !!resolvedApproximateLocation?.radius,
    hasRadiusMeters: !!resolvedApproximateLocation?.radiusMeters,
    isValidCoords: resolvedCoordinates ? isValidCoordinates(resolvedCoordinates) : false
  });

  // Determine the center coordinates
  const centerCoords = resolvedCoordinates || resolvedApproximateLocation;
  
  // Get style configuration based on variant
  const style = MAP_STYLES[variant];
  const mapWidth = width || parseInt(style.size.split('x')[0]);
  const mapHeight = height || parseInt(style.size.split('x')[1]);
  
  // Support container-driven sizing when no explicit dimensions provided
  const useContainerSizing = !width && !height;

  // Generate static map URL using backend API only
  const generateMapUrl = useCallback(async () => {
    if (!centerCoords || !isValidCoordinates(centerCoords)) {
      return '';
    }

    try {
      console.log('🗺️ MiniMap: Generating map via backend API only');
      
      const mapOptions = {
        center: `${centerCoords.lat},${centerCoords.lng}`,
        zoom: style.zoom,
        size: `${mapWidth}x${mapHeight}`,
        markers: [{
          location: `${centerCoords.lat},${centerCoords.lng}`,
          color: 'purple'
        }]
      };

      const url = await backendGenerateStaticMapUrl(mapOptions);
      console.log('✅ MiniMap: Backend-generated map URL:', url);
      return url || '';
    } catch (error) {
      console.error('❌ MiniMap: Backend map generation failed:', error);
      return '';
    }
  }, [centerCoords, style, mapWidth, mapHeight]);

  const [mapUrl, setMapUrl] = useState('');

  // Generate map URL on mount and when dependencies change
  useEffect(() => {
    let mounted = true;
    
    generateMapUrl().then(url => {
      if (mounted) {
        setMapUrl(url);
      }
    });
    
    return () => { mounted = false; };
  }, [generateMapUrl]);

  // Performance optimization: Preload image
  React.useEffect(() => {
    if (mapUrl && !loading) {
      const img = new Image();
      img.src = mapUrl;
      // Preload in background, no need to handle events here
      // The actual <img> element will handle loading states
    }
  }, [mapUrl, loading]);

  // Handle image load events
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
    console.warn('MiniMap: Failed to load static map image', { coordinates, approximateLocation });
  }, [coordinates, approximateLocation]);

  // Handle click to open in Google Maps
  const handleMapClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }

    // Default behavior: open in Google Maps
    if (centerCoords) {
      const searchQuery = resolvedApproximateLocation?.radius 
        ? `${resolvedApproximateLocation.radius} area near ${centerCoords.lat},${centerCoords.lng}`
        : `${centerCoords.lat},${centerCoords.lng}`;
      
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      window.open(mapsUrl, '_blank');
    } else if (resolvedLocation) {
      const searchQuery = `${resolvedLocation} Bengaluru office space`;
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      window.open(mapsUrl, '_blank');
    }
  }, [onClick, centerCoords, resolvedApproximateLocation, resolvedLocation]);

  // Format location text for display
  const getLocationText = () => {
    if (resolvedApproximateLocation?.radius) {
      return resolvedApproximateLocation.radius;
    }
    if (resolvedLocation) {
      return resolvedLocation.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return 'Location not available';
  };

  // Loading state
  if (loading) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={useContainerSizing ? {} : { width: mapWidth, height: mapHeight }}
      >
        <div className="flex flex-col items-center space-y-2 text-gray-500">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-xs">Loading map...</span>
        </div>
      </div>
    );
  }

  // Error state or no coordinates available
  if (!mapUrl || imageError || !centerCoords) {
    const isBackendUnavailable = !mapUrl && centerCoords;
    
    return (
      <div 
        className={`bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center p-3 ${className} ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        style={useContainerSizing ? {} : { width: mapWidth, height: mapHeight }}
        onClick={handleMapClick}
      >
        <div className="flex flex-col items-center space-y-2 text-gray-500 text-center">
          {imageError ? (
            <>
              <AlertCircle size={20} className="text-gray-400" />
              <span className="text-xs">Map unavailable</span>
              {isBackendUnavailable && (
                <span className="text-xs text-orange-600">Backend maps service unavailable</span>
              )}
            </>
          ) : (
            <>
              <MapPin size={20} className="text-gray-400" />
              <span className="text-xs font-medium">{getLocationText()}</span>
              {isBackendUnavailable && (
                <span className="text-xs text-orange-600">Configure backend maps service for preview</span>
              )}
            </>
          )}
          {(onClick || centerCoords || location) && (
            <div className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700">
              <ExternalLink size={12} />
              <span>View in Maps</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render static map image
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {imageLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10"
          style={useContainerSizing ? {} : { width: mapWidth, height: mapHeight }}
        >
          <div className="flex flex-col items-center space-y-2 text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        </div>
      )}
      
      <img
        src={mapUrl}
        alt={alt || `Map showing ${getLocationText()}`}
        width={useContainerSizing ? undefined : mapWidth}
        height={useContainerSizing ? undefined : mapHeight}
        className={`${useContainerSizing ? 'w-full h-full' : ''} object-cover transition-transform duration-200 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={handleMapClick}
        loading="lazy"
        style={useContainerSizing ? {
          display: imageLoading ? 'none' : 'block'
        } : { 
          width: mapWidth, 
          height: mapHeight,
          display: imageLoading ? 'none' : 'block'
        }}
      />
      
      {/* Overlay for interaction hint */}
      {onClick && !imageLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-end justify-end p-2">
          <div className="bg-white bg-opacity-90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ExternalLink size={12} className="text-gray-700" />
          </div>
        </div>
      )}
      
      {/* Radius indicator for approximate locations */}
      {resolvedApproximateLocation?.radius && !imageLoading && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
          ~{resolvedApproximateLocation.radius}
        </div>
      )}
    </div>
  );
};

export default MiniMap;