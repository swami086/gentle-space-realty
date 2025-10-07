import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const PricingSection: React.FC = () => {
  const plans = [
    {
      name: 'Flexible',
      description: 'Perfect for freelancers and small teams',
      features: [
        'Access to 50+ coworking spaces',
        'Basic workspace matching',
        'Email support',
        'Standard lease assistance',
        'Monthly flexibility',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Team',
      description: 'Ideal for growing businesses',
      features: [
        'Access to 100+ premium spaces',
        'Personalized workspace consultation',
        'Priority support (24-hour response)',
        'Lease negotiation assistance',
        'Quarterly business reviews',
        'Expansion planning support',
      ],
      cta: 'Choose Team',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Comprehensive solutions for large organizations',
      features: [
        'Full portfolio access',
        'Dedicated account manager',
        'Custom workspace solutions',
        'White-glove service',
        'Multi-location support',
        'Strategic planning sessions',
        'Priority access to new listings',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className="py-32 bg-background text-foreground">
      <div className="container mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
            Choose Your Plan
          </h2>
          <p className="text-xl font-sans font-normal text-muted-foreground max-w-3xl mx-auto">
            Transparent pricing with no hidden fees. Find the perfect plan for your workspace needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative bg-card text-card-foreground border transition-all duration-300 transform hover:scale-105 ${
                plan.popular 
                  ? 'border-primary shadow-lg' 
                  : 'border-border hover:border-primary/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-display font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-display font-bold text-card-foreground mb-2">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground font-sans font-normal">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check size={20} className="text-success mt-0.5 flex-shrink-0" />
                      <span className="text-card-foreground font-sans font-normal">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-6">
                  <Button
                    className={`w-full font-normal ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                    }`}
                    onClick={scrollToContact}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground font-sans font-normal mb-6">
            Need a custom solution? We're here to help.
          </p>
          <Button
            className="bg-tertiary text-tertiary-foreground hover:bg-tertiary/90 font-normal"
            onClick={scrollToContact}
          >
            Contact Our Team
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
