import React from 'react';

const AboutSection: React.FC = () => {
  const differentiators = [
    {
      icon: 'location_on',
      title: 'Local Expertise',
      description: 'Deep understanding of the Bengaluru commercial real estate market.',
    },
    {
      icon: 'handshake',
      title: 'Trust & Transparency',
      description: 'Committed to ethical practices and clear communication.',
    },
    {
      icon: 'search',
      title: 'Tailored Solutions',
      description: 'Customized approach to meet your specific business needs.',
    },
  ];

  return (
    <section id="about" className="px-10 py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-4 text-center items-center">
          <h2 className="text-gray-900 text-4xl font-extrabold !leading-tight max-w-2xl">
            Why Choose Gentle Space?
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl">
            We go beyond traditional real estate services to provide strategic guidance and support throughout your search for the ideal office space.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {differentiators.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center gap-4 rounded-xl bg-white p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary-100 text-primary-600">
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-gray-900 text-lg font-bold">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl p-12 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-6">
                The Gentle Space Story
              </h3>
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  At Gentle Space, we make the search for your ideal workspace effortless. Whether you're looking for a premium standalone office, a collaborative co-working hub, or a flexible virtual setup, we connect you with spaces tailored to your team, your brand, and your goals.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We're from Bengaluru. This city is our home — and we know it better than anyone. From emerging tech corridors to legacy business districts, we understand the pulse of the market because we live and breathe it every day.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="/images/team/founder.jpeg"
                alt="Gentle Space Founder"
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm font-medium">
                  By Founder: <span className="text-primary-600 font-semibold">Sanjay Singh</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
