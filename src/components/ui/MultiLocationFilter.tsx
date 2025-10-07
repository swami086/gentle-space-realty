import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, X, Plus, Search } from 'lucide-react';
import { LocationData } from '@/types/property';
import { Environment } from '@/config/environment';

interface MultiLocationFilterProps {
  selectedLocations?: string[];
  onLocationsChange: (locations: string[]) => void;
  onLocationData?: (locationData: LocationData | null) => void;
  placeholder?: string;
  restrictToBengaluru?: boolean;
  maxSelections?: number;
}

interface LocationSuggestion {
  value: string;
  displayText: string;
  isGooglePlace: boolean;
  placeId?: string;
  data?: LocationData;
}

const MultiLocationFilter: React.FC<MultiLocationFilterProps> = ({
  selectedLocations = [],
  onLocationsChange,
  onLocationData,
  placeholder = "Search for locations...",
  restrictToBengaluru = false,
  maxSelections = 10
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      try {
        const apiKey = Environment.getGoogleMapsApiKey();
        
        if (!apiKey) {
          console.warn('Google Maps API key not found. Location filter will use popular locations only.');
          setIsApiLoaded(false);
          return;
        }
      } catch (error) {
        console.warn('Failed to load Google Maps API configuration:', error);
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

  // Get filtered popular locations
  const getFilteredPopularLocations = (query: string): LocationSuggestion[] => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return popularLocations
      .filter(location => 
        location.toLowerCase().includes(lowerQuery) ||
        location.replace(', Bengaluru', '').toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .map(location => ({
        value: location,
        displayText: location.replace(', Bengaluru', ''),
        isGooglePlace: false,
        data: {
          address: location,
          coordinates: { lat: 0, lng: 0 },
          placeDetails: {
            formattedAddress: location,
            city: 'Bengaluru'
          }
        }
      }));
  };

  // Fetch Google Places suggestions
  const fetchPlaceSuggestions = (query: string) => {
    if (!isApiLoaded || !autocompleteServiceRef.current || !query || query.length < 2) {
      const popularSuggestions = getFilteredPopularLocations(query);
      setSuggestions(popularSuggestions);
      return;
    }

    const request = {
      input: query,
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'IN' }, // Restrict to India
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
      const popularSuggestions = getFilteredPopularLocations(query);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        const placeSuggs: LocationSuggestion[] = predictions.slice(0, 5).map(prediction => ({
          value: prediction.description,
          displayText: prediction.structured_formatting?.main_text || prediction.description,
          isGooglePlace: true,
          placeId: prediction.place_id,
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
        setSuggestions([...popularSuggestions, ...placeSuggs]);
      } else {
        setSuggestions(popularSuggestions);
      }
    });
  };

  // Get place details when a Google Places suggestion is selected
  const getPlaceDetails = (placeId: string, suggestion: LocationSuggestion) => {
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

        addLocation(locationData.address);
        if (onLocationData) {
          onLocationData(locationData);
        }
      }
    });
  };

  const addLocation = (location: string) => {
    if (location.trim() && 
        !selectedLocations.includes(location) && 
        selectedLocations.length < maxSelections) {
      onLocationsChange([...selectedLocations, location]);
    }
  };

  const removeLocation = (locationToRemove: string) => {
    onLocationsChange(selectedLocations.filter(location => location !== locationToRemove));
  };

  const clearAllLocations = () => {
    onLocationsChange([]);
    setInputValue('');
  };

  const handlePopularLocationSelect = (location: string) => {
    addLocation(location);
    
    // For popular locations, create basic location data
    if (onLocationData) {
      onLocationData({
        address: location,
        coordinates: { lat: 0, lng: 0 }, // Would need geocoding to get actual coordinates
        placeDetails: {
          formattedAddress: location,
          city: 'Bengaluru'
        }
      });
    }
  };

  // Handle input changes and show suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.length >= 2) {
      fetchPlaceSuggestions(newValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    if (suggestion.isGooglePlace && suggestion.placeId) {
      // Get full place details for Google Places
      getPlaceDetails(suggestion.placeId, suggestion);
    } else if (suggestion.data) {
      // Use local suggestion data
      addLocation(suggestion.value);
      if (onLocationData) {
        onLocationData(suggestion.data);
      }
    }
    
    setInputValue('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (inputValue.trim()) {
          addLocation(inputValue.trim());
          setInputValue('');
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (inputValue.trim()) {
          addLocation(inputValue.trim());
          setInputValue('');
          setShowSuggestions(false);
          setSuggestions([]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.length >= 2) {
      fetchPlaceSuggestions(inputValue);
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedIndex(-1);
    }, 150);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // This is now handled by handleKeyDown for better UX
  };

  const handleManualAdd = () => {
    if (inputValue.trim()) {
      addLocation(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div>
      <Label className="text-base font-semibold mb-3 block">
        <MapPin className="inline mr-2" size={16} />
        Locations {selectedLocations.length > 0 && `(${selectedLocations.length}${maxSelections ? `/${maxSelections}` : ''})`}
      </Label>
      
      {/* Search Input */}
      <div className="mb-3 flex gap-2 relative">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={selectedLocations.length >= maxSelections ? 'Maximum locations selected' : placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={selectedLocations.length >= maxSelections}
            className="pr-10"
            autoComplete="off"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {/* API Status Indicator */}
              {isApiLoaded && suggestions.some(s => s.isGooglePlace) && (
                <div className="px-3 py-2 text-xs text-green-600 bg-green-50 border-b border-green-100">
                  <MapPin size={12} className="inline mr-1" />
                  Google Places suggestions enabled
                </div>
              )}
              
              {/* Suggestions List */}
              <div className="py-1">
                {/* Popular locations first */}
                {suggestions.filter(s => !s.isGooglePlace).length > 0 && (
                  <>
                    {suggestions.filter(s => !s.isGooglePlace).map((suggestion, index) => (
                      <div
                        key={`popular-${suggestion.value}`}
                        ref={el => suggestionRefs.current[index] = el}
                        className={`px-3 py-2 cursor-pointer flex items-center space-x-2 hover:bg-gray-50 ${
                          selectedIndex === index ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                        }`}
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <span className="text-blue-500">
                          <MapPin size={14} />
                        </span>
                        <span className="flex-1 text-sm text-gray-700">
                          {suggestion.displayText}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Popular
                        </Badge>
                      </div>
                    ))}
                    
                    {/* Separator if we have both popular and Google Places */}
                    {suggestions.some(s => s.isGooglePlace) && (
                      <div className="px-3 py-1 text-xs text-gray-500 bg-gray-100 border-t border-gray-200">
                        Google Places Locations
                      </div>
                    )}
                  </>
                )}
                
                {/* Google Places suggestions */}
                {suggestions.filter(s => s.isGooglePlace).map((suggestion, index) => {
                  const actualIndex = suggestions.filter(s => !s.isGooglePlace).length + index;
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
                        <MapPin size={14} />
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
              </div>

              {/* Footer */}
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                Use ↑↓ to navigate, Enter to select, Esc to close
              </div>
            </div>
          )}
        </div>
        
        {/* Manual Add Button */}
        {!isApiLoaded && (
          <Button
            type="button"
            onClick={handleManualAdd}
            disabled={selectedLocations.length >= maxSelections || !inputValue.trim()}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            <Plus size={16} />
          </Button>
        )}
      </div>

      {/* Selected Locations */}
      {selectedLocations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm text-gray-600">
              Selected Locations:
            </Label>
            <Button
              type="button"
              onClick={clearAllLocations}
              size="sm"
              variant="ghost"
              className="text-xs text-red-600 hover:text-red-700 p-1 h-auto"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedLocations.map((location, index) => (
              <Badge
                key={index}
                variant="default"
                className="pr-1 bg-primary-100 text-primary-800 border border-primary-300"
              >
                <MapPin size={12} className="mr-1" />
                {location.length > 30 ? `${location.substring(0, 30)}...` : location}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-1 h-auto p-0 text-current hover:bg-black/10"
                  onClick={() => removeLocation(location)}
                >
                  <X size={12} />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Popular Locations Fallback */}
      {!isApiLoaded && selectedLocations.length === 0 && (
        <div>
          <Label className="text-sm text-gray-600 mb-2 block">
            Popular Locations:
          </Label>
          <div className="flex flex-wrap gap-2">
            {popularLocations.map((location) => (
              <Badge
                key={location}
                variant="outline"
                className="cursor-pointer hover:bg-primary-100"
                onClick={() => handlePopularLocationSelect(location)}
              >
                {location.replace(', Bengaluru', '')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* API Loading State */}
      {!isApiLoaded && Environment.hasGoogleMapsKey() && (
        <div className="text-xs text-gray-500 mt-2">
          Loading Google Maps API for location search...
        </div>
      )}

      {/* API Not Available */}
      {!isApiLoaded && !Environment.hasGoogleMapsKey() && (
        <div className="text-xs text-amber-600 mt-2">
          Google Maps API not configured. Using popular locations only.
        </div>
      )}

      {/* Hints */}
      <div className="text-xs text-gray-500 mt-2">
        {isApiLoaded ? (
          <>
            Start typing to search with Google Places API. Press Enter or select from dropdown to add locations.
            {selectedLocations.length >= maxSelections && (
              <span className="block text-amber-600 mt-1">
                Maximum of {maxSelections} locations can be selected.
              </span>
            )}
          </>
        ) : (
          <>
            Type location and press Enter to add, or select from popular locations above.
            {selectedLocations.length >= maxSelections && (
              <span className="block text-amber-600 mt-1">
                Maximum of {maxSelections} locations can be selected.
              </span>
            )}
          </>
        )}
      </div>
      
      {/* Custom Styles for Google Places */}
      <style>{`
        .pac-container {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default MultiLocationFilter;