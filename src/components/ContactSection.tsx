import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAdminStore } from '@/store/adminStore';
import { CheckCircle } from 'lucide-react';

const ContactSection: React.FC = () => {
  const { addInquiry } = useAdminStore();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add inquiry to admin store
    addInquiry({
      name: formData.name,
      company: formData.company || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      message: formData.message,
    });

    setIsSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        message: '',
      });
      setIsSubmitted(false);
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <section id="contact" className="px-10 py-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 items-center text-center">
          <div className="w-full max-w-2xl bg-green-50 rounded-2xl p-8 border border-green-200">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-800">Thank You!</h3>
              <p className="text-green-700 text-center">
                Your inquiry has been submitted successfully. Our team will get back to you within 24 hours.
              </p>
              <div className="text-sm text-green-600 bg-green-100 px-4 py-2 rounded-lg">
                <strong>24-hour response guarantee</strong> - We'll contact you soon!
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="px-10 py-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 items-center text-center">
        <h2 className="text-gray-900 text-4xl font-extrabold !leading-tight">
          Ready to find your perfect office space?
        </h2>
        <p className="text-gray-600 text-lg">
          Contact us today for a personalized consultation and let us help you navigate the Bengaluru real estate market.
        </p>

        <div className="w-full max-w-2xl bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-900 font-medium text-left block mb-2">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-gray-900 font-medium text-left block mb-2">
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-gray-900 font-medium text-left block mb-2">
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-900 font-medium text-left block mb-2">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message" className="text-gray-900 font-medium text-left block mb-2">
                Tell us about your workspace requirements *
              </Label>
              <Textarea
                id="message"
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="bg-white border-gray-300"
                placeholder="Describe your ideal workspace, team size, location preferences, budget range, and timeline..."
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-600 text-white hover:bg-primary-700 h-12 text-base font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Get Started Today'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>24-hour response guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
