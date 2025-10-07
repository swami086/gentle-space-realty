/**
 * C1UISpecRenderer Component
 * 
 * Specialized component for rendering C1 UI component specifications
 * returned by the C1 transform-scrape endpoint when it generates
 * structured UI components instead of traditional property extraction.
 */

import React, { useMemo } from 'react';
import { Star, MapPin, Calendar, DollarSign, Square, Users, Wifi, Car, Coffee, Shield, Zap, Building } from 'lucide-react';

// Interface for C1 UI Specification response
interface C1UISpec {
  component?: {
    component: string;
    props: any;
  };
  components?: any[];
  type?: string;
  rawContent?: string;
}

// Interface for C1 response with UI specifications
interface C1UISpecResponse {
  success: boolean;
  uiSpec?: C1UISpec;
  properties?: any[];
  metadata?: {
    confidence?: number;
    warnings?: string[];
    fieldsExtracted?: string[];
    fieldsMissing?: string[];
    extractionMode?: string;
    componentType?: string;
    processingTime?: number;
    model?: string;
    tokensUsed?: number;
  };
}

// Component props
interface C1UISpecRendererProps {
  c1Response: C1UISpecResponse;
  sourceUrl?: string;
  onPropertyExtract?: (properties: any[]) => void;
  onClose?: () => void;
  className?: string;
}

export const C1UISpecRenderer: React.FC<C1UISpecRendererProps> = ({
  c1Response,
  sourceUrl,
  onPropertyExtract,
  onClose,
  className = ''
}) => {
  // Process the UI specification for rendering
  const processedUISpec = useMemo(() => {
    if (!c1Response.uiSpec) {
      console.log('No uiSpec in C1 response:', c1Response);
      return null;
    }

    const { uiSpec } = c1Response;
    console.log('Processing C1 uiSpec:', uiSpec);

    // Handle different UI spec formats
    if (uiSpec.component) {
      // Single component format
      console.log('Single component format detected:', uiSpec.component);
      return {
        type: 'single-component',
        component: uiSpec.component
      };
    } else if (uiSpec.components && Array.isArray(uiSpec.components)) {
      // Multi-component format
      console.log('Multi-component format detected:', uiSpec.components);
      return {
        type: 'multi-component',
        components: uiSpec.components
      };
    } else if (uiSpec.rawContent) {
      // Raw content format
      console.log('Raw content format detected:', uiSpec.rawContent);
      return {
        type: 'raw-content',
        content: uiSpec.rawContent
      };
    } else if (typeof uiSpec === 'object' && uiSpec.type) {
      // Direct component specification
      console.log('Direct component specification detected:', uiSpec);
      return {
        type: 'single-component',
        component: uiSpec
      };
    }

    console.log('Unknown uiSpec format:', uiSpec);
    return {
      type: 'unknown',
      data: uiSpec
    };
  }, [c1Response.uiSpec]);

  // Generate context for C1Component
  const c1Context = useMemo(() => ({
    sourceUrl,
    extractionMetadata: c1Response.metadata,
    extractionMode: c1Response.metadata?.extractionMode || 'ui-generation',
    processingInfo: {
      model: c1Response.metadata?.model,
      tokensUsed: c1Response.metadata?.tokensUsed,
      processingTime: c1Response.metadata?.processingTime
    }
  }), [sourceUrl, c1Response.metadata]);

  // Handle property extraction if any properties were also returned
  const handleExtractProperties = () => {
    if (c1Response.properties && c1Response.properties.length > 0 && onPropertyExtract) {
      onPropertyExtract(c1Response.properties);
    }
  };

  if (!processedUISpec) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg border ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No UI Specification Available
          </h3>
          <p className="text-gray-600">
            The C1 response did not contain a valid UI specification to render.
          </p>
          {c1Response.properties && c1Response.properties.length > 0 && (
            <button
              onClick={handleExtractProperties}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Extracted Properties Instead
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render a UI component based on C1 specifications
  const renderUIComponent = (component: any, index: number = 0) => {
    if (!component || !component.component) {
      return <div key={index} className="p-4 text-gray-500 text-center">Invalid component specification</div>;
    }

    const { component: componentType, props } = component;

    switch (componentType) {
      case 'Card':
        return (
          <div key={index} className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-200">
            {props.header && (
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">{props.header.title}</h3>
                {props.header.subtitle && (
                  <p className="text-gray-600 mt-1">{props.header.subtitle}</p>
                )}
              </div>
            )}
            <div className="p-6">
              {props.content && renderContent(props.content)}
            </div>
          </div>
        );
        
      case 'PropertyCard':
        return (
          <div key={index} className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-200 overflow-hidden">
            {props.image && (
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Building className="h-16 w-16 text-white opacity-75" />
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{props.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{props.location}</span>
                  </div>
                </div>
                {props.price && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {props.price.currency === 'INR' ? '₹' : '$'}{props.price.amount?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">per {props.price.period}</div>
                  </div>
                )}
              </div>
              
              <p className="text-gray-700 mb-4 line-clamp-3">{props.description}</p>
              
              {props.features && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {props.features.area && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Square className="h-4 w-4 mr-2" />
                      <span>{props.features.area} {props.features.unit}</span>
                    </div>
                  )}
                  {props.features.capacity && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{props.features.capacity} seats</span>
                    </div>
                  )}
                </div>
              )}
              
              {props.amenities && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {props.amenities.map((amenity: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View Details
                </button>
                {props.contact && (
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Contact
                  </button>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'StatsList':
      case 'Stats':
        return (
          <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {props.items?.map((stat: any, i: number) => (
              <div key={i} className="bg-white rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                {stat.subtitle && (
                  <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>
                )}
              </div>
            )) || []}
          </div>
        );
        
      case 'PricingTable':
        return (
          <div key={index} className="bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="p-6 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-900">{props.title || 'Pricing Plans'}</h3>
            </div>
            <div className="grid md:grid-cols-3 divide-x">
              {props.plans?.map((plan: any, i: number) => (
                <div key={i} className="p-6">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{plan.name}</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    ₹{plan.price?.toLocaleString()}
                    <span className="text-sm text-gray-600 font-normal">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  {plan.features && (
                    <ul className="text-sm text-gray-700 space-y-2">
                      {plan.features.map((feature: string, j: number) => (
                        <li key={j} className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  {plan.highlight && (
                    <div className="mt-4 px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full inline-block">
                      {plan.highlight}
                    </div>
                  )}
                </div>
              )) || []}
            </div>
          </div>
        );
        
      case 'ContactInfo':
        return (
          <div key={index} className="bg-white rounded-lg border p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              {props.manager && (
                <div>
                  <span className="text-sm text-gray-600">Manager:</span>
                  <span className="ml-2 font-medium">{props.manager}</span>
                </div>
              )}
              {props.phone && (
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{props.phone}</span>
                </div>
              )}
              {props.email && (
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{props.email}</span>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div key={index} className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Unsupported Component: {componentType}</h4>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(props, null, 2)}
            </pre>
          </div>
        );
    }
  };

  // Helper function to render content arrays
  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      return content.map((item, index) => {
        if (typeof item === 'string') {
          return <p key={index} className="mb-2 text-gray-700">{item}</p>;
        }
        return renderUIComponent(item, index);
      });
    }
    return <p className="text-gray-700">{String(content)}</p>;
  };

  // Helper function to get icons for amenities
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="h-3 w-3" />;
    if (amenityLower.includes('parking')) return <Car className="h-3 w-3" />;
    if (amenityLower.includes('cafeteria') || amenityLower.includes('coffee')) return <Coffee className="h-3 w-3" />;
    if (amenityLower.includes('security')) return <Shield className="h-3 w-3" />;
    if (amenityLower.includes('power') || amenityLower.includes('backup')) return <Zap className="h-3 w-3" />;
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header with metadata */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              🤖 C1 AI Generated Property Display
            </h2>
            <p className="text-sm text-gray-600">
              Interactive UI components generated from {sourceUrl ? new URL(sourceUrl).hostname : 'property listing'}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {c1Response.metadata?.confidence && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              Confidence: {Math.round(c1Response.metadata.confidence * 100)}%
            </span>
          )}
          {c1Response.metadata?.extractionMode && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Mode: {c1Response.metadata.extractionMode}
            </span>
          )}
          {c1Response.metadata?.componentType && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
              Type: {c1Response.metadata.componentType}
            </span>
          )}
          {c1Response.metadata?.warnings && c1Response.metadata.warnings.length > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              {c1Response.metadata.warnings.length} Warnings
            </span>
          )}
        </div>
      </div>

      {/* Main content area with actual C1 UI rendering */}
      <div className="p-6 bg-gray-50 min-h-96">
        <div className="space-y-6">
          {processedUISpec.type === 'single-component' ? (
            renderUIComponent(processedUISpec.component)
          ) : processedUISpec.type === 'multi-component' ? (
            processedUISpec.components.map((component: any, index: number) => (
              renderUIComponent(component, index)
            ))
          ) : processedUISpec.type === 'raw-content' ? (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-bold text-gray-900 mb-4">Raw Content Display</h3>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: processedUISpec.content }} />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">🎨</div>
              <p className="text-gray-600">No renderable UI components found in C1 response</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with actions */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex justify-between items-center">
          {/* Property extraction option */}
          <div>
            {c1Response.properties && c1Response.properties.length > 0 && onPropertyExtract && (
              <button
                onClick={handleExtractProperties}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Extract {c1Response.properties.length} Properties
              </button>
            )}
          </div>

          {/* Processing info */}
          <div className="text-xs text-gray-500">
            {c1Response.metadata?.processingTime && (
              <span>Processed in {c1Response.metadata.processingTime}ms</span>
            )}
            {c1Response.metadata?.tokensUsed && (
              <span className="ml-2">• {c1Response.metadata.tokensUsed} tokens</span>
            )}
          </div>
        </div>

        {/* Warnings display */}
        {c1Response.metadata?.warnings && c1Response.metadata.warnings.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">Extraction Warnings:</h4>
            <ul className="text-sm text-yellow-700 list-disc list-inside">
              {c1Response.metadata.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default C1UISpecRenderer;