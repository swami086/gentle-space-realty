/**
 * LocationInput Component - Google Maps Places Autocomplete
 * Provides location search with autocomplete and coordinate extraction
 */

import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import { Environment } from '@/config/environment';

declare global {
  interface Window {
    google: typeof google;
    initGoogleMapsApi: () => void;
  }
}

// Define types for the new PlaceAutocompleteElement
interface PlaceAutocompleteElement extends HTMLElement {
  value: string;
  componentRestrictions: { country?: string };
  fields: string[];
  types: string[];
  bounds: any;
  addEventListener(type: 'gmp-placeselected', listener: (event: any) => void): void;
}

// Import LocationData from shared types
import { LocationData } from '@/types/property';

interface LocationInputProps {
  /** Current location value */
  value: string;
  /** Callback when location is selected */
  onChange: (locationData: LocationData) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Whether to restrict to Bengaluru */
  restrictToBengaluru?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Search for a location in Bengaluru...",
  label,
  required = false,
  className = "",
  restrictToBengaluru = true
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Sync input value with parent value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkApiLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsApiLoaded(true);
        return true;
      }
      return false;
    };

    if (checkApiLoaded()) {
      return;
    }

    // Load Google Maps API if not already loaded
    const loadGoogleMapsApi = () => {
      // Check if Google Maps API key is configured
      if (!Environment.hasGoogleMapsKey()) {
        console.warn('[LocationInput] Google Maps API key not configured - using fallback text input');
        setError('Location search unavailable - Google Maps API key not configured');
        return;
      }

      const apiKey = Environment.getGoogleMapsApiKey();
      
      if (!apiKey) {
        console.warn('[LocationInput] Google Maps API key is empty');
        setError('Google Maps API key is not configured');
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('[LocationInput] Google Maps script already exists, waiting for load...');
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (checkApiLoaded()) {
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Cleanup interval after 10 seconds to prevent memory leaks
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!isApiLoaded) {
            console.error('[LocationInput] Google Maps API loading timeout');
            setError('Google Maps API loading timeout');
          }
        }, 10000);
        return;
      }

      console.log('[LocationInput] Loading Google Maps API...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsApi`;
      script.async = true;
      script.defer = true;

      // Global callback for when API is loaded
      window.initGoogleMapsApi = () => {
        console.log('[LocationInput] Google Maps API loaded successfully');
        setIsApiLoaded(true);
        setError(null); // Clear any previous errors
      };

      script.onerror = (event) => {
        console.error('[LocationInput] Failed to load Google Maps API:', event);
        setError('Failed to load Google Maps API - please check your internet connection');
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsApi();
  }, []);

  // Initialize autocomplete when API is loaded
  useEffect(() => {
    if (!isApiLoaded || !inputRef.current) {
      return;
    }

    try {
      // Verify Google Maps API is actually available
      if (!window.google?.maps?.places?.Autocomplete) {
        console.error('[LocationInput] Google Maps Places API not available');
        setError('Google Maps Places API not available');
        return;
      }

      // Check if new PlaceAutocompleteElement is available (future API)
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        console.log('[LocationInput] Using new PlaceAutocompleteElement API');
        initializeNewAutocomplete();
      } else {
        console.log('[LocationInput] Using legacy Autocomplete API');
        initializeLegacyAutocomplete();
      }
    } catch (err) {
      console.error('[LocationInput] Error initializing Google Places Autocomplete:', err);
      setError(`Failed to initialize location search: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [isApiLoaded, restrictToBengaluru, onChange]);

  // New PlaceAutocompleteElement initialization (recommended)
  const initializeNewAutocomplete = () => {
    try {
      // This is for future implementation when the new API is fully available
      console.warn('New PlaceAutocompleteElement API detected but not fully implemented yet');
      // Fallback to legacy for now
      initializeLegacyAutocomplete();
    } catch (err) {
      console.warn('New API failed, falling back to legacy:', err);
      initializeLegacyAutocomplete();
    }
  };

  // Legacy Autocomplete initialization (current working version)
  const initializeLegacyAutocomplete = () => {
    if (!inputRef.current) {
      console.error('[LocationInput] Input ref not available for autocomplete initialization');
      return;
    }

    try {
      // Configure autocomplete options
      const options: google.maps.places.AutocompleteOptions = {
        types: ['establishment', 'geocode'], // Allow both places and addresses
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'vicinity']
      };

      // Restrict to Bengaluru if enabled
      if (restrictToBengaluru) {
        options.componentRestrictions = { country: 'IN' };
        // Bengaluru bounds (approximate)
        options.bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(12.7342, 77.4098), // SW
          new google.maps.LatLng(13.1739, 77.8565)  // NE
        );
        options.strictBounds = false; // Allow some results outside bounds
      }

      // Initialize legacy autocomplete
      console.log('[LocationInput] Initializing Google Places Autocomplete...');
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      // Handle place selection
      const handlePlaceChanged = () => {
        try {
          const place = autocompleteRef.current?.getPlace();
          
          if (!place) {
            console.warn('[LocationInput] No place selected');
            setError('No location selected');
            return;
          }

          if (!place.geometry || !place.geometry.location) {
            console.warn('[LocationInput] Selected place has no geometry:', place);
            setError('Please select a valid location from the dropdown');
            return;
          }

          console.log('[LocationInput] Place selected:', place.name || place.formatted_address);
          setError(null);
          
          const locationData: LocationData = {
            address: place.formatted_address || place.name || '',
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            placeDetails: {
              placeId: place.place_id!,
              name: place.name,
              formattedAddress: place.formatted_address || '',
              types: place.types || [],
              vicinity: place.vicinity
            }
          };

          // Update input value to show selected location
          setInputValue(locationData.address);
          
          onChange(locationData);
        } catch (err) {
          console.error('[LocationInput] Error handling place selection:', err);
          setError('Error processing selected location');
        }
      };

      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);
      console.log('[LocationInput] Autocomplete initialized successfully');

      // Cleanup
      return () => {
        if (autocompleteRef.current) {
          try {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
            console.log('[LocationInput] Autocomplete listeners cleared');
          } catch (err) {
            console.warn('[LocationInput] Error clearing autocomplete listeners:', err);
          }
        }
      };
    } catch (err) {
      console.error('[LocationInput] Error initializing legacy autocomplete:', err);
      setError(`Failed to initialize location search: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle manual search (fallback)
  const handleManualSearch = async () => {
    if (!isApiLoaded || !inputRef.current?.value.trim()) {
      console.warn('[LocationInput] Cannot perform manual search - API not loaded or empty input');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!window.google?.maps?.Geocoder) {
        throw new Error('Google Maps Geocoder not available');
      }

      console.log('[LocationInput] Performing manual geocoding search...');
      const geocoder = new google.maps.Geocoder();
      const searchAddress = inputRef.current.value.trim();
      
      const request: google.maps.GeocoderRequest = {
        address: searchAddress,
        bounds: restrictToBengaluru ? new google.maps.LatLngBounds(
          new google.maps.LatLng(12.7342, 77.4098),
          new google.maps.LatLng(13.1739, 77.8565)
        ) : undefined,
        componentRestrictions: restrictToBengaluru ? { country: 'IN' } : undefined
      };

      geocoder.geocode(request, (results, status) => {
        try {
          console.log('[LocationInput] Geocoding result:', { status, resultsCount: results?.length });
          
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            const result = results[0];
            console.log('[LocationInput] Found location:', result.formatted_address);
            
            const locationData: LocationData = {
              address: result.formatted_address,
              coordinates: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng()
              },
              placeDetails: {
                placeId: result.place_id,
                formattedAddress: result.formatted_address,
                types: result.types
              }
            };

            setInputValue(locationData.address); // Update input value
            onChange(locationData);
            setError(null);
          } else {
            console.warn('[LocationInput] No geocoding results found for:', searchAddress);
            setError('Location not found. Please try a different search term.');
          }
        } catch (geocodeErr) {
          console.error('[LocationInput] Error processing geocoding results:', geocodeErr);
          setError('Error processing search results');
        } finally {
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error('[LocationInput] Geocoding error:', err);
      setError(`Failed to search location: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Custom styles for Google Maps autocomplete dropdown */}
      <style>{`
        .pac-container {
          z-index: 9999 !important;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          margin-top: 2px;
          background: white;
          position: absolute !important;
        }
        .pac-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          background: white;
        }
        .pac-item:last-child {
          border-bottom: none;
        }
        .pac-item:hover,
        .pac-item.pac-item-selected {
          background-color: #f9fafb;
        }
        .pac-item-query {
          color: #1f2937;
          font-weight: 500;
        }
        .pac-matched {
          font-weight: 600;
          color: #2563eb;
        }
        /* Ensure input field stays visible above dropdown */
        input[data-google-autocomplete] {
          position: relative !important;
          z-index: 10000 !important;
          background-color: white !important;
          color: #1f2937 !important;
        }
      `}</style>
      {label && (
        <label className="flex items-center text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 mr-1" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" style={{ zIndex: 10000 }}>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            // Allow manual typing and update local state
            setInputValue(e.target.value);
            setError(null); // Clear errors when user types
          }}
          placeholder={isApiLoaded ? placeholder : "Loading location search..."}
          className="pr-24 relative z-20 bg-white text-gray-900"
          required={required}
          disabled={!isApiLoaded || isLoading}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          data-google-autocomplete="true"
          style={{
            // Ensure input field is always visible above dropdown
            position: 'relative',
            zIndex: 10000,
            backgroundColor: 'white !important',
            color: '#1f2937 !important',
            border: '1px solid #d1d5db',
            outline: 'none'
          }}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          
          {isApiLoaded && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={handleManualSearch}
              disabled={isLoading}
              title="Search manually"
            >
              <Search className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {!isApiLoaded && (
        <div className="text-xs text-amber-600">
          <div className="flex items-center space-x-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading Google Maps API...</span>
          </div>
          {!Environment.hasGoogleMapsKey() && (
            <div className="mt-1 text-red-600">
              Google Maps API key is required for location search
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        Start typing to search for locations in Bengaluru. Select from the dropdown for best results.
      </div>
      
      {isApiLoaded && window.google?.maps?.places?.Autocomplete && !window.google?.maps?.places?.PlaceAutocompleteElement && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">
          📋 Currently using Google Places Autocomplete API. Google is transitioning to PlaceAutocompleteElement API for improved performance and features.
        </div>
      )}
    </div>
  );
};

export default LocationInput;