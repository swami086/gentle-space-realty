import React, { useEffect, useState } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useFAQStore } from '@/store/faqStore';
import { FAQ, FAQCategory } from '@/types/faq';

const FAQSection: React.FC = () => {
  const { 
    faqs, 
    categories, 
    isLoading, 
    error, 
    loadActiveFAQs, 
    loadActiveCategories,
    getFAQsByCategory,
    getActiveFAQs,
    getActiveCategories,
    initializeWithMockData,
    clearError
  } = useFAQStore();

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeFAQs = async () => {
      if (hasInitialized) return;
      
      try {
        console.log('🚀 Initializing FAQ section...');
        
        // Initialize with mock data first
        initializeWithMockData();
        
        // Then try to load from database
        await Promise.all([
          loadActiveFAQs(),
          loadActiveCategories()
        ]);
        
        setHasInitialized(true);
        console.log('✅ FAQ section initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing FAQ section:', error);
        // Mock data is already loaded, so we can continue
        setHasInitialized(true);
      }
    };

    initializeFAQs();
  }, [hasInitialized, loadActiveFAQs, loadActiveCategories, initializeWithMockData]);

  // Get active data
  const activeFAQs = getActiveFAQs();
  const activeCategories = getActiveCategories();

  // Group FAQs by category
  const faqsByCategory = activeCategories.map(category => ({
    category,
    faqs: getFAQsByCategory(category.id).filter(faq => faq.is_active !== false)
  })).filter(group => group.faqs.length > 0);

  const handleErrorDismiss = () => {
    clearError();
  };

  if (isLoading && !hasInitialized) {
    return (
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our commercial real estate services.
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading FAQs...</span>
          </div>
        </div>
      </section>
    );
  }

  if (faqsByCategory.length === 0) {
    return (
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our commercial real estate services.
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600">No FAQs available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our commercial real estate services.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-yellow-800 text-sm">{error}</p>
              <button
                onClick={handleErrorDismiss}
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}


        {/* FAQ Accordion by Category */}
        <div className="space-y-8">
          {faqsByCategory.map((group) => (
            <div key={group.category.id} className="bg-white rounded-lg shadow-sm border">
              {/* Category Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h3 className="text-xl font-semibold text-gray-900">
                  {group.category.name}
                </h3>
              </div>

              {/* FAQs in Category */}
              <div className="px-6 py-2">
                <Accordion type="multiple" className="space-y-1">
                  {group.faqs.map((faq, index) => (
                    <AccordionItem
                      key={faq.id}
                      value={`faq-${faq.id}`}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <AccordionTrigger className="flex justify-between items-center w-full py-4 text-left hover:bg-gray-50 rounded-lg px-4 group">
                        <span className="text-gray-900 font-medium pr-4 group-hover:text-indigo-600 transition-colors">
                          {faq.question}
                        </span>
                        <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0" />
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 px-4 text-gray-600 leading-relaxed">
                        <div className="prose prose-sm max-w-none">
                          {faq.answer.split('\n').map((paragraph, pIndex) => (
                            <p key={pIndex} className={pIndex > 0 ? 'mt-3' : ''}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our team is here to help you find the perfect commercial space for your business.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
            >
              Contact Us Today
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;