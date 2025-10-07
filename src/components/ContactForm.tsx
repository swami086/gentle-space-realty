import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API } from '@/services/apiService';
import { formatApiError } from '@/utils/apiMigrationUtils';
import { Property } from '@/types/property';
import { Loader2, Mail, Phone, User, MessageSquare } from 'lucide-react';

interface ContactFormProps {
  property?: Property;
  onSuccess?: () => void;
  onClose?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ property, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    inquiryType: 'general' as 'general' | 'showing' | 'offer' | 'information' | 'callback'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields.');
      console.log('⚠️ Missing required fields in form submission');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const inquiryData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message,
        inquiry_type: formData.inquiryType,
        property_id: property?.id || null,
        status: 'new',
        priority: 'medium',
        source: 'website'
      };

      console.log('📝 Submitting inquiry:', {
        name: formData.name,
        email: formData.email,
        inquiry_type: formData.inquiryType,
        has_property: !!property?.id,
        message_length: formData.message.length
      });

      console.log('📤 Attempting to submit inquiry via API');

      await API.inquiries.create(inquiryData);

      console.log('✅ Inquiry submitted successfully');

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        inquiryType: 'general'
      });

      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }

      // Remove transaction reference as it's not defined

    } catch (error: any) {
      console.error('❌ Failed to submit inquiry:', error);
      
      setError(formatApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="text-center py-8">
          <div className="text-green-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h3>
          <p className="text-gray-600 mb-4">
            Your inquiry has been submitted successfully. We'll get back to you soon.
          </p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Contact Us
        </CardTitle>
        <CardDescription>
          {property 
            ? `Interested in ${property.title}? Send us a message.`
            : 'We\'d love to hear from you. Send us a message and we\'ll get back to you soon.'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91-9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiryType">Inquiry Type</Label>
              <Select
                value={formData.inquiryType}
                onValueChange={(value) => handleInputChange('inquiryType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Information</SelectItem>
                  <SelectItem value="showing">Schedule Showing</SelectItem>
                  <SelectItem value="offer">Make an Offer</SelectItem>
                  <SelectItem value="information">Property Details</SelectItem>
                  <SelectItem value="callback">Request Callback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message *
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder={property 
                ? `Hi, I'm interested in ${property.title}. Can you provide more details?`
                : 'Tell us how we can help you...'
              }
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
            
            {onClose && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;