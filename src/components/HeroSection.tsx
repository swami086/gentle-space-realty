import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('gsr-animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="px-10 py-20">
      <div className="max-w-7xl mx-auto">
        <div 
          className="flex min-h-[520px] flex-col gap-8 rounded-2xl bg-cover bg-center bg-no-repeat items-start justify-end p-12"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
          }}
        >

          <div 
            ref={heroRef} 
            className="flex flex-col gap-4 text-left max-w-3xl opacity-0 transform translate-y-8 transition-all duration-1000"
          >
            <h1 className="text-white text-5xl font-extrabold !leading-tight">
              More than just space — we help you find your place.
            </h1>
            <p className="text-gray-200 text-lg">
              Gentle Space is a Bengaluru-based real estate consultancy dedicated to helping businesses find the perfect office space. We combine local expertise with a commitment to trust and transparency.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-primary-600 text-white text-base font-bold shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              onClick={() => window.location.href = '/properties'}
            >
              <span className="truncate">Browse Properties</span>
            </Button>
            <Button
              variant="outline"
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 border-primary-600 bg-primary-600 text-white hover:bg-primary-700 hover:border-primary-700 text-base font-bold"
              onClick={() => scrollToSection('contact')}
            >
              <span className="truncate">Get Consultation</span>
            </Button>
          </div>
          
          {/* Admin Portal Access */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 text-sm"
              onClick={() => window.location.href = '/admin'}
            >
              🔐 Admin Portal Access
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
