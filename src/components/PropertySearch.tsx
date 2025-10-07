import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PropertyFilters, PropertyCategory, PropertyTag, LocationData } from '@/types/property';
import { API } from '@/services/apiService';
import { Building, Square, X, Tag, CheckCircle } from 'lucide-react';
import MultiLocationFilter from '@/components/ui/MultiLocationFilter';
import SmartSearchInput from '@/components/ui/SmartSearchInput';

interface PropertySearchProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onSearch: (query: string) => void;
}

const PropertySearch: React.FC<PropertySearchProps> = ({ filters, onFiltersChange, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<PropertyTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [selectedLocationData, setSelectedLocationData] = useState<LocationData | null>(null);

  // Removed hardcoded locations array - now using LocationFilter component with Google Places API

  const categories: { value: PropertyCategory; label: string }[] = [
    { value: 'fully-furnished-offices', label: 'Fully Furnished Offices' },
    { value: 'custom-built-workspaces', label: 'Custom-Built Workspaces' },
    { value: 'co-working-spaces', label: 'Co-working Spaces' },
    { value: 'private-office-cabins', label: 'Private Office Cabins' },
    { value: 'enterprise-offices', label: 'Enterprise Offices' },
    { value: 'virtual-offices', label: 'Virtual Offices' },
    { value: 'meeting-conference-rooms', label: 'Meeting & Conference Rooms' },
  ];

  const availabilityStatuses = [
    { value: 'available', label: 'Available' },
    { value: 'not-available', label: 'Not Available' },
    { value: 'coming-soon', label: 'Coming Soon' },
    { value: 'under-maintenance', label: 'Under Maintenance' },
  ] as const;

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoadingTags(true);
        const tags = await API.getActiveTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };

    loadTags();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleMainSearchLocationSelect = (locationData: LocationData) => {
    // When a location is selected from main search, add it to the location filters
    const currentLocations = filters.locations || [];
    const newLocation = locationData.address;
    
    // Add to locations if not already present
    if (!currentLocations.includes(newLocation)) {
      onFiltersChange({
        ...filters,
        locations: [...currentLocations, newLocation],
        location: undefined // Clear single location
      });
    }
    
    // Store location data for potential radius-based searches
    setSelectedLocationData(locationData);
  };

  const handleLocationsChange = (locations: string[]) => {
    onFiltersChange({
      ...filters,
      locations: locations.length > 0 ? locations : undefined,
      location: undefined // Clear single location when using multiple locations
    });
  };

  const handleLocationData = (locationData: LocationData | null) => {
    setSelectedLocationData(locationData);
    // Optionally store coordinates for radius-based search
    // This could be used later for proximity-based filtering
  };

  const handleCategorySelect = (category: PropertyCategory) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category
    });
  };

  const handleTagSelect = (tagId: string) => {
    const currentTags = filters.customTags || [];
    const isSelected = currentTags.includes(tagId);
    
    if (isSelected) {
      onFiltersChange({
        ...filters,
        customTags: currentTags.filter(id => id !== tagId)
      });
    } else {
      onFiltersChange({
        ...filters,
        customTags: [...currentTags, tagId]
      });
    }
  };

  const handleAvailabilityStatusSelect = (status: 'available' | 'not-available' | 'coming-soon' | 'under-maintenance') => {
    onFiltersChange({
      ...filters,
      availabilityStatus: filters.availabilityStatus === status ? undefined : status
    });
  };

  // Removed handlePriceRangeChange as per "contact for pricing" model

  const clearFilters = () => {
    onFiltersChange({});
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    // Count locations (either single or multiple)
    if (filters.locations && filters.locations.length > 0) count += filters.locations.length;
    else if (filters.location) count++;
    if (filters.category) count++;
    if (filters.sizeRange) count++;
    if (filters.availabilityStatus) count++;
    if (filters.customTags && filters.customTags.length > 0) count += filters.customTags.length;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <SmartSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onLocationSelect={handleMainSearchLocationSelect}
                placeholder="Search for office spaces, locations, or amenities..."
                className=""
              />
            </div>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 h-12 px-8">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6"
            >
              Filters {getActiveFiltersCount() > 0 && (
                <Badge className="ml-2 bg-primary-600 text-white">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Multi-Location Filter - Now supports multiple locations */}
            <MultiLocationFilter
              selectedLocations={filters.locations || (filters.location ? [filters.location] : [])}
              onLocationsChange={handleLocationsChange}
              onLocationData={handleLocationData}
              placeholder="Search for office locations..."
              restrictToBengaluru={false}
              maxSelections={5}
            />

            {/* Category Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                <Building className="inline mr-2" size={16} />
                Property Type
              </Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.value}
                    variant={filters.category === category.value ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary-100"
                    onClick={() => handleCategorySelect(category.value)}
                  >
                    {category.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Availability Status Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                <CheckCircle className="inline mr-2" size={16} />
                Availability Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {availabilityStatuses.map((status) => (
                  <Badge
                    key={status.value}
                    variant={filters.availabilityStatus === status.value ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary-100"
                    onClick={() => handleAvailabilityStatusSelect(status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                <Tag className="inline mr-2" size={16} />
                Tags
              </Label>
              {loadingTags ? (
                <div className="text-sm text-gray-500">Loading tags...</div>
              ) : availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = filters.customTags?.includes(tag.id) || false;
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary-100"
                        style={isSelected ? {
                          backgroundColor: tag.backgroundColor,
                          color: tag.color,
                          borderColor: tag.color
                        } : {}}
                        onClick={() => handleTagSelect(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No tags available</div>
              )}
            </div>

            {/* Size Range Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                <Square className="inline mr-2" size={16} />
                Size Range
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { min: 0, max: 500, label: 'Under 500 sqft' },
                  { min: 500, max: 1500, label: '500 - 1500 sqft' },
                  { min: 1500, max: 5000, label: '1500 - 5000 sqft' },
                  { min: 5000, max: Infinity, label: 'Above 5000 sqft' },
                ].map((range) => (
                  <Badge
                    key={`${range.min}-${range.max}`}
                    variant={
                      filters.sizeRange?.min === range.min && 
                      filters.sizeRange?.max === range.max ? "default" : "outline"
                    }
                    className="cursor-pointer hover:bg-primary-100 justify-center py-2"
                    onClick={() => onFiltersChange({
                      ...filters,
                      sizeRange: { min: range.min, max: range.max }
                    })}
                  >
                    {range.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertySearch;
