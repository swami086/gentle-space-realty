import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Calendar,
  Users,
  Building,
  Phone,
  Mail,
  Loader,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Property } from '@/types/property';
import { Message, InquiryFormContext } from '@/types/thesys';
import { usePropertyStore } from '@/store/propertyStore';
import { useAIStore } from '@/store/aiStore';
import { useThesysC1 } from '@/hooks/useThesysC1';
import { GenUIRenderer } from './GenUIRenderer';

interface SmartInquiryFormProps {
  property?: Property;
  userIntent?: string;
  previousMessages?: Message[];
  onSubmit?: (formData: InquiryFormData) => void;
  onClose?: () => void;
  className?: string;
}

interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  teamSize: number;
  moveInDate: string;
  duration: string;
  specificRequirements: string;
  contactPreference: 'email' | 'phone' | 'whatsapp';
  urgency: 'low' | 'medium' | 'high';
}

export const SmartInquiryForm: React.FC<SmartInquiryFormProps> = ({
  property,
  userIntent = '',
  previousMessages = [],
  onSubmit,
  onClose,
  className = ''
}) => {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    teamSize: 1,
    moveInDate: '',
    duration: '',
    specificRequirements: '',
    contactPreference: 'email',
    urgency: 'medium'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<Partial<InquiryFormData>>({});

  const { conversationHistory, addToHistory } = useAIStore();
  const {
    uiSpec,
    loading: aiLoading,
    error: aiError,
    generateUI,
    reset: resetAI
  } = useThesysC1();

  // Auto-populate form based on conversation context
  useEffect(() => {
    if (userIntent || previousMessages.length > 0) {
      extractFormDataFromContext();
    }
  }, [userIntent, previousMessages]);

  // Generate AI-enhanced form fields
  useEffect(() => {
    if (property || userIntent) {
      generateSmartFormFields();
    }
  }, [property, userIntent]);

  const extractFormDataFromContext = () => {
    // Extract information from user intent and previous messages
    const allText = [userIntent, ...previousMessages.map(m => m.content)].join(' ').toLowerCase();
    
    // Extract team size
    const teamSizeMatch = allText.match(/(\d+)\s*(?:people|members|team|persons)/);
    if (teamSizeMatch) {
      setFormData(prev => ({ ...prev, teamSize: parseInt(teamSizeMatch[1]) }));
    }

    // Extract urgency indicators
    if (allText.includes('urgent') || allText.includes('asap') || allText.includes('immediately')) {
      setFormData(prev => ({ ...prev, urgency: 'high' }));
    }

    // Extract move-in timeframe
    const timeframeKeywords = {
      'this week': 'high',
      'next week': 'high', 
      'this month': 'medium',
      'next month': 'medium',
      'in a month': 'medium',
      'few months': 'low'
    };

    Object.entries(timeframeKeywords).forEach(([keyword, urgency]) => {
      if (allText.includes(keyword)) {
        setFormData(prev => ({ ...prev, urgency: urgency as 'low' | 'medium' | 'high' }));
      }
    });

    // Extract duration preferences
    if (allText.includes('short term') || allText.includes('temporary')) {
      setFormData(prev => ({ ...prev, duration: 'short-term' }));
    } else if (allText.includes('long term') || allText.includes('permanent')) {
      setFormData(prev => ({ ...prev, duration: 'long-term' }));
    }
  };

  const generateSmartFormFields = async () => {
    try {
      const context: InquiryFormContext = {
        property,
        userIntent,
        previousMessages
      };

      await generateUI(
        `Generate a smart inquiry form for ${property ? property.title : 'general property inquiry'}`,
        context
      );
    } catch (error) {
      console.error('Failed to generate smart form fields:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<InquiryFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (formData.teamSize < 1 || formData.teamSize > 1000) {
      errors.teamSize = 'Team size must be between 1 and 1000';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof InquiryFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Add inquiry to conversation history
      const inquiryMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Property Inquiry: ${property?.title || 'General Inquiry'}\n` +
                 `Contact: ${formData.name} (${formData.email}, ${formData.phone})\n` +
                 `Team Size: ${formData.teamSize}\n` +
                 `Requirements: ${formData.specificRequirements || 'None specified'}`,
        timestamp: new Date()
      };

      addToHistory(inquiryMessage);

      // Submit the form (mock API call)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitStatus('success');
      
      // Call onSubmit if provided
      onSubmit?.(formData);

    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Smart Inquiry Form
            </h2>
            {property && (
              <p className="text-sm text-gray-600">
                For: {property.title}
              </p>
            )}
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      {/* AI-Generated Form Enhancements */}
      {uiSpec && (
        <div className="p-6 border-b bg-gray-50">
          <GenUIRenderer
            uiSpec={uiSpec}
            context={{ property, userIntent, previousMessages }}
            className="mb-4"
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91 9876543210"
                className={validationErrors.phone ? 'border-red-500' : ''}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="company">Company/Organization</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your company name"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Space Requirements
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teamSize">Team Size</Label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <Input
                  id="teamSize"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                  className={validationErrors.teamSize ? 'border-red-500' : ''}
                />
              </div>
              {validationErrors.teamSize && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.teamSize}</p>
              )}
            </div>

            <div>
              <Label htmlFor="moveInDate">Preferred Move-in Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  id="moveInDate"
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => handleInputChange('moveInDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Lease Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => handleInputChange('duration', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-term">Short term (3-6 months)</SelectItem>
                  <SelectItem value="medium-term">Medium term (6-12 months)</SelectItem>
                  <SelectItem value="long-term">Long term (1+ years)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => handleInputChange('urgency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Looking ahead</SelectItem>
                  <SelectItem value="medium">Medium - Within 1-2 months</SelectItem>
                  <SelectItem value="high">High - ASAP/Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Additional Details
          </h3>

          <div>
            <Label htmlFor="specificRequirements">
              Specific Requirements or Questions
            </Label>
            <Textarea
              id="specificRequirements"
              value={formData.specificRequirements}
              onChange={(e) => handleInputChange('specificRequirements', e.target.value)}
              placeholder="Any specific amenities, location preferences, budget considerations, or questions you have..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="contactPreference">Preferred Contact Method</Label>
            <Select
              value={formData.contactPreference}
              onValueChange={(value) => handleInputChange('contactPreference', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="How would you like us to contact you?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Call
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Urgency Indicator */}
        {formData.urgency !== 'medium' && (
          <div className={`p-3 rounded-lg border ${getUrgencyColor(formData.urgency)}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {formData.urgency === 'high' ? 'High Priority Request' : 'Low Priority Request'}
              </span>
            </div>
            <p className="text-sm mt-1">
              {formData.urgency === 'high' 
                ? 'We\'ll prioritize your request and get back to you within 2-4 hours.'
                : 'We\'ll get back to you within 24-48 hours with detailed information.'
              }
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {submitStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Inquiry submitted successfully!</span>
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Failed to submit. Please try again.</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success'}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submitted
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Inquiry
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            Need immediate assistance? Call us at{' '}
            <a href="tel:+919876543210" className="text-blue-500 hover:text-blue-600 font-medium">
              +91 98765 43210
            </a>
            {' '}or message us on{' '}
            <a href="https://wa.me/919876543210" className="text-green-500 hover:text-green-600 font-medium">
              WhatsApp
            </a>
          </p>
        </div>
      </form>
    </Card>
  );
};