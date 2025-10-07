import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

import { Property } from '@/types/property';
import { Environment } from '@/config/environment';

interface MapViewProps {
  coordinates?: {
    lat: number;
    lng: number;
  };
  approximateLocation?: {
    area: string;
    radius: string;
    landmarks?: string[];
  };
  properties?: Property[];
  className?: string;
  height?: string;
  zoom?: number;
  showRadius?: boolean;
  interactive?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  coordinates,
  approximateLocation,
  properties = [],
  className = '',
  height = '400px',
  zoom = 15,
  showRadius = false,
  interactive = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        const apiKey = Environment.getGoogleMapsApiKey();
        
        if (!apiKey) {
          throw new Error('Google Maps API key not configured. Please check your environment setup.');
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['geometry', 'places']
        });

        const google = await loader.load();
        
        // Determine map center
        let center: google.maps.LatLng;
        
        if (coordinates) {
          center = new google.maps.LatLng(coordinates.lat, coordinates.lng);
        } else if (approximateLocation) {
          // Use geocoding to get approximate location
          const geocoder = new google.maps.Geocoder();
          const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode(
              { address: `${approximateLocation.area}, Bangalore, Karnataka, India` },
              (results, status) => {
                if (status === 'OK' && results) {
                  resolve(results);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              }
            );
          });
          
          if (results.length > 0) {
            center = results[0].geometry.location;
          } else {
            // Fallback to Bangalore center
            center = new google.maps.LatLng(12.9716, 77.5946);
          }
        } else {
          // Default to Bangalore center
          center = new google.maps.LatLng(12.9716, 77.5946);
        }

        // Create map
        const mapOptions: google.maps.MapOptions = {
          center,
          zoom,
          disableDefaultUI: !interactive,
          draggable: interactive,
          zoomControl: interactive,
          scrollwheel: interactive,
          disableDoubleClickZoom: !interactive,
          gestureHandling: interactive ? 'auto' : 'none',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        };

        mapInstance.current = new google.maps.Map(mapRef.current, mapOptions);

        // Add markers for properties if provided
        if (properties && properties.length > 0) {
          properties.forEach((property, index) => {
            let markerPosition: google.maps.LatLng;
            
            // Use property coordinates if available
            if (property.coordinates) {
              markerPosition = new google.maps.LatLng(property.coordinates.lat, property.coordinates.lng);
            } else if (property.approximateLocation) {
              // For approximate locations, we'll need to geocode
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode(
                { address: `${property.approximateLocation.area}, Bangalore, Karnataka, India` },
                (results, status) => {
                  if (status === 'OK' && results && results.length > 0) {
                    const position = results[0].geometry.location;
                    createPropertyMarker(property, position, index);
                  }
                }
              );
              return; // Skip creating marker here for approximate locations
            } else {
              return; // Skip if no location data
            }
            
            createPropertyMarker(property, markerPosition, index);
          });
        } else if (coordinates) {
          // Add single marker for exact coordinates (fallback behavior)
          new google.maps.Marker({
            position: center,
            map: mapInstance.current,
            title: 'Property Location',
            icon: createMarkerIcon('#3B82F6')
          });
        }

        // Helper function to create property markers
        function createPropertyMarker(property: Property, position: google.maps.LatLng, index: number) {
          if (!mapInstance.current) return;
          
          // Determine marker color based on availability
          let markerColor = '#3B82F6'; // Default blue
          if (property.availability?.status === 'not-available') {
            markerColor = '#EF4444'; // Red
          } else if (property.availability?.status === 'coming-soon') {
            markerColor = '#F59E0B'; // Amber
          } else if (property.availability?.status === 'under-maintenance') {
            markerColor = '#6B7280'; // Gray
          }

          const marker = new google.maps.Marker({
            position,
            map: mapInstance.current,
            title: property.title,
            icon: createMarkerIcon(markerColor)
          });

          // Add info window with property details
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-4 max-w-xs">
                <h3 class="font-semibold text-gray-900 mb-2">${property.title}</h3>
                <p class="text-sm text-gray-600 mb-2">${property.location.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p class="text-sm text-gray-700 mb-2">${property.size.area} ${property.size.unit}</p>
                <div class="mb-2">
                  <span class="inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(property.availability?.status || 'available')}">
                    ${property.availability?.status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Available'}
                  </span>
                </div>
                ${property.customTags && property.customTags.length > 0 ? `
                  <div class="flex flex-wrap gap-1 mb-2">
                    ${property.customTags.map(tag => 
                      `<span class="inline-block px-2 py-1 text-xs rounded" style="background-color: ${tag.backgroundColor}; color: ${tag.color};">
                        ${tag.name}
                      </span>`
                    ).join('')}
                  </div>
                ` : ''}
                <div class="mt-3 flex space-x-2">
                  <button onclick="window.dispatchEvent(new CustomEvent('viewProperty', {detail: '${property.id}'}))" 
                          class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    View Details
                  </button>
                  <button onclick="window.open('https://wa.me/${property.contact.whatsapp?.replace('+', '')}?text=${encodeURIComponent(`Hi, I'm interested in ${property.title}`)}', '_blank')"
                          class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                    Contact
                  </button>
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance.current, marker);
          });

          // Add radius circle for approximate locations
          if (property.approximateLocation && showRadius) {
            const radiusValue = parseFloat(property.approximateLocation.radius.replace(/[^\d.]/g, ''));
            const radiusMeters = property.approximateLocation.radius.includes('km') ? radiusValue * 1000 : radiusValue;
            
            new google.maps.Circle({
              strokeColor: markerColor,
              strokeOpacity: 0.6,
              strokeWeight: 1,
              fillColor: markerColor,
              fillOpacity: 0.1,
              map: mapInstance.current,
              center: position,
              radius: radiusMeters
            });
          }
        }

        // Helper function to create marker icons
        function createMarkerIcon(color: string) {
          return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
          };
        }

        // Helper function to get status badge classes
        function getStatusBadgeClasses(status: string) {
          switch (status) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'not-available': return 'bg-red-100 text-red-800';
            case 'coming-soon': return 'bg-yellow-100 text-yellow-800';
            case 'under-maintenance': return 'bg-gray-100 text-gray-800';
            default: return 'bg-green-100 text-green-800';
          }
        }

        // Add radius circle for approximate location
        if (approximateLocation && showRadius) {
          const radiusValue = parseFloat(approximateLocation.radius.replace(/[^\d.]/g, ''));
          const radiusMeters = approximateLocation.radius.includes('km') ? radiusValue * 1000 : radiusValue;
          
          new google.maps.Circle({
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            map: mapInstance.current,
            center,
            radius: radiusMeters
          });

          // Add info window for approximate location
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3">
                <h3 class="font-semibold text-gray-900 mb-2">Approximate Location</h3>
                <p class="text-sm text-gray-600 mb-2">Area: ${approximateLocation.area}</p>
                <p class="text-sm text-gray-600 mb-2">Radius: ${approximateLocation.radius}</p>
                ${approximateLocation.landmarks ? `
                  <div class="mt-2">
                    <p class="text-sm font-medium text-gray-700 mb-1">Nearby Landmarks:</p>
                    <ul class="text-sm text-gray-600">
                      ${approximateLocation.landmarks.map(landmark => `<li>• ${landmark}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            `,
            position: center
          });

          // Add click event to show info window
          mapInstance.current.addListener('click', () => {
            infoWindow.open(mapInstance.current);
          });
        }

        setIsLoading(false);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      mapInstance.current = null;
    };
  }, [coordinates, approximateLocation, zoom, showRadius, interactive]);

  if (error) {
    return (
      <div 
        className={`bg-gray-100 border rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-1">Map Unavailable</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 border rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ height }}
      />
      
      {/* Location info overlay for approximate locations */}
      {approximateLocation && !coordinates && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md max-w-xs">
          <h4 className="font-medium text-gray-900 mb-1">Approximate Location</h4>
          <p className="text-sm text-gray-600">{approximateLocation.area}</p>
          <p className="text-xs text-gray-500 mt-1">Radius: {approximateLocation.radius}</p>
        </div>
      )}
    </div>
  );
};

export default MapView;