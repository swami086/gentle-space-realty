import React, { useEffect } from 'react';
import { useCompanyStore } from '@/store/companyStore';

const CompanyLogosBar: React.FC = () => {
  const { companies, loadActiveCompanies, isLoading, error } = useCompanyStore();

  // Load companies on component mount
  useEffect(() => {
    loadActiveCompanies();
  }, [loadActiveCompanies]);

  // Don't render if loading, has error, or no companies
  if (isLoading || error || companies.length === 0) {
    return null;
  }

  // Duplicate companies array for seamless infinite scroll
  const scrollingCompanies = [...companies, ...companies];

  return (
    <div className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Partners we work with
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Collaborating with {companies.length}+ leading companies to deliver exceptional workspace solutions
          </p>
        </div>
        
        <div className="mt-16 overflow-hidden relative">
          {/* Gradient Overlays */}
          <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex animate-scroll w-max">
            <div className="flex items-center space-x-12 pr-12">
              {scrollingCompanies.map((company, index) => (
                <div
                  key={`${company.id}-${index}`}
                  className="flex-shrink-0 group cursor-pointer"
                  onClick={() => {
                    if (company.website) {
                      window.open(company.website, '_blank');
                    }
                  }}
                >
                  <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="max-h-12 object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                    loading="lazy"
                    title={company.name}
                    onError={(e) => {
                      // Fallback to company name if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const textNode = document.createElement('div');
                      textNode.className = 'text-sm font-semibold text-gray-400 text-center';
                      textNode.textContent = company.name;
                      target.parentNode?.appendChild(textNode);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default CompanyLogosBar;