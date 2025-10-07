import React, { useState, useEffect } from 'react';
import { User, Settings, Heart, MessageSquare, Edit2, Save, X, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';
import { API } from '@/services/apiService';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  type: 'sale' | 'rent';
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

interface UserInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  createdAt: string;
  response?: string;
}

export const UserDashboard: React.FC = () => {
  const { user, isAuthenticated, updateProfile, getSavedProperties, unsaveProperty } = useUserStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'saved' | 'inquiries'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [userInquiries, setUserInquiries] = useState<UserInquiry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSavedProperties();
      loadUserInquiries();
    }
  }, [isAuthenticated, user]);

  const loadSavedProperties = async () => {
    try {
      const savedPropertyIds = getSavedProperties();
      
      if (savedPropertyIds.length === 0) {
        setSavedProperties([]);
        return;
      }

      // Fetch real properties from backend using SupabaseService
      const properties = await API.getPropertiesByIds(savedPropertyIds);
      
      // Transform Supabase properties to UserDashboard Property interface
      const transformedProperties: Property[] = properties.map((prop: any) => ({
        id: prop.id,
        title: prop.title,
        location: prop.location,
        price: prop.price || 0,
        image: prop.images?.[0] || '/images/property-placeholder.jpg',
        type: prop.property_type === 'residential' ? 'rent' : 'sale',
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        area: prop.area_sqft,
      }));
      
      setSavedProperties(transformedProperties);
    } catch (error) {
      console.error('Error loading saved properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved properties.',
        variant: 'destructive',
      });
    }
  };

  const loadUserInquiries = async () => {
    if (!user) return;
    
    try {
      // Fetch real inquiries from backend using SupabaseService
      const inquiries = await API.getInquiries({ userId: user.id });
      
      // Transform Supabase inquiries to UserDashboard UserInquiry interface
      const transformedInquiries: UserInquiry[] = inquiries.map((inquiry: any) => ({
        id: inquiry.id,
        propertyId: inquiry.property_id || '',
        propertyTitle: inquiry.properties?.title || 'Unknown Property',
        message: inquiry.message,
        status: inquiry.status === 'new' ? 'pending' : 
                inquiry.status === 'contacted' || inquiry.status === 'in_progress' ? 'responded' : 
                'closed',
        createdAt: inquiry.created_at,
        response: inquiry.notes || undefined,
      }));
      
      setUserInquiries(transformedInquiries);
    } catch (error) {
      console.error('Error loading user inquiries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inquiries.',
        variant: 'destructive',
      });
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const success = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
      });
      
      if (success) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
        });
        setIsEditing(false);
      } else {
        throw new Error('Profile update failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveProperty = async (propertyId: string) => {
    const success = await unsaveProperty(propertyId);
    if (success) {
      // Refresh saved properties
      loadSavedProperties();
      toast({
        title: 'Property Removed',
        description: 'Property has been removed from your saved list.',
      });
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Profile
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'saved'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('saved')}
              >
                <Heart className="w-4 h-4 inline mr-2" />
                Saved Properties ({savedProperties.length})
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inquiries'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('inquiries')}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Inquiries ({userInquiries.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <Button
                    variant="outline"
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  >
                    {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{profileData.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="py-2 text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {profileData.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="py-2 text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {profileData.phone || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-3">
                    <Button onClick={handleProfileUpdate} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Saved Properties Tab */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Saved Properties</h2>
                
                {savedProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Properties</h3>
                    <p className="text-gray-600">
                      Start browsing properties and save your favorites to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedProperties.map((property) => (
                      <div key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{property.location}</p>
                          <p className="text-lg font-bold text-primary-600 mb-3">
                            ${property.price.toLocaleString()}
                          </p>
                          
                          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                            {property.bedrooms && <span>{property.bedrooms} bed</span>}
                            {property.bathrooms && <span>{property.bathrooms} bath</span>}
                            {property.area && <span>{property.area} sqft</span>}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnsaveProperty(property.id)}
                            className="w-full"
                          >
                            <Heart className="w-4 h-4 mr-2 fill-current text-red-500" />
                            Remove from Saved
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Your Inquiries</h2>
                
                {userInquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Inquiries Yet</h3>
                    <p className="text-gray-600">
                      Contact us about properties you're interested in and they'll appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{inquiry.propertyTitle}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(inquiry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              inquiry.status === 'pending' ? 'secondary' :
                              inquiry.status === 'responded' ? 'default' : 'outline'
                            }
                          >
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Your Message:</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                              {inquiry.message}
                            </p>
                          </div>
                          
                          {inquiry.response && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Response:</h4>
                              <p className="text-gray-700 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                                {inquiry.response}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};