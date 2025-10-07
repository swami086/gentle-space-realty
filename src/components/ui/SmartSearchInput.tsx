import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, X, Building, Tag } from 'lucide-react';
import { LocationData } from '@/types/property';
import { Environment, SafeEnvironment } from '@/config/environment';

interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (locationData: LocationData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface SearchSuggestion {
  type: 'location' | 'amenity' | 'property-type';
  value: string;
  displayText: string;
  icon: React.ReactNode;
  data?: LocationData;
}

const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Search for office spaces, locations, or amenities...",
  className = "",
  disabled = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [placeSuggestions, setPlaceSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Popular search suggestions
  const popularSuggestions: SearchSuggestion[] = [
    { type: 'property-type', value: 'fully-furnished-offices', displayText: 'Fully Furnished Offices', icon: <Building size={14} /> },
    { type: 'property-type', value: 'co-working-spaces', displayText: 'Co-working Spaces', icon: <Building size={14} /> },
    { type: 'property-type', value: 'private-office-cabins', displayText: 'Private Office Cabins', icon: <Building size={14} /> },
    { type: 'amenity', value: 'High-Speed WiFi', displayText: 'High-Speed WiFi', icon: <Tag size={14} /> },
    { type: 'amenity', value: 'Parking', displayText: 'Parking Available', icon: <Tag size={14} /> },
    { type: 'amenity', value: 'Meeting Rooms', displayText: 'Meeting Rooms', icon: <Tag size={14} /> },
    { type: 'amenity', value: 'Cafeteria', displayText: 'Cafeteria', icon: <Tag size={14} /> },
    { type: 'location', value: 'Koramangala, Bengaluru', displayText: 'Koramangala', icon: <MapPin size={14} /> },
    { type: 'location', value: 'Indiranagar, Bengaluru', displayText: 'Indiranagar', icon: <MapPin size={14} /> },
    { type: 'location', value: 'Whitefield, Bengaluru', displayText: 'Whitefield', icon: <MapPin size={14} /> }
  ];

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Check if environment is configured at all
      if (!SafeEnvironment.isConfigured()) {
        console.warn('Environment not configured. Smart search will use local suggestions only.');
        setIsApiLoaded(false);
        return;
      }

      let apiKey: string | undefined = undefined;
      
      try {
        apiKey = Environment.getGoogleMapsApiKey();
      } catch (error) {
        console.warn('Failed to get Google Maps API key from environment:', error);
        setIsApiLoaded(false);
        return;
      }
        
      if (!apiKey) {
        console.warn('Google Maps API key not found. Smart search will use local suggestions only.');
        setIsApiLoaded(false);
        return;
      }

      if (window.google && window.google.maps && window.google.maps.places) {
        setIsApiLoaded(true);
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkApiLoaded = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setIsApiLoaded(true);
          } else {
            setTimeout(checkApiLoaded, 100);
          }
        };
        checkApiLoaded();
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setIsApiLoaded(true);
        };

        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          setIsApiLoaded(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to create Google Maps script element:', error);
        setIsApiLoaded(false);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  // Initialize autocomplete services when API is loaded
  useEffect(() => {
    if (!isApiLoaded || autocompleteServiceRef.current) {
      return;
    }

    try {
      // Initialize AutocompleteService for programmatic place predictions
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      
      // Initialize PlacesService for getting place details
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
      
    } catch (error) {
      console.error('Error initializing Google Places services:', error);
      setIsApiLoaded(false);
    }
  }, [isApiLoaded]);

  // Filter suggestions based on input
  const getFilteredSuggestions = (query: string): SearchSuggestion[] => {
    if (!query || query.length < 2) return popularSuggestions.slice(0, 6);
    
    const lowerQuery = query.toLowerCase();
    return popularSuggestions.filter(suggestion => 
      suggestion.displayText.toLowerCase().includes(lowerQuery) ||
      suggestion.value.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  };

  // Fetch Google Places suggestions
  const fetchPlaceSuggestions = (query: string) => {
    if (!isApiLoaded || !autocompleteServiceRef.current || !query || query.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    const request = {
      input: query,
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'IN' }, // Restrict to India
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        const placeSuggs: SearchSuggestion[] = predictions.slice(0, 5).map(prediction => ({
          type: 'location',
          value: prediction.description,
          displayText: prediction.structured_formatting?.main_text || prediction.description,
          icon: <MapPin size={14} />,
          data: {
            address: prediction.description,
            coordinates: { lat: 0, lng: 0 }, // Will be populated when selected
            placeDetails: {
              placeId: prediction.place_id,
              formattedAddress: prediction.description,
              name: prediction.structured_formatting?.main_text,
              types: prediction.types
            }
          }
        }));
        setPlaceSuggestions(placeSuggs);
      } else {
        setPlaceSuggestions([]);
      }
    });
  };

  // Get place details when a Google Places suggestion is selected
  const getPlaceDetails = (placeId: string, suggestion: SearchSuggestion) => {
    if (!placesServiceRef.current || !suggestion.data) return;

    const request = {
      placeId: placeId,
      fields: ['place_id', 'formatted_address', 'name', 'geometry', 'types', 'address_components']
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
        const locationData: LocationData = {
          address: place.formatted_address || suggestion.data!.address,
          coordinates: {
            lat: place.geometry.location!.lat(),
            lng: place.geometry.location!.lng()
          },
          placeDetails: {
            placeId: place.place_id,
            formattedAddress: place.formatted_address,
            types: place.types,
            name: place.name
          }
        };

        // Extract city, state, country from address components
        if (place.address_components) {
          place.address_components.forEach((component: any) => {
            if (component.types.includes('locality')) {
              locationData.placeDetails!.city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              locationData.placeDetails!.state = component.long_name;
            }
            if (component.types.includes('country')) {
              locationData.placeDetails!.country = component.long_name;
            }
          });
        }

        onChange(locationData.address);
        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
      }
    });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const filtered = getFilteredSuggestions(newValue);
    setSuggestions(filtered);
    
    // Fetch Google Places suggestions
    fetchPlaceSuggestions(newValue);
    
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    const filtered = getFilteredSuggestions(value);
    setSuggestions(filtered);
    
    // Also fetch Google Places suggestions on focus if there's a value
    if (value && value.length >= 2) {
      fetchPlaceSuggestions(value);
    }
    
    setShowSuggestions(true);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      setPlaceSuggestions([]);
    }, 150);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setPlaceSuggestions([]);
    
    if (suggestion.type === 'location' && onLocationSelect) {
      if (suggestion.data && suggestion.data.placeDetails?.placeId) {
        // If it's a Google Places suggestion, get full details
        getPlaceDetails(suggestion.data.placeDetails.placeId, suggestion);
      } else if (suggestion.data) {
        // If it's a local suggestion with data, use it directly
        onLocationSelect(suggestion.data);
      }
    }
    
    // Focus back to input
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allSuggestions = [...suggestions, ...placeSuggestions];
    
    if (!showSuggestions || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allSuggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : allSuggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          handleSuggestionSelect(allSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setPlaceSuggestions([]);
        break;
    }
  };

  // Clear search
  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setPlaceSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pl-10 pr-10 h-12"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || placeSuggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* API Status Indicator */}
          {isApiLoaded && placeSuggestions.length > 0 && (
            <div className="px-3 py-2 text-xs text-green-600 bg-green-50 border-b border-green-100">
              <MapPin size={12} className="inline mr-1" />
              Google Places suggestions enabled
            </div>
          )}
          
          {/* Suggestions List */}
          <div className="py-1">
            {/* Local suggestions first */}
            {suggestions.map((suggestion, index) => (
              <div
                key={`local-${suggestion.type}-${suggestion.value}`}
                ref={el => suggestionRefs.current[index] = el}
                className={`px-3 py-2 cursor-pointer flex items-center space-x-2 hover:bg-gray-50 ${
                  selectedIndex === index ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                }`}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <span className={`${
                  suggestion.type === 'location' ? 'text-blue-500' :
                  suggestion.type === 'property-type' ? 'text-green-500' :
                  'text-purple-500'
                }`}>
                  {suggestion.icon}
                </span>
                <span className="flex-1 text-sm text-gray-700">
                  {suggestion.displayText}
                </span>
                <Badge variant="outline" className="text-xs">
                  {suggestion.type === 'location' ? 'Location' :
                   suggestion.type === 'property-type' ? 'Type' : 'Amenity'}
                </Badge>
              </div>
            ))}
            
            {/* Google Places suggestions */}
            {placeSuggestions.length > 0 && suggestions.length > 0 && (
              <div className="px-3 py-1 text-xs text-gray-500 bg-gray-100 border-t border-gray-200">
                Google Places Locations
              </div>
            )}
            
            {placeSuggestions.map((suggestion, index) => {
              const actualIndex = suggestions.length + index;
              return (
                <div
                  key={`places-${suggestion.value}`}
                  ref={el => suggestionRefs.current[actualIndex] = el}
                  className={`px-3 py-2 cursor-pointer flex items-center space-x-2 hover:bg-gray-50 ${
                    selectedIndex === actualIndex ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="text-blue-500">
                    {suggestion.icon}
                  </span>
                  <span className="flex-1 text-sm text-gray-700">
                    {suggestion.displayText}
                  </span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Google Places
                  </Badge>
                </div>
              );
            })}
            
            {/* No suggestions message */}
            {suggestions.length === 0 && placeSuggestions.length === 0 && value.length > 2 && (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No suggestions found for "{value}"
                <div className="text-xs text-gray-400 mt-1">
                  Try searching for locations, property types, or amenities
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </div>
      )}

      {/* Custom Styles for Google Places */}
      <style>{`
        .pac-container {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default SmartSearchInput;