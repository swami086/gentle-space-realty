/**
 * Maps Service - Direct Google Maps API Integration
 * Uses centralized environment configuration for secure API key management
 */

import { Environment } from '@/config/environment';

export interface GeocodeResult {
  success: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  formatted_address?: string;
  place_id?: string;
  error?: string;
  status?: string;
}

export interface StaticMapOptions {
  center: string;
  zoom?: number;
  size?: string;
  markers?: Array<{
    location: string;
    color?: string;
  }>;
}

/**
 * Get Google Maps API key from centralized environment configuration
 */
function getGoogleMapsApiKey(): string {
  try {
    return Environment.getGoogleMapsApiKey();
  } catch (error) {
    console.error('[MapsService] Failed to get Google Maps API key:', error);
    throw new Error('Google Maps API key not properly configured. Please check your environment setup.');
  }
}

/**
 * Geocode an address using direct Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    console.log('🔍 MapsService.geocodeAddress: Direct Google API geocoding:', address);
    
    const apiKey = getGoogleMapsApiKey();
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log('✅ MapsService.geocodeAddress: Google API geocoding success');
      return {
        success: true,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        status: data.status
      };
    } else {
      console.warn('⚠️ MapsService.geocodeAddress: Google API returned no results:', data.status);
      return {
        success: false,
        error: `Geocoding failed: ${data.status}`,
        status: data.status
      };
    }
  } catch (error) {
    console.error('❌ MapsService.geocodeAddress: Google API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown geocoding error'
    };
  }
}

/**
 * Generate static map URL using direct Google Static Maps API
 */
export async function generateStaticMapUrl(options: StaticMapOptions): Promise<string | null> {
  try {
    console.log('🗺️ MapsService.generateStaticMapUrl: Direct Google Static Maps API');
    
    const apiKey = getGoogleMapsApiKey();
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    
    // Build URL parameters
    const params = new URLSearchParams();
    params.append('center', options.center);
    params.append('zoom', (options.zoom || 15).toString());
    params.append('size', options.size || '400x300');
    params.append('key', apiKey);
    
    // Add markers if specified
    if (options.markers && options.markers.length > 0) {
      options.markers.forEach(marker => {
        const markerStr = marker.color 
          ? `color:${marker.color}|${marker.location}`
          : marker.location;
        params.append('markers', markerStr);
      });
    }
    
    const staticMapUrl = `${baseUrl}?${params.toString()}`;
    console.log('✅ MapsService.generateStaticMapUrl: Success');
    return staticMapUrl;
    
  } catch (error) {
    console.error('❌ MapsService.generateStaticMapUrl: Google Static Maps API error:', error);
    return null;
  }
}

/**
 * Get popular Bengaluru locations as fallback
 */
export function getPopularLocations(): string[] {
  return [
    'MG Road, Bengaluru',
    'Indiranagar, Bengaluru', 
    'Koramangala, Bengaluru',
    'HSR Layout, Bengaluru',
    'Whitefield, Bengaluru',
    'Electronic City, Bengaluru',
    'JP Nagar, Bengaluru',
    'BTM Layout, Bengaluru',
    'Marathahalli, Bengaluru',
    'Sarjapur Road, Bengaluru'
  ];
}

/**
 * Validate if location is in Bengaluru area (approximate)
 */
export function isValidBengaluruLocation(location: { lat: number; lng: number }): boolean {
  // Bengaluru bounds (approximate)
  const bengaluruBounds = {
    north: 13.2,
    south: 12.7,
    east: 77.8,
    west: 77.3
  };
  
  return (
    location.lat >= bengaluruBounds.south &&
    location.lat <= bengaluruBounds.north &&
    location.lng >= bengaluruBounds.west &&
    location.lng <= bengaluruBounds.east
  );
}