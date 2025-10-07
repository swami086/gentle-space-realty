/**
 * C1PropertyReview Component
 * 
 * Interactive review interface for C1-extracted properties using genUI SDK.
 * Provides user-friendly interface for reviewing, editing, and approving
 * properties extracted by C1 before importing to the database.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { C1Component, ThemeProvider } from '@thesysai/genui-sdk';
import { ScrapedPropertyData, SearchParameters } from '../../types/scraper';
import { C1TransformMetadata, C1TransformService } from '../../services/c1TransformService';

// Component props interface
interface C1PropertyReviewProps {
  extractedProperties: ScrapedPropertyData[];
  rawFirecrawlData: any;
  transformMetadata: C1TransformMetadata;
  onApprove: (approvedProperties: ScrapedPropertyData[]) => void;
  onReject: () => void;
  onEdit: (propertyIndex: number, updatedProperty: ScrapedPropertyData) => void;
  onClose: () => void;
}

// Internal state for property editing
interface PropertyEditState {
  [index: number]: {
    isEditing: boolean;
    editedProperty: ScrapedPropertyData;
    validationErrors: string[];
  };
}

export const C1PropertyReview: React.FC<C1PropertyReviewProps> = ({
  extractedProperties,
  rawFirecrawlData,
  transformMetadata,
  onApprove,
  onReject,
  onEdit,
  onClose
}) => {
  const [selectedProperties, setSelectedProperties] = useState<Set<number>>(
    new Set(Array.from({ length: extractedProperties.length }, (_, i) => i))
  );
  const [editStates, setEditStates] = useState<PropertyEditState>({});
  const [showRawData, setShowRawData] = useState(false);
  const [aiAssistanceActive, setAiAssistanceActive] = useState(false);
  const [expandedProperty, setExpandedProperty] = useState<number | null>(null);

  const c1Service = useMemo(() => new C1TransformService(), []);

  // Handle property selection toggle
  const handlePropertyToggle = useCallback((index: number) => {
    setSelectedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Handle select all / deselect all
  const handleSelectAll = useCallback(() => {
    setSelectedProperties(new Set(Array.from({ length: extractedProperties.length }, (_, i) => i)));
  }, [extractedProperties.length]);

  const handleDeselectAll = useCallback(() => {
    setSelectedProperties(new Set());
  }, []);

  // Handle property editing
  const handleStartEditing = useCallback((index: number) => {
    setEditStates(prev => ({
      ...prev,
      [index]: {
        isEditing: true,
        editedProperty: { ...extractedProperties[index] },
        validationErrors: []
      }
    }));
    setExpandedProperty(index);
  }, [extractedProperties]);

  const handleSaveEdit = useCallback((index: number) => {
    const editState = editStates[index];
    if (!editState) return;

    // Validate the edited property
    try {
      const validatedProperties = c1Service.validateTransformedProperties([editState.editedProperty]);
      if (validatedProperties.length === 0) {
        throw new Error('Property validation failed');
      }

      // Update the property
      onEdit(index, editState.editedProperty);
      
      // Clear edit state
      setEditStates(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    } catch (error) {
      // Update validation errors
      setEditStates(prev => ({
        ...prev,
        [index]: {
          ...editState,
          validationErrors: [error instanceof Error ? error.message : 'Validation failed']
        }
      }));
    }
  }, [editStates, onEdit, c1Service]);

  const handleCancelEdit = useCallback((index: number) => {
    setEditStates(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  }, []);

  // Update edited property field
  const handleFieldChange = useCallback((index: number, field: string, value: any) => {
    setEditStates(prev => {
      const editState = prev[index];
      if (!editState) return prev;

      return {
        ...prev,
        [index]: {
          ...editState,
          editedProperty: {
            ...editState.editedProperty,
            [field]: value
          },
          validationErrors: [] // Clear errors on change
        }
      };
    });
  }, []);

  // Handle approval of selected properties
  const handleApproveSelected = useCallback(() => {
    const approvedProperties = Array.from(selectedProperties)
      .map(index => {
        const editState = editStates[index];
        return editState?.editedProperty || extractedProperties[index];
      })
      .filter(Boolean);
    
    onApprove(approvedProperties);
  }, [selectedProperties, editStates, extractedProperties, onApprove]);

  // Get confidence level and color for a property
  const getPropertyConfidence = useCallback((index: number) => {
    const score = transformMetadata.confidenceScores?.[index.toString()] || 0.5;
    return {
      score,
      level: c1Service.getConfidenceLevel(score),
      color: c1Service.getConfidenceColor(score)
    };
  }, [transformMetadata.confidenceScores, c1Service]);

  // AI assistance for property improvement
  const handleAiAssistance = useCallback(async (propertyIndex: number, action: string) => {
    setAiAssistanceActive(true);
    try {
      // This would call C1 for assistance - simplified for now
      console.log(`AI assistance requested for property ${propertyIndex}: ${action}`);
      // TODO: Implement actual AI assistance calls
    } catch (error) {
      console.error('AI assistance failed:', error);
    } finally {
      setAiAssistanceActive(false);
    }
  }, []);

  // Render property card using genUI
  const renderPropertyCard = useCallback((property: ScrapedPropertyData, index: number) => {
    const confidence = getPropertyConfidence(index);
    const editState = editStates[index];
    const isEditing = editState?.isEditing || false;
    const isSelected = selectedProperties.has(index);
    const displayProperty = editState?.editedProperty || property;

    return (
      <div
        key={index}
        className={`border rounded-lg p-4 mb-4 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${isEditing ? 'ring-2 ring-blue-400' : ''}`}
      >
        {/* Property header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handlePropertyToggle(index)}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <h3 className="font-semibold text-lg">{displayProperty.title}</h3>
              <p className="text-sm text-gray-600">{displayProperty.location}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className="px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: confidence.color }}
            >
              {confidence.level} ({Math.round(confidence.score * 100)}%)
            </span>
            <button
              onClick={() => setExpandedProperty(expandedProperty === index ? null : index)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {expandedProperty === index ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Property details (when expanded) */}
        {expandedProperty === index && (
          <div className="mt-4 space-y-4">
            {/* Use C1Component for dynamic rendering */}
            <ThemeProvider>
              <C1Component
                apiEndpoint="/api/v1/c1/generate"
                prompt={`Create an interactive property review form for: ${JSON.stringify(displayProperty)}`}
                context={{
                  property: displayProperty,
                  isEditing,
                  validationErrors: editState?.validationErrors || []
                }}
                onResponse={(response) => {
                  // Handle form updates from genUI
                  if (response.updatedProperty && isEditing) {
                    setEditStates(prev => ({
                      ...prev,
                      [index]: {
                        ...prev[index]!,
                        editedProperty: response.updatedProperty
                      }
                    }));
                  }
                }}
              />
            </ThemeProvider>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => handleStartEditing(index)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAiAssistance(index, 'improve-description')}
                      disabled={aiAssistanceActive}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {aiAssistanceActive ? 'Processing...' : 'AI Improve'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleCancelEdit(index)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>

              {/* Validation errors */}
              {editState?.validationErrors && editState.validationErrors.length > 0 && (
                <div className="text-red-600 text-sm">
                  {editState.validationErrors.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [
    editStates,
    selectedProperties,
    expandedProperty,
    aiAssistanceActive,
    getPropertyConfidence,
    handlePropertyToggle,
    handleStartEditing,
    handleSaveEdit,
    handleCancelEdit,
    handleAiAssistance
  ]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                C1 Property Review
              </h2>
              <p className="text-gray-600">
                {c1Service.formatTransformationSummary({
                  success: true,
                  properties: extractedProperties,
                  metadata: transformMetadata
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Summary stats */}
          <div className="flex space-x-4 mt-4">
            <div className="bg-blue-100 px-3 py-2 rounded">
              <span className="text-blue-800 font-medium">
                {transformMetadata.propertiesExtracted} Properties
              </span>
            </div>
            <div className="bg-green-100 px-3 py-2 rounded">
              <span className="text-green-800 font-medium">
                {selectedProperties.size} Selected
              </span>
            </div>
            {transformMetadata.warnings.length > 0 && (
              <div className="bg-yellow-100 px-3 py-2 rounded">
                <span className="text-yellow-800 font-medium">
                  {transformMetadata.warnings.length} Warnings
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Bulk actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Deselect All
                </button>
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  {showRawData ? 'Hide' : 'Show'} Raw Data
                </button>
              </div>
            </div>

            {/* Property cards */}
            <div className="space-y-4">
              {extractedProperties.map((property, index) => 
                renderPropertyCard(property, index)
              )}
            </div>
          </div>

          {/* Raw data panel */}
          {showRawData && (
            <div className="w-1/3 border-l bg-gray-50 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Raw Firecrawl Data</h3>
              <pre className="text-xs bg-white p-4 rounded border overflow-auto">
                {typeof rawFirecrawlData === 'string' 
                  ? rawFirecrawlData 
                  : JSON.stringify(rawFirecrawlData, null, 2)
                }
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {transformMetadata.warnings.length > 0 && (
                <div className="text-yellow-700 text-sm">
                  ⚠️ {transformMetadata.warnings.length} warnings - review carefully
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onReject}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject All
              </button>
              <button
                onClick={handleApproveSelected}
                disabled={selectedProperties.size === 0}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Import Selected ({selectedProperties.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};