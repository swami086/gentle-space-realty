import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTestimonialStore } from '@/store/testimonialStore';

const TestimonialsSection: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { testimonials: storeTestimonials, loadTestimonials } = useTestimonialStore();

  // Load testimonials on component mount
  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  // Get approved testimonials for display
  const approvedTestimonials = storeTestimonials.filter(t => t.status === 'approved');
  
  // Fallback testimonials when no approved testimonials are available
  const fallbackTestimonials = [
    {
      id: 'fallback-1',
      name: 'Priya Sharma',
      company: 'TechStart Solutions',
      role: 'Founder & CEO',
      content: 'Gentle Space helped us find the perfect coworking space in Koramangala that matched our startup culture. Their understanding of our needs and budget constraints was exceptional.',
      rating: 5,
      email: '',
      phone: '',
      status: 'approved' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'fallback-2',
      name: 'Rajesh Kumar',
      company: 'Digital Innovations Pvt Ltd',
      role: 'Operations Manager',
      content: 'The transparency and professionalism of Gentle Space made our office relocation seamless. No hidden fees, clear communication, and ongoing support throughout the process.',
      rating: 5,
      email: '',
      phone: '',
      status: 'approved' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'fallback-3',
      name: 'Anita Reddy',
      company: 'Creative Minds Agency',
      role: 'Creative Director',
      content: 'Their local expertise in Bengaluru helped us discover a workspace in Indiranagar that we never would have found on our own. The space perfectly reflects our creative energy.',
      rating: 5,
      email: '',
      phone: '',
      status: 'approved' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Use approved testimonials or fallback to hardcoded ones
  const testimonials = approvedTestimonials.length > 0 ? approvedTestimonials : fallbackTestimonials;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="px-10 py-20 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-900 text-4xl font-extrabold !leading-tight mb-4">
            What Our Clients Say
          </h2>
          <p className="text-gray-600 text-lg">
            Hear from businesses who found their perfect workspace with Gentle Space.
          </p>
        </div>

        <div className="relative">
          {testimonials.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200 text-center">
              <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No testimonials yet</h3>
              <p className="text-gray-600">Be the first to share your experience with Gentle Space!</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="flex space-x-1">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} size={24} className="text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            
            <blockquote className="text-xl text-center text-gray-900 mb-8 leading-relaxed font-medium">
              "{testimonials[currentTestimonial].content}"
            </blockquote>
            
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                {testimonials[currentTestimonial].name}
              </h4>
              <p className="text-gray-600">
                {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
              </p>
            </div>
          </div>
          )}

          {/* Navigation Buttons - only show if we have testimonials */}
          {testimonials.length > 1 && (
            <div className="flex justify-center space-x-4 mt-8">
              <Button
                className="bg-primary-600 text-white hover:bg-primary-700 p-3 rounded-full"
                onClick={prevTestimonial}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                className="bg-primary-600 text-white hover:bg-primary-700 p-3 rounded-full"
                onClick={nextTestimonial}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          )}

          {/* Dots Indicator - only show if we have multiple testimonials */}
          {testimonials.length > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    index === currentTestimonial ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
