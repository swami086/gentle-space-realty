import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminStore } from '@/store/adminStore';
import { API } from '@/services/apiService';
import { Property } from '@/types/property';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  IndianRupee,
  Square,
  Calendar
} from 'lucide-react';
import PropertyForm from './PropertyForm';

const PropertyManagement: React.FC = () => {
  const { adminProperties, deleteProperty, setAdminProperties } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to prevent unnecessary re-renders
  const loadedRef = useRef(false);

  // Memoize the load properties function to prevent recreating on every render
  const loadProperties = useCallback(async () => {
    if (loadedRef.current) return; // Prevent multiple simultaneous loads
    
    setIsLoading(true);
    setError(null);
    loadedRef.current = true;
    
    try {
      const properties = await API.properties.getAll();
      setAdminProperties(properties);
    } catch (error) {
      console.error('Failed to load admin properties:', error);
      setError('Failed to load properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setAdminProperties]);

  // Load properties from Supabase on component mount - FIXED dependency array
  useEffect(() => {
    if (!loadedRef.current) {
      loadProperties();
    }
  }, []); // Empty dependency array - only run on mount

  // Memoize filtered properties to prevent unnecessary recalculations
  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) return adminProperties;
    
    const searchLower = searchTerm.toLowerCase();
    return adminProperties.filter(property =>
      property.title.toLowerCase().includes(searchLower) ||
      property.location.toLowerCase().includes(searchLower) ||
      property.category.toLowerCase().includes(searchLower)
    );
  }, [adminProperties, searchTerm]);

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await API.deleteProperty(id);
        deleteProperty(id); // Update local state
        console.log('Property deleted successfully');
      } catch (error) {
        console.error('Failed to delete property:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  const handleCloseForm = useCallback(async (shouldRefresh: boolean = false) => {
    setShowForm(false);
    setEditingProperty(null);
    
    // Only refresh if a property was actually saved/updated
    if (shouldRefresh) {
      setIsLoading(true);
      try {
        const properties = await API.properties.getAll();
        setAdminProperties(properties);
      } catch (error) {
        console.error('Failed to refresh properties:', error);
        setError('Failed to refresh properties. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [setAdminProperties]);

  const formatPrice = (price: Property['price']) => {
    // Handle case where price is undefined or null
    if (!price || typeof price.amount !== 'number') {
      return 'Contact for Pricing';
    }
    
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price.amount);
    
    return `${formatted}/${price.period}`;
  };

  const formatLocation = (location: string) => {
    return location.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCategory = (category: string | undefined) => {
    if (!category) {
      return 'Unknown';
    }
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (showForm) {
    return (
      <PropertyForm
        property={editingProperty}
        onClose={handleCloseForm}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-2">Manage your property listings</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search properties by title, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredProperties.length} of {adminProperties.length} properties
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="group hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={property.images && property.images.length > 0 ? property.images[0] : '/api/placeholder/400/300'}
                alt={property.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary-600 text-white">
                  {formatCategory(property.category)}
                </Badge>
              </div>
              {!property.availability?.available && (
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive">Not Available</Badge>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-gray-900 gsr-line-clamp-2">
                {property.title}
              </CardTitle>
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin size={14} className="mr-1" />
                <span>{formatLocation(property.location)}</span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-primary-600">
                    {formatPrice(property.price)}
                  </div>
                  {property.size && property.size.area > 0 && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Square size={14} className="mr-1" />
                      <span>{property.size.area} {property.size.unit}</span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 gsr-line-clamp-2">
                  {property.description}
                </div>

                {property.availability?.availableFrom && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar size={12} className="mr-1" />
                    <span>Available from {new Date(property.availability.availableFrom).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(property.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(property)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(property.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <div className="mx-auto h-12 w-12 mb-4 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No properties found' : 'No properties yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first property listing'
                }
              </p>
            </div>
            {!searchTerm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyManagement;
