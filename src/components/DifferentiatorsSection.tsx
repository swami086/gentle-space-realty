import React from 'react';
import { CheckCircle } from 'lucide-react';

const DifferentiatorsSection: React.FC = () => {
  const differentiators = [
    {
      title: '100+ Curated Listings',
      description: 'Handpicked workspaces across Bengaluru, from premium business districts to emerging tech hubs.',
    },
    {
      title: 'Local Expertise',
      description: 'Deep knowledge of Bengaluru neighborhoods, transport connectivity, and business ecosystems.',
    },
    {
      title: 'Zero Hidden Fees',
      description: 'Complete transparency in pricing with no surprise charges or hidden brokerage fees.',
    },
    {
      title: 'Personalized Matching',
      description: 'Tailored recommendations based on your company culture, team size, and growth plans.',
    },
    {
      title: '24-Hour Response',
      description: 'Quick turnaround on inquiries with dedicated support throughout your workspace journey.',
    },
    {
      title: 'Ongoing Support',
      description: 'Continued assistance with lease management, space optimization, and future expansion needs.',
    },
  ];

  return (
    <section className="py-32 bg-gradient-2 text-tertiary-foreground">
      <div className="container mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-tertiary-foreground">
            Why Choose Gentle Space
          </h2>
          <p className="text-xl font-sans font-normal text-tertiary-foreground/90 max-w-3xl mx-auto">
            We're more than a real estate consultancy – we're your partners in creating the perfect work environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {differentiators.map((item, index) => (
            <div key={index} className="flex items-start space-x-4 p-6 bg-tertiary-foreground/10 rounded-lg backdrop-blur-sm">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle size={32} className="text-tertiary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-display font-semibold mb-3 text-tertiary-foreground">
                  {item.title}
                </h3>
                <p className="text-tertiary-foreground/90 font-sans font-normal leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DifferentiatorsSection;
