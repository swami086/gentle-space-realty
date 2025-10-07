import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: 'chair',
      title: 'Fully Furnished Offices',
      description: 'Ready-to-move-in spaces with premium interiors, ergonomic furniture, and plug-and-play infrastructure.',
      features: ['Premium Interiors', 'Ergonomic Furniture', 'Plug-and-Play Setup'],
      popular: true,
    },
    {
      icon: 'build',
      title: 'Custom-Built Workspaces',
      description: 'Tailor your layout, branding, and setup — create an environment that feels truly yours.',
      features: ['Custom Layout', 'Brand Integration', 'Personalized Design'],
      popular: false,
    },
    {
      icon: 'groups',
      title: 'Co-working Spaces',
      description: 'Flexible desks and shared spaces in vibrant communities designed for collaboration and networking.',
      features: ['Flexible Seating', 'Networking Events', 'Community Access'],
      popular: true,
    },
    {
      icon: 'lock',
      title: 'Private Office Cabins',
      description: 'Secure, enclosed spaces for teams needing privacy, focus, and a professional setting.',
      features: ['Complete Privacy', 'Secure Access', 'Professional Setting'],
      popular: false,
    },
    {
      icon: 'business',
      title: 'Enterprise Offices',
      description: 'Large-scale office facilities built for scalability, ideal for corporates and fast-growing teams.',
      features: ['Scalable Infrastructure', 'Enterprise Grade', 'Growth Ready'],
      popular: false,
    },
    {
      icon: 'language',
      title: 'Virtual Offices',
      description: 'Establish your business presence in key cities with a premium address, GST registration, and mail handling — no physical office required.',
      features: ['Premium Address', 'GST Registration', 'Mail Handling'],
      popular: true,
    },
  ];

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const trustIndicators = [
    { number: '100%', label: 'Verified Properties' },
    { number: '24hr', label: 'Response Guarantee' },
    { number: '0%', label: 'Hidden Fees' },
  ];

  return (
    <section id="services" className="px-10 py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-4 text-center items-center">
          <h2 className="text-gray-900 text-4xl font-extrabold !leading-tight max-w-2xl">
            Office Space Solutions by Gentle Space
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl">
            Your workspace, redefined. From early-stage startups to enterprise giants, Gentle Space delivers workspace solutions that inspire productivity, reflect your brand, and scale with your business.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {trustIndicators.map((indicator, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {indicator.number}
              </div>
              <div className="text-gray-600 text-sm">
                {indicator.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="relative flex flex-col items-center text-center gap-4 rounded-xl bg-white p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group"
              onClick={scrollToContact}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary-600 text-white">Popular</Badge>
                </div>
              )}
              
              <div className="text-6xl text-center mb-6 icon-gradient">
                <span className="material-icons-outlined" style={{ fontSize: 'inherit' }}>
                  {service.icon}
                </span>
              </div>
              
              <CardHeader className="p-0">
                <CardTitle className="text-gray-900 text-lg font-bold mb-2">
                  {service.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <CardDescription className="text-gray-600 text-sm leading-relaxed mb-4">
                  {service.description}
                </CardDescription>
                
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <Badge key={featureIndex} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                
                <Button 
                  className="bg-primary-600 text-white hover:bg-primary-700 text-sm w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToContact();
                  }}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;
