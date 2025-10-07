import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import LocationInput from '@/components/ui/LocationInput';
import { useAdminStore } from '@/store/adminStore';
import { Property, PropertyCategory, PropertyMedia, PropertyTag } from '@/types/property';
import type { LocationData } from '@/types/property';
import { UploadService } from '@/services/uploadService';
import { API } from '@/services/apiService';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, X, Upload, Trash2, Map, MapPin, Target } from 'lucide-react';
import { Environment } from '@/config/environment';

interface PropertyFormProps {
  property?: Property | null;
  onClose: (shouldRefresh?: boolean) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ property, onClose }) => {
  const { addProperty, updateProperty, admin, isAuthenticated } = useAdminStore();
  const isEditing = !!property;
  const isAdmin = isAuthenticated && admin;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'fully-furnished-offices' as PropertyCategory,
    location: 'Koramangala, Bengaluru' as string,
    price: {
      amount: 0, // Will only be set when admin explicitly configures pricing
      period: 'monthly' as 'monthly' | 'daily' | 'hourly',
    },
    size: {
      area: 0,
      unit: 'sqft' as 'sqft' | 'seats',
    },
    images: ['/images/properties/property-1-office-1.jpg'] as string[],
    media: [] as PropertyMedia[], // New media field
    amenities: ['High-Speed WiFi', 'AC'] as string[],
    availability: {
      available: true,
      availableFrom: '',
    },
    features: {
      furnished: false,
      parking: false,
      wifi: false,
      ac: false,
      security: false,
      cafeteria: false,
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210',
    },
    approximateLocation: undefined,
    coordinates: undefined,
    customTags: [] as PropertyTag[],
  });

  const [availableTags, setAvailableTags] = useState<PropertyTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [isPricingEnabled, setIsPricingEnabled] = useState(false);

  const [newAmenity, setNewAmenity] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [coordinatesInput, setCoordinatesInput] = useState({ lat: '', lng: '' });
  const [selectedLocationData, setSelectedLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoadingTags(true);
        const tags = await API.getAllTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };

    loadTags();
  }, []);

  useEffect(() => {
    if (property) {
      // Check if pricing is set (amount > 0) to enable pricing section
      const hasPricing = property.price && property.price.amount > 0;
      setIsPricingEnabled(hasPricing);
      
      setFormData({
        title: property.title,
        description: property.description,
        category: property.category,
        location: property.location,
        price: property.price || { amount: 0, period: 'monthly' },
        size: property.size,
        images: property.images || [],
        media: property.media || [],
        amenities: property.amenities,
        availability: property.availability,
        features: property.features,
        contact: property.contact,
        approximateLocation: property.approximateLocation,
        coordinates: property.coordinates,
        customTags: property.customTags || [],
      });
      
      // Populate location inputs
      if (property.approximateLocation) {
        const locationText = `${property.approximateLocation.area} - Radius: ${property.approximateLocation.radius}` +
          (property.approximateLocation.landmarks ? ` - Landmarks: ${property.approximateLocation.landmarks.join(', ')}` : '');
        setLocationInput(locationText);
        
        // If we have coordinates, create a location data object for better display
        if (property.coordinates) {
          setSelectedLocationData({
            address: locationText,
            coordinates: property.coordinates,
            placeDetails: {
              placeId: '',
              formattedAddress: locationText,
              types: [],
              name: property.approximateLocation.area
            }
          });
        }
      } else if (property.coordinates) {
        // If we only have coordinates, create a basic location display
        const locationText = `Lat: ${property.coordinates.lat}, Lng: ${property.coordinates.lng}`;
        setLocationInput(locationText);
        setSelectedLocationData({
          address: locationText,
          coordinates: property.coordinates,
          placeDetails: {
            placeId: '',
            formattedAddress: locationText,
            types: []
          }
        });
      }
      
      if (property.coordinates) {
        setCoordinatesInput({
          lat: property.coordinates.lat.toString(),
          lng: property.coordinates.lng.toString()
        });
      }
    }
  }, [property]);

  const categories: { value: PropertyCategory; label: string }[] = [
    { value: 'fully-furnished-offices', label: 'Fully Furnished Offices' },
    { value: 'custom-built-workspaces', label: 'Custom-Built Workspaces' },
    { value: 'co-working-spaces', label: 'Co-working Spaces' },
    { value: 'private-office-cabins', label: 'Private Office Cabins' },
    { value: 'enterprise-offices', label: 'Enterprise Offices' },
    { value: 'virtual-offices', label: 'Virtual Offices' },
    { value: 'meeting-conference-rooms', label: 'Meeting & Conference Rooms' },
  ];

  const popularLocations: { value: string; label: string }[] = [
    { value: 'MG Road, Bengaluru', label: 'MG Road' },
    { value: 'Indiranagar, Bengaluru', label: 'Indiranagar' },
    { value: 'Koramangala, Bengaluru', label: 'Koramangala' },
    { value: 'HSR Layout, Bengaluru', label: 'HSR Layout' },
    { value: 'Whitefield, Bengaluru', label: 'Whitefield' },
    { value: 'Electronic City, Bengaluru', label: 'Electronic City' },
    { value: 'JP Nagar, Bengaluru', label: 'JP Nagar' },
    { value: 'BTM Layout, Bengaluru', label: 'BTM Layout' },
    { value: 'Marathahalli, Bengaluru', label: 'Marathahalli' },
    { value: 'Sarjapur Road, Bengaluru', label: 'Sarjapur Road' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log('🚀 PropertyForm.handleSubmit called');
    console.log('📝 Form data:', formData);
    console.log('🖼️ Selected image files:', selectedImageFiles.length);
    console.log('🎥 Selected video files:', selectedVideoFiles.length);
    console.log('✏️ Is editing:', isEditing);
    
    // Auth is handled by admin store and service - no need for explicit checks here
    
    try {
      // Parse location input to approximate location
      parseLocationFromInput();
      // Parse coordinates from input
      parseCoordinatesFromInput();
      
      // Upload selected files first
      let uploadedMedia: PropertyMedia[] = [];
      if (selectedImageFiles.length > 0 || selectedVideoFiles.length > 0) {
        console.log('📤 Uploading files before property creation...');
        uploadedMedia = await uploadSelectedFiles();
        console.log('✅ Files uploaded successfully:', uploadedMedia.length);
      }

      // Combine existing media with newly uploaded media
      const allMedia = [...formData.media, ...uploadedMedia];
      
      // Update form data with uploaded media and location data
      const finalFormData = {
        ...formData,
        media: allMedia,
        // Only include price if admin explicitly enabled pricing and amount > 0
        ...(isPricingEnabled && formData.price.amount > 0 ? { price: formData.price } : {})
      };
      
      if (isEditing && property) {
        console.log('📝 Updating existing property:', property.id);
        await updateProperty(property.id, finalFormData);
        
        // Update tag assignments
        if (finalFormData.customTags && finalFormData.customTags.length > 0) {
          const tagIds = finalFormData.customTags.map(tag => tag.id);
          await API.assignTagsToProperty(property.id, tagIds);
          console.log('✅ Tags assigned to property');
        }
        
        console.log('✅ Property updated successfully');
      } else {
        console.log('🆕 Creating new property');
        const newProperty = await addProperty(finalFormData);
        
        // Assign tags to new property
        if (finalFormData.customTags && finalFormData.customTags.length > 0 && newProperty?.id) {
          const tagIds = finalFormData.customTags.map(tag => tag.id);
          await API.assignTagsToProperty(newProperty.id, tagIds);
          console.log('✅ Tags assigned to new property');
        }
        
        console.log('✅ Property created successfully');
      }
      
      console.log('🔄 Closing form with refresh');
      onClose(true); // Property was saved, refresh the list
    } catch (error) {
      console.error('❌ PropertyForm error caught:', error);
      console.error('   Error message:', error?.message);
      console.error('   Error stack:', error?.stack);
      console.error('   Error type:', typeof error);
      console.error('   Full error object:', error);
      
      // Show detailed error in alert for debugging
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`❌ PROPERTY CREATION FAILED:\n\nError: ${errorMessage}\n\nType: ${typeof error}\n\nCheck console for more details.`);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 PropertyForm submission complete');
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  // Handle image file selection
  const handleImageFilesSelected = (files: File[]) => {
    console.log('🖼️ Images selected:', files.length);
    setSelectedImageFiles(prev => [...prev, ...files]);
  };

  // Handle video file selection
  const handleVideoFilesSelected = (files: File[]) => {
    console.log('🎥 Videos selected:', files.length);
    setSelectedVideoFiles(prev => [...prev, ...files]);
  };

  // Remove selected image file
  const handleRemoveImageFile = (index: number) => {
    setSelectedImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove selected video file
  const handleRemoveVideoFile = (index: number) => {
    setSelectedVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing media item (with storage cleanup)
  const handleRemoveExistingMedia = async (mediaId: string) => {
    console.log('🗑️ PropertyForm.handleRemoveExistingMedia:', mediaId);
    
    try {
      // Find the media item being removed
      const mediaItem = formData.media.find(m => m.id === mediaId);
      
      if (!mediaItem) {
        console.warn('⚠️ Media item not found in form data:', mediaId);
        return;
      }

      console.log('📄 Media item to remove:', mediaItem);

      // If this is an existing media item with a database ID, delete from database + storage
      if (mediaId && !mediaId.startsWith('temp-')) {
        console.log('🗑️ Deleting existing media from database + storage...');
        
        // Call service to delete from database and storage
        await API.deletePropertyMedia(mediaId);
        console.log('✅ Media deleted from database + storage successfully');
        
      } else {
        console.log('🗑️ Removing temporary/new media from form only...');
        
        // For new media items (uploaded but not yet saved), try to clean up storage
        if (mediaItem.url && !mediaItem.url.startsWith('/images/properties/')) {
          try {
            console.log('🧹 Attempting cleanup of temporary uploaded file...');
            await UploadService.deletePropertyMediaFile(mediaItem.url);
            console.log('✅ Temporary file cleanup successful');
          } catch (cleanupError) {
            console.warn('⚠️ Temporary file cleanup failed (non-critical):', cleanupError);
          }
        }
      }

      // Remove from form data
      setFormData(prev => ({
        ...prev,
        media: prev.media.filter(m => m.id !== mediaId)
      }));
      
      console.log('✅ Media item removed from form');

    } catch (error) {
      console.error('❌ Error removing media:', error);
      
      // Show user-friendly error
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`❌ Failed to remove media:\n\n${errorMessage}\n\nThe media may still appear in the form. Please try again or refresh the page.`);
    }
  };

  // Upload files and update form data
  const uploadSelectedFiles = async (): Promise<PropertyMedia[]> => {
    const uploadedMedia: PropertyMedia[] = [];
    
    // Upload images
    if (selectedImageFiles.length > 0) {
      console.log('📤 Uploading images:', selectedImageFiles.length);
      
      for (const file of selectedImageFiles) {
        try {
          console.log('📤 Uploading image:', file.name);
          const result = await UploadService.uploadFile(file, 'image');
          
          const mediaItem: PropertyMedia = {
            id: uuidv4(),
            type: 'image',
            url: result.url,
            filename: result.filename,
            size: result.size,
            createdAt: new Date().toISOString()
          };
          
          uploadedMedia.push(mediaItem);
          console.log('✅ Image uploaded successfully:', file.name);
          
        } catch (error) {
          console.error('❌ Image upload failed:', error);
          throw error;
        }
      }
    }

    // Upload videos
    if (selectedVideoFiles.length > 0) {
      console.log('📤 Uploading videos:', selectedVideoFiles.length);
      
      for (const file of selectedVideoFiles) {
        try {
          console.log('📤 Uploading video:', file.name);
          const result = await UploadService.uploadFile(file, 'video');
          
          const mediaItem: PropertyMedia = {
            id: uuidv4(),
            type: 'video',
            url: result.url,
            filename: result.filename,
            size: result.size,
            createdAt: new Date().toISOString()
          };
          
          uploadedMedia.push(mediaItem);
          console.log('✅ Video uploaded successfully:', file.name);
          
        } catch (error) {
          console.error('❌ Video upload failed:', error);
          throw error;
        }
      }
    }
    
    return uploadedMedia;
  };

  // Tag management functions
  const handleTagSelect = (tag: PropertyTag) => {
    const isSelected = formData.customTags.some(t => t.id === tag.id);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        customTags: prev.customTags.filter(t => t.id !== tag.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customTags: [...prev.customTags, tag]
      }));
    }
  };

  // Helper to parse coordinates from input
  const parseCoordinatesFromInput = () => {
    if (coordinatesInput.lat && coordinatesInput.lng) {
      const lat = parseFloat(coordinatesInput.lat);
      const lng = parseFloat(coordinatesInput.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setFormData(prev => ({
          ...prev,
          coordinates: { lat, lng }
        }));
      }
    }
  };

  // Handler for location selection from Google Places Autocomplete
  const handleLocationSelect = (locationData: LocationData) => {
    console.log('Location selected:', locationData);
    
    // Store the selected location data
    setSelectedLocationData(locationData);
    
    // Update the location input display
    setLocationInput(locationData.address);
    
    // Automatically set coordinates from the selected location
    setCoordinatesInput({
      lat: locationData.coordinates.lat.toString(),
      lng: locationData.coordinates.lng.toString()
    });
    
    // Update form data with coordinates and location
    setFormData(prev => ({
      ...prev,
      location: locationData.address, // Update main location field
      coordinates: locationData.coordinates,
      // Store Google Places details for enhanced search/display
      placeDetails: locationData.placeDetails,
      // Create a reasonable approximate location from the selected address
      approximateLocation: {
        area: locationData.placeDetails?.name || locationData.address.split(',')[0] || '',
        radius: '1km', // default radius
        landmarks: locationData.placeDetails?.vicinity ? [locationData.placeDetails.vicinity] : undefined
      }
    }));
    
    console.log('Form data updated with location:', {
      location: locationData.address,
      coordinates: locationData.coordinates,
      placeDetails: locationData.placeDetails,
      approximateLocation: {
        area: locationData.placeDetails?.name || locationData.address.split(',')[0] || '',
        radius: '1km'
      }
    });
  };

  // Helper to parse location input to approximate location (fallback for manual input)
  const parseLocationFromInput = () => {
    if (locationInput.trim()) {
      const parts = locationInput.split('-').map(p => p.trim());
      const area = parts[0] || '';
      
      let radius = '2km'; // default
      let landmarks: string[] = [];
      
      parts.forEach(part => {
        if (part.toLowerCase().startsWith('radius:')) {
          radius = part.split(':')[1]?.trim() || '2km';
        } else if (part.toLowerCase().startsWith('landmarks:')) {
          const landmarkStr = part.split(':')[1]?.trim() || '';
          landmarks = landmarkStr.split(',').map(l => l.trim()).filter(l => l.length > 0);
        }
      });
      
      setFormData(prev => ({
        ...prev,
        approximateLocation: {
          area,
          radius,
          landmarks: landmarks.length > 0 ? landmarks : undefined
        }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => onClose(false)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing ? 'Update property details' : 'Create a new property listing'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Property title, description, and category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Premium Furnished Office in Koramangala"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the property..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as PropertyCategory }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Koramangala, Bengaluru or use location search below"
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the Location Search section below for accurate Google Places data, or enter manually here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Size */}
        <Card>
          <CardHeader>
            <CardTitle>Property Size</CardTitle>
            <CardDescription>Set area and unit details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Area *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="area"
                    type="number"
                    value={formData.size.area}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      size: { ...prev.size, area: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="2500"
                    required
                  />
                  <select
                    value={formData.size.unit}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      size: { ...prev.size, unit: e.target.value as 'sqft' | 'seats' }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="sqft">sqft</option>
                    <option value="seats">seats</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internal Pricing (Admin Only) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Pricing (Admin Only)</CardTitle>
              <CardDescription>Set internal pricing information - not visible to public users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enablePricing"
                  checked={isPricingEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setIsPricingEnabled(enabled);
                    if (!enabled) {
                      // Reset price when disabled
                      setFormData(prev => ({
                        ...prev,
                        price: { amount: 0, period: 'monthly' }
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <Label htmlFor="enablePricing" className="text-sm font-medium text-gray-700">
                  Enable internal pricing tracking
                </Label>
              </div>
              
              {isPricingEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <Label htmlFor="priceAmount">Price Amount</Label>
                    <Input
                      id="priceAmount"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price.amount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        price: { ...prev.price, amount: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="e.g., 25000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePeriod">Period</Label>
                    <select
                      id="pricePeriod"
                      value={formData.price.period}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        price: { ...prev.price, period: e.target.value as 'monthly' | 'daily' | 'hourly' }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Note:</strong> Internal pricing information is only visible to admin users and is not displayed to public visitors. 
                This can be used for internal cost tracking and management purposes.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location & Map Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Map Information</CardTitle>
            <CardDescription>Set approximate location and precise coordinates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Input - Fallback to basic text input when Google Maps API unavailable */}
            <div>
              {Environment.hasGoogleMapsKey() ? (
                <LocationInput
                  value={locationInput}
                  onChange={handleLocationSelect}
                  placeholder="Search for any location (e.g., Forum Mall, Koramangala, Bangalore)"
                  label="Location Search"
                  restrictToBengaluru={false}
                  className="mb-4"
                />
              ) : (
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocationInput(value);
                      // Create basic location data without coordinates
                      if (value.trim()) {
                        handleLocationSelect({
                          address: value,
                          coordinates: { lat: 0, lng: 0 }, // Default coordinates
                          placeDetails: {
                            placeId: `manual-${Date.now()}`,
                            formattedAddress: value,
                            types: ['establishment']
                          }
                        });
                      }
                    }}
                    placeholder="Enter location manually (e.g., Forum Mall, Koramangala, Bangalore)"
                    className="w-full"
                    required
                  />
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">
                    💡 Google Maps integration unavailable - using manual location entry
                  </div>
                </div>
              )}
              
              {/* Selected Location Details */}
              {selectedLocationData && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Selected Location
                      </p>
                      <p className="text-sm text-green-700">
                        {selectedLocationData.address}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Coordinates: {selectedLocationData.coordinates.lat.toFixed(6)}, {selectedLocationData.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Start typing to search for locations. Selecting from the dropdown automatically fills coordinates.
              </p>
            </div>

            {/* Manual Input Fallback */}
            <div className="border-t border-gray-200 pt-6">
              <Label htmlFor="manualLocation" className="flex items-center mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                Manual Location Input (Alternative)
              </Label>
              <Input
                id="manualLocation"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g., Koramangala - Radius: 2km - Landmarks: Forum Mall, Sony Signal"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Area - Radius: 2km - Landmarks: landmark1, landmark2
              </p>
            </div>

            {/* Precise Coordinates */}
            <div>
              <Label className="flex items-center mb-2">
                <Target className="w-4 h-4 mr-2" />
                Precise Coordinates
                {selectedLocationData && (
                  <span className="ml-2 text-xs text-green-600">(Auto-filled from location search)</span>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude" className="text-sm">Latitude</Label>
                  <Input
                    id="latitude"
                    value={coordinatesInput.lat}
                    onChange={(e) => setCoordinatesInput(prev => ({ ...prev, lat: e.target.value }))}
                    placeholder="12.9716"
                    type="number"
                    step="any"
                    readOnly={!!selectedLocationData}
                    className={selectedLocationData ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-sm">Longitude</Label>
                  <Input
                    id="longitude"
                    value={coordinatesInput.lng}
                    onChange={(e) => setCoordinatesInput(prev => ({ ...prev, lng: e.target.value }))}
                    placeholder="77.5946"
                    type="number"
                    step="any"
                    readOnly={!!selectedLocationData}
                    className={selectedLocationData ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedLocationData 
                  ? 'Coordinates were automatically filled from your location search.'
                  : 'Get coordinates from Google Maps: Right-click → "What\'s here?"'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tag Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Assignment</CardTitle>
            <CardDescription>Assign custom tags to categorize this property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingTags ? (
              <div className="text-sm text-gray-500">Loading tags...</div>
            ) : availableTags.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = formData.customTags.some(t => t.id === tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary-100 px-3 py-2 text-sm"
                        style={isSelected ? {
                          backgroundColor: tag.backgroundColor,
                          color: tag.color,
                          borderColor: tag.color
                        } : {}}
                        onClick={() => handleTagSelect(tag)}
                      >
                        {tag.name}
                        {tag.description && (
                          <span className="ml-1 text-xs opacity-75">({tag.description})</span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
                
                {formData.customTags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Selected Tags:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.customTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          className="text-sm"
                          style={{
                            backgroundColor: tag.backgroundColor,
                            color: tag.color,
                            borderColor: tag.color
                          }}
                        >
                          {tag.name}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="ml-1 h-auto p-0 text-current hover:bg-black/10"
                            onClick={() => handleTagSelect(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No tags available. Create tags in the Tag Management section first.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Property Media</CardTitle>
            <CardDescription>Upload property images and videos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload Section */}
            <div>
              <Label className="text-base font-medium">Property Images</Label>
              <p className="text-sm text-gray-500 mb-3">Upload high-quality images of your property</p>
              <FileUpload
                onFilesSelected={handleImageFilesSelected}
                onFileRemove={handleRemoveImageFile}
                acceptedTypes="image"
                maxFiles={10}
                maxFileSize={10}
                disabled={isSubmitting}
              />
            </div>

            {/* Video Upload Section */}
            <div>
              <Label className="text-base font-medium">Property Videos</Label>
              <p className="text-sm text-gray-500 mb-3">Upload property tour videos or virtual walkthrough</p>
              <FileUpload
                onFilesSelected={handleVideoFilesSelected}
                onFileRemove={handleRemoveVideoFile}
                acceptedTypes="video"
                maxFiles={3}
                maxFileSize={50}
                disabled={isSubmitting}
              />
            </div>

            {/* Existing Media Display */}
            {formData.media.length > 0 && (
              <div>
                <Label className="text-base font-medium">Current Property Media</Label>
                <p className="text-sm text-gray-500 mb-3">Existing images and videos for this property</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.media.map((mediaItem) => (
                    <Card key={mediaItem.id} className="relative overflow-hidden">
                      <div className="aspect-square relative">
                        {mediaItem.type === 'image' ? (
                          <img
                            src={mediaItem.url}
                            alt={mediaItem.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                            {mediaItem.thumbnailUrl ? (
                              <img
                                src={mediaItem.thumbnailUrl}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-400 text-center">
                                <Upload className="w-8 h-8 mx-auto mb-1" />
                                <p className="text-xs">Video</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                              <Upload className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                        
                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-1 right-1 w-6 h-6 p-0 bg-white hover:bg-gray-50"
                          onClick={() => {
                            // Handle async media deletion
                            handleRemoveExistingMedia(mediaItem.id).catch(error => {
                              console.error('❌ Failed to remove media:', error);
                            });
                          }}
                          type="button"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate" title={mediaItem.filename}>
                          {mediaItem.filename}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(mediaItem.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Select available features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(formData.features).map(([feature, enabled]) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, [feature]: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>Add property amenities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="e.g., High-Speed WiFi"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" onClick={addAmenity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <Badge key={index} variant="outline" className="pr-1">
                  {amenity}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-auto p-0 text-gray-500 hover:text-red-500"
                    onClick={() => removeAmenity(amenity)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Set availability status and date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="availabilityStatus">Availability Status *</Label>
              <select
                id="availabilityStatus"
                value={formData.availability?.status || 'available'}
                onChange={(e) => {
                  const status = e.target.value as 'available' | 'not-available' | 'coming-soon' | 'under-maintenance';
                  setFormData(prev => ({
                    ...prev,
                    availability: {
                      ...prev.availability,
                      status,
                      available: status === 'available'
                    }
                  }));
                }}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="available">Available</option>
                <option value="not-available">Not Available</option>
                <option value="coming-soon">Coming Soon</option>
                <option value="under-maintenance">Under Maintenance</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.availability.available}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  availability: { ...prev.availability, available: e.target.checked }
                }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Available for rent (legacy field)</span>
            </label>

            {(formData.availability.available || formData.availability?.status === 'available') && (
              <div>
                <Label htmlFor="availableFrom">Available From</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availability.availableFrom}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, availableFrom: e.target.value }
                  }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Contact details for inquiries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  placeholder="+91-9876543210"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  placeholder="contact@gentlespace.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.contact.whatsapp}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, whatsapp: e.target.value }
                  }))}
                  placeholder="+91-9876543210"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Property' : 'Create Property')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
