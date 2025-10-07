import React, { useEffect, useState } from 'react';
import { usePropertyStore } from '@/store/propertyStore';
import PropertyCard from './PropertyCard';
import PropertySearch from './PropertySearch';
import MapView from './MapView';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Loader2, Map, Grid3X3 } from 'lucide-react';

interface PropertyListingsProps {
  onPropertySelect?: (property: Property) => void;
}

const PropertyListings: React.FC<PropertyListingsProps> = ({ onPropertySelect }) => {
  const {
    filteredProperties,
    filters,
    loading,
    error,
    loadProperties,
    setFilters,
  } = usePropertyStore();

  const isLoading = loading.isLoading;

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const propertiesPerPage = 6;

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleSearch = (query: string) => {
    // Implement search logic here
    console.log('Searching for:', query);
  };

  const handleViewDetails = (property: Property) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };

  const handleContact = (property: Property) => {
    // Implement contact logic (WhatsApp, email, etc.)
    const message = `Hi, I'm interested in ${property.title} located in ${property.location}. Can you provide more details?`;
    const whatsappUrl = `https://wa.me/${property.contact.whatsapp?.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">
          {loading.isRefreshing ? 'Refreshing properties...' : 'Loading properties...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Properties</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadProperties} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <PropertySearch
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Results Summary and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredProperties.length} Properties Found
            </h2>
            <p className="text-gray-600 mt-1">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length} results
            </p>
          </div>
          {loading.isRefreshing && (
            <div className="flex items-center text-primary-600">
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              <span className="text-sm">Updating...</span>
            </div>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex items-center space-x-2"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Grid</span>
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="flex items-center space-x-2"
          >
            <Map className="w-4 h-4" />
            <span>Map</span>
          </Button>
        </div>
      </div>

      {/* Property Grid or Map View */}
      {currentProperties.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={handleViewDetails}
                onContact={handleContact}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map Container */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <MapView
                properties={currentProperties}
                // Show approximate area for all properties or center of Bangalore
                approximateLocation={{
                  area: 'Bangalore',
                  radius: '25km',
                  landmarks: ['Electronic City', 'Whitefield', 'Koramangala', 'Indiranagar']
                }}
                className="w-full"
                height="500px"
                zoom={11}
                showRadius={true}
                interactive={true}
              />
            </div>
            
            {/* Properties List Below Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{property.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{property.location.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-sm text-gray-500 mb-3">{property.size.area} {property.size.unit}</p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(property)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContact(property)}
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({});
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => handlePageChange(page)}
              className="w-10 h-10"
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertyListings;
