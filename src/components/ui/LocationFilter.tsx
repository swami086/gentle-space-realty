import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, X } from 'lucide-react';
import { LocationData } from '@/types/property';
import { geocodeAddress } from '@/services/mapsService';

interface LocationFilterProps {
  selectedLocation?: string;
  onLocationSelect: (location: string | undefined) => void;
  onLocationData?: (locationData: LocationData | null) => void;
  placeholder?: string;
  restrictToBengaluru?: boolean;
}

const LocationFilter: React.FC<LocationFilterProps> = ({
  selectedLocation,
  onLocationSelect,
  onLocationData,
  placeholder = "Search for locations...",
  restrictToBengaluru = false
}) => {
  const [inputValue, setInputValue] = useState(selectedLocation || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Popular locations as fallback/suggestions
  const popularLocations = [
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

  // Handle location search using backend API
  const handleLocationSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      console.log('🔍 LocationFilter: Searching via backend:', searchTerm);
      const result = await geocodeAddress(searchTerm);
      
      if (result.success && result.location) {
        const locationData: LocationData = {
          address: result.formatted_address || searchTerm,
          coordinates: result.location,
          placeDetails: {
            placeId: result.place_id,
            formattedAddress: result.formatted_address,
            city: 'Bengaluru' // Default for now, could be parsed from formatted_address
          }
        };
        
        if (onLocationData) {
          onLocationData(locationData);
        }
        console.log('✅ LocationFilter: Backend geocoding success');
      } else {
        console.warn('⚠️ LocationFilter: Backend geocoding failed:', result.error);
      }
    } catch (error) {
      console.error('❌ LocationFilter: Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for search
    if (value.trim().length > 2) {
      const timeout = setTimeout(() => {
        handleLocationSearch(value);
      }, 500); // 500ms debounce
      setSearchTimeout(timeout);
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleClearLocation = () => {
    setInputValue('');
    onLocationSelect(undefined);
    if (onLocationData) {
      onLocationData(null);
    }
  };

  const handlePopularLocationSelect = async (location: string) => {
    setInputValue(location);
    onLocationSelect(location);
    
    // Geocode popular locations using backend
    await handleLocationSearch(location);
  };

  return (
    <div>
      <Label className="text-base font-semibold mb-3 block">
        <MapPin className="inline mr-2" size={16} />
        Location
      </Label>
      
      {/* Search Input */}
      <div className="mb-3 relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          className="pr-10"
          disabled={isSearching}
        />
        {isSearching && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        {selectedLocation && (
          <button
            type="button"
            onClick={handleClearLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Popular Locations */}
      <div>
        <Label className="text-sm text-gray-600 mb-2 block">
          Popular Locations:
        </Label>
        <div className="flex flex-wrap gap-2">
          {popularLocations.map((location) => (
            <Badge
              key={location}
              variant={selectedLocation === location ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary-100"
              onClick={() => handlePopularLocationSelect(location)}
            >
              {location.replace(', Bengaluru', '')}
            </Badge>
          ))}
        </div>
      </div>

      {/* Search Status */}
      {isSearching && (
        <div className="text-xs text-gray-500 mt-2">
          Searching for locations via backend API...
        </div>
      )}

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="mt-3 p-2 bg-primary-50 rounded-md border">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <MapPin size={14} className="mr-1 text-primary-600" />
              <span className="text-gray-700">Selected: {selectedLocation}</span>
            </div>
            <button
              type="button"
              onClick={handleClearLocation}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilter;