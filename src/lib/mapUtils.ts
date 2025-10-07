/**
 * Map Utilities for Google Maps Static API integration
 * Provides helper functions for generating static map URLs and handling coordinates
 */

import { DEFAULT_CIRCLE_OVERLAY, MAP_STYLES } from './mapTheme';

/**
 * Simple in-memory cache for static map URLs
 * Cache key: coordinates + options hash
 * Cache TTL: 5 minutes for performance
 */
interface MapUrlCacheEntry {
  url: string;
  timestamp: number;
  ttl: number;
}

const MAP_URL_CACHE = new Map<string, MapUrlCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ApproximateLocation {
  lat: number;
  lng: number;
  radius: string; // e.g., "1km", "2km"
  radiusMeters: number;
}

export interface StaticMapOptions {
  center: Coordinates;
  zoom?: number;
  size?: string; // e.g., "400x200"
  maptype?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  scale?: 1 | 2; // For retina displays
  format?: 'png' | 'gif' | 'jpg';
  language?: string;
  region?: string;
}

export interface CircleOverlayOptions {
  center: Coordinates;
  radius: number; // in meters
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
}

/**
 * Generate cache key for static map URL
 */
function generateCacheKey(
  options: StaticMapOptions,
  circleOverlay?: CircleOverlayOptions
): string {
  const baseKey = `${options.center.lat},${options.center.lng}_${options.zoom || 15}_${options.size || '400x200'}_${options.maptype || 'roadmap'}_${options.scale || 2}`;
  
  if (circleOverlay) {
    const circleKey = `_${circleOverlay.center.lat},${circleOverlay.center.lng}_${circleOverlay.radius}`;
    return baseKey + circleKey;
  }
  
  return baseKey;
}

/**
 * Clean expired entries from cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of MAP_URL_CACHE.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      MAP_URL_CACHE.delete(key);
    }
  }
}

/**
 * DEPRECATED: Direct Google Static Maps API URL generation
 * Use backend API via mapsService.generateStaticMapUrl() instead
 * This function is kept for backward compatibility but should not be used
 */
export function generateStaticMapUrl(
  options: StaticMapOptions,
  circleOverlay?: CircleOverlayOptions
): string {
  console.warn('⚠️ generateStaticMapUrl: Direct API calls deprecated. Use backend mapsService.generateStaticMapUrl() instead');
  return '';
}

/**
 * Generate circle overlay path for Google Static Maps
 */
export function generateCircleOverlay(options: CircleOverlayOptions): string {
  const {
    center,
    radius,
    strokeColor = DEFAULT_CIRCLE_OVERLAY.strokeColor,
    strokeOpacity = DEFAULT_CIRCLE_OVERLAY.strokeOpacity,
    strokeWeight = DEFAULT_CIRCLE_OVERLAY.strokeWeight,
    fillColor = DEFAULT_CIRCLE_OVERLAY.fillColor,
    fillOpacity = DEFAULT_CIRCLE_OVERLAY.fillOpacity
  } = options;

  // Convert opacity to hex (0-1 to 0x00-0xFF)
  const strokeAlpha = Math.round(strokeOpacity * 255).toString(16).padStart(2, '0');
  const fillAlpha = Math.round(fillOpacity * 255).toString(16).padStart(2, '0');

  // Format: fillcolor:0xcolor|color:0xcolor|weight:2|enc:polyline
  return `fillcolor:${fillColor}${fillAlpha}|color:${strokeColor}${strokeAlpha}|weight:${strokeWeight}|${generateCirclePolyline(center, radius)}`;
}

/**
 * Generate circle polyline for Static Maps API
 * Creates a polygon approximating a circle using latitude/longitude points
 */
function generateCirclePolyline(center: Coordinates, radiusMeters: number): string {
  const points: Coordinates[] = [];
  const numberOfPoints = 32; // Number of points to approximate the circle
  const earthRadius = 6371000; // Earth's radius in meters

  // Convert radius from meters to degrees (approximate)
  const radiusLat = radiusMeters / earthRadius * (180 / Math.PI);
  const radiusLng = radiusMeters / (earthRadius * Math.cos(center.lat * Math.PI / 180)) * (180 / Math.PI);

  // Generate circle points
  for (let i = 0; i < numberOfPoints; i++) {
    const angle = (i * 2 * Math.PI) / numberOfPoints;
    const lat = center.lat + radiusLat * Math.sin(angle);
    const lng = center.lng + radiusLng * Math.cos(angle);
    points.push({ lat, lng });
  }

  // Close the circle by adding the first point at the end
  points.push(points[0]);

  // Encode as polyline
  return `enc:${encodePolyline(points)}`;
}

/**
 * Encode array of coordinates as polyline for Google Maps
 * Simplified version - for production, consider using a proper polyline encoding library
 */
function encodePolyline(coordinates: Coordinates[]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const coord of coordinates) {
    const lat = Math.round(coord.lat * 1e5);
    const lng = Math.round(coord.lng * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    encoded += encodeSignedNumber(dLat) + encodeSignedNumber(dLng);
  }

  return encoded;
}

/**
 * Encode a signed number for polyline encoding
 */
function encodeSignedNumber(num: number): string {
  let signedNum = num << 1;
  if (num < 0) {
    signedNum = ~signedNum;
  }

  let encoded = '';
  while (signedNum >= 0x20) {
    encoded += String.fromCharCode((0x20 | (signedNum & 0x1f)) + 63);
    signedNum >>= 5;
  }
  encoded += String.fromCharCode(signedNum + 63);

  return encoded;
}

/**
 * Parse radius string (e.g., "1km", "500m") to meters
 */
export function parseRadiusToMeters(radius: string | undefined | null): number {
  if (!radius || typeof radius !== 'string') {
    console.warn(`Invalid radius input: ${radius}`);
    return 1000; // Default to 1km
  }

  const match = radius.match(/^(\d+(?:\.\d+)?)(km|m)$/i);
  if (!match) {
    console.warn(`Invalid radius format: ${radius}`);
    return 1000; // Default to 1km
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  return unit === 'km' ? value * 1000 : value;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates, precision: number = 4): string {
  return `${coords.lat.toFixed(precision)}, ${coords.lng.toFixed(precision)}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180 &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng)
  );
}

/**
 * Static location lookup for common Bengaluru areas
 * This provides fallback coordinates when geocoding is not available
 */
const BENGALURU_AREA_COORDINATES: Record<string, Coordinates> = {
  // Central Bengaluru
  'koramangala': { lat: 12.9352, lng: 77.6245 },
  'indiranagar': { lat: 12.9719, lng: 77.6412 },
  'mg road': { lat: 12.9759, lng: 77.6081 },
  'brigade road': { lat: 12.9726, lng: 77.6099 },
  'commercial street': { lat: 12.9823, lng: 77.6092 },
  'cubbon park': { lat: 12.9762, lng: 77.5993 },
  
  // IT Corridor
  'electronic city': { lat: 12.8399, lng: 77.6773 },
  'whitefield': { lat: 12.9698, lng: 77.7499 },
  'marathahalli': { lat: 12.9591, lng: 77.6974 },
  'sarjapur road': { lat: 12.9018, lng: 77.6814 },
  'outer ring road': { lat: 12.9279, lng: 77.6271 },
  'bellandur': { lat: 12.9298, lng: 77.6848 },
  
  // North Bengaluru
  'hebbal': { lat: 13.0358, lng: 77.5970 },
  'yelaganhalli': { lat: 13.0827, lng: 77.5946 },
  'yelahanka': { lat: 13.1007, lng: 77.5963 },
  
  // South Bengaluru
  'jayanagar': { lat: 12.9279, lng: 77.5937 },
  'basavanagudi': { lat: 12.9423, lng: 77.5736 },
  'jp nagar': { lat: 12.9082, lng: 77.5855 },
  'banashankari': { lat: 12.9298, lng: 77.5568 },
  
  // West Bengaluru  
  'rajajinagar': { lat: 12.9991, lng: 77.5554 },
  'malleshwaram': { lat: 13.0031, lng: 77.5810 },
  'seshadripuram': { lat: 12.9923, lng: 77.5687 },
  
  // East Bengaluru
  'hsr layout': { lat: 12.9116, lng: 77.6460 },
  'btm layout': { lat: 12.9165, lng: 77.6101 },
  'bommanahalli': { lat: 12.9067, lng: 77.6228 }
};

/**
 * Geocode area name to coordinates using static lookup
 * This is a fallback when Google Geocoding API is not available or for performance
 */
export function geocodeAreaName(areaName: string): Coordinates | null {
  const normalizedArea = areaName.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
  
  // Direct lookup
  if (BENGALURU_AREA_COORDINATES[normalizedArea]) {
    return BENGALURU_AREA_COORDINATES[normalizedArea];
  }
  
  // Fuzzy matching for common variations
  const fuzzyMatches: Record<string, string> = {
    'kormangala': 'koramangala',
    'indira nagar': 'indiranagar',
    'mgroad': 'mg road',
    'mg-road': 'mg road',
    'whitfield': 'whitefield',
    'electronic-city': 'electronic city',
    'electroniccity': 'electronic city',
    'hsrlayout': 'hsr layout',
    'hsr-layout': 'hsr layout',
    'btmlayout': 'btm layout',
    'btm-layout': 'btm layout',
    'jpnagar': 'jp nagar',
    'jp-nagar': 'jp nagar',
    'outerringroad': 'outer ring road',
    'outer-ring-road': 'outer ring road',
    'sarjapurroad': 'sarjapur road',
    'sarjapur-road': 'sarjapur road'
  };
  
  const fuzzyKey = fuzzyMatches[normalizedArea];
  if (fuzzyKey && BENGALURU_AREA_COORDINATES[fuzzyKey]) {
    return BENGALURU_AREA_COORDINATES[fuzzyKey];
  }
  
  // Partial matching - find if area name contains any known area
  for (const [knownArea, coords] of Object.entries(BENGALURU_AREA_COORDINATES)) {
    if (normalizedArea.includes(knownArea) || knownArea.includes(normalizedArea)) {
      return coords;
    }
  }
  
  // Default to Bengaluru center if no match found
  return { lat: 12.9716, lng: 77.5946 };
}

/**
 * Property input type for coordinate extraction
 */
export interface PropertyLocationInput {
  coordinates?: Coordinates;
  approximateLocation?: { 
    area?: string; 
    lat?: number; 
    lng?: number;
    radius?: string;
    radiusMeters?: number;
  };
  location?: string;
}

/**
 * Mini-map location data with all necessary information for display
 */
export interface MiniMapLocation {
  coordinates: Coordinates | null;
  approximateLocation?: {
    lat: number;
    lng: number;
    radius: string;
    radiusMeters: number;
  };
  location: string;
  hasExactCoordinates: boolean;
}

/**
 * Convert property data to MiniMapLocation format
 * This helper ensures consistent data structure and improves type safety
 */
export function toMiniMapLocation(property: PropertyLocationInput): MiniMapLocation {
  const coordinates = getPropertyCoordinates(property);
  const hasExactCoordinates = !!(property.coordinates && isValidCoordinates(property.coordinates));
  
  // Process approximate location with radius
  let approximateLocationData: MiniMapLocation['approximateLocation'];
  if (property.approximateLocation?.lat && property.approximateLocation?.lng && property.approximateLocation?.radius) {
    approximateLocationData = {
      lat: property.approximateLocation.lat,
      lng: property.approximateLocation.lng,
      radius: property.approximateLocation.radius,
      radiusMeters: property.approximateLocation.radiusMeters || parseRadiusToMeters(property.approximateLocation.radius)
    };
  }
  
  // Determine display location
  const location = property.approximateLocation?.radius 
    ? property.approximateLocation.radius 
    : property.location || 'Location not specified';
  
  return {
    coordinates,
    approximateLocation: approximateLocationData,
    location,
    hasExactCoordinates
  };
}

/**
 * Get coordinates for a property, using geocoding fallback if needed
 */
export function getPropertyCoordinates(property: PropertyLocationInput): Coordinates | null {
  // Use exact coordinates if available
  if (property.coordinates && isValidCoordinates(property.coordinates)) {
    return property.coordinates;
  }
  
  // Use approximate location coordinates if available
  if (property.approximateLocation?.lat && property.approximateLocation?.lng) {
    const approxCoords = { lat: property.approximateLocation.lat, lng: property.approximateLocation.lng };
    if (isValidCoordinates(approxCoords)) {
      return approxCoords;
    }
  }
  
  // Geocode approximate location area
  if (property.approximateLocation?.area) {
    return geocodeAreaName(property.approximateLocation.area);
  }
  
  // Geocode location string as fallback
  if (property.location) {
    return geocodeAreaName(property.location);
  }
  
  return null;
}

/**
 * Cache management utilities for performance monitoring
 */
export const mapUrlCache = {
  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    MAP_URL_CACHE.forEach((entry) => {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });
    
    return {
      totalEntries: MAP_URL_CACHE.size,
      validEntries,
      expiredEntries,
      cacheHitRate: validEntries / Math.max(MAP_URL_CACHE.size, 1)
    };
  },
  
  /**
   * Manually clear all cached URLs
   */
  clear() {
    MAP_URL_CACHE.clear();
  },
  
  /**
   * Clean only expired entries
   */
  cleanExpired() {
    cleanExpiredCache();
  }
};

// Re-export MAP_STYLES from mapTheme for backward compatibility
export { MAP_STYLES } from './mapTheme';