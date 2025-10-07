import React, { useState } from 'react';
import { Environment } from '@/config/environment';

interface StaticMapViewProps {
  coordinates?: {
    lat: number;
    lng: number;
  };
  approximateLocation?: {
    area: string;
    radius: string;
    landmarks?: string[];
  };
  className?: string;
  width?: number;
  height?: number;
  zoom?: number;
  onClick?: () => void;
}

export const StaticMapView: React.FC<StaticMapViewProps> = ({
  coordinates,
  approximateLocation,
  className = '',
  width = 400,
  height = 300,
  zoom = 15,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const generateStaticMapUrl = (): string => {
    const apiKey = Environment.getGoogleMapsApiKey();
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured. Please check your environment setup.');
    }

    let center = '';
    let markers = '';

    if (coordinates) {
      center = `${coordinates.lat},${coordinates.lng}`;
      markers = `&markers=color:blue|size:mid|${center}`;
    } else if (approximateLocation) {
      // Use area name for geocoding
      center = encodeURIComponent(`${approximateLocation.area}, Bangalore, Karnataka, India`);
      // Don't add a marker for approximate locations to maintain privacy
      markers = '';
    } else {
      // Default to Bangalore center
      center = '12.9716,77.5946';
    }

    const params = new URLSearchParams({
      center,
      zoom: zoom.toString(),
      size: `${width}x${height}`,
      maptype: 'roadmap',
      key: apiKey,
      scale: '2', // For retina displays
      format: 'png'
    });

    // Add custom styling to reduce visual clutter
    params.append('style', 'feature:poi.business|visibility:off');
    params.append('style', 'feature:poi.government|visibility:off');
    params.append('style', 'feature:poi.school|visibility:off');

    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    return `${baseUrl}?${params.toString()}${markers}`;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  if (imageError) {
    return (
      <div 
        className={`bg-gray-100 border rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
        style={{ width, height }}
        onClick={onClick}
      >
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-1">Map Preview Unavailable</p>
          <p className="text-xs text-gray-500">Click to view interactive map</p>
        </div>
      </div>
    );
  }

  try {
    const mapUrl = generateStaticMapUrl();

    return (
      <div 
        className={`relative overflow-hidden rounded-lg ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
        style={{ width, height }}
        onClick={onClick}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        <img
          src={mapUrl}
          alt="Property location map"
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Location info overlay for approximate locations */}
        {approximateLocation && !coordinates && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm">
            <p className="text-xs font-medium text-gray-800">{approximateLocation.area}</p>
            <p className="text-xs text-gray-600">~{approximateLocation.radius}</p>
          </div>
        )}
        
        {/* Interactive hint overlay */}
        {onClick && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div 
        className={`bg-gray-100 border rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
        style={{ width, height }}
        onClick={onClick}
      >
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-1">Map Configuration Error</p>
          <p className="text-xs text-gray-500">Please check API key settings</p>
        </div>
      </div>
    );
  }
};

export default StaticMapView;