import React, { useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import AboutSection from '@/components/AboutSection';
import CompanyLogosBar from '@/components/CompanyLogosBar';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import ContactSection from '@/components/ContactSection';
import TestimonialSubmission from '@/components/TestimonialSubmission';
import { useTestimonialStore } from '@/store/testimonialStore';
import { mockTestimonials } from '@/data/mockTestimonials';

const HomePage: React.FC = () => {
  const { setTestimonials, loadApprovedTestimonials } = useTestimonialStore();

  useEffect(() => {
    // Load testimonials from Supabase with fallback to mock data
    const loadData = async () => {
      try {
        await loadApprovedTestimonials();
      } catch (error) {
        console.warn('Failed to load from Supabase, using mock data:', error);
        setTestimonials(mockTestimonials);
      }
    };
    
    loadData();
  }, [loadApprovedTestimonials, setTestimonials]);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <CompanyLogosBar />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <TestimonialSubmission />
    </div>
  );
};

export default HomePage;
