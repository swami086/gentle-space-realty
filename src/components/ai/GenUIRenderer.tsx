/**
 * GenUIRenderer - Custom UI Renderer Implementation
 * 
 * ⚠️ IMPORTANT: This is a **custom UI renderer** that manually parses and renders UISpec objects.
 * It does NOT use the official `@thesysai/genui-sdk` components.
 * 
 * Purpose:
 * - Custom rendering logic for UISpec objects
 * - Fine-grained control over component styling and behavior
 * - Specialized use cases requiring custom implementation
 * 
 * For Standard Use Cases:
 * - Use the official `C1Component` from `@thesysai/genui-sdk`
 * - See C1RealEstateComponent.tsx for the recommended SDK-based approach
 * - SDK components provide automatic updates, theming, and enhanced functionality
 * 
 * When to Use This Custom Renderer:
 * - You need specific customization not available in the SDK
 * - You require custom styling or behavior beyond SDK capabilities
 * - You're implementing specialized UI patterns not supported by the SDK
 * 
 * Recommendation:
 * Consider using the official C1Component from @thesysai/genui-sdk for standard use cases.
 * This custom renderer should only be used when you need specific customization
 * not available in the SDK.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  BarChart3,
  PieChart,
  Target,
  Star,
  MapPin,
  Building,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Zap,
  Award,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Phone,
  Share2
} from 'lucide-react';
import { UISpec, UIComponent, UIAction, ChartData } from '@/types/thesys';

interface GenUIRendererProps {
  uiSpec: UISpec;
  context?: Record<string, any>;
  onAction?: (action: UIAction) => void;
  className?: string;
}

interface ExpandableSection {
  id: string;
  expanded: boolean;
}

/**
 * Custom renderer component - for SDK-based rendering, see C1RealEstateComponent.tsx
 * This implementation provides custom rendering logic for specialized use cases.
 */
export const GenUIRenderer: React.FC<GenUIRendererProps> = ({
  uiSpec,
  context = {},
  onAction,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<ExpandableSection[]>([]);
  const [interactionFeedback, setInteractionFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize expanded state for collapsible sections
    if (uiSpec.components) {
      const sections = uiSpec.components
        .filter(comp => comp.type === 'section' || comp.type === 'card')
        .map(comp => ({
          id: comp.id,
          expanded: comp.properties?.defaultExpanded !== false
        }));
      setExpandedSections(sections);
    }
  }, [uiSpec]);

  const handleAction = (action: UIAction) => {
    // Handle built-in actions
    switch (action.type) {
      case 'expand':
        toggleSection(action.payload?.sectionId);
        break;
      case 'feedback':
        handleFeedback(action.payload?.componentId, action.payload?.value);
        break;
      default:
        // Pass to parent component
        onAction?.(action);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  const handleFeedback = (componentId: string, value: string) => {
    setInteractionFeedback(prev => ({
      ...prev,
      [componentId]: value
    }));
  };

  const isSectionExpanded = (sectionId: string): boolean => {
    const section = expandedSections.find(s => s.id === sectionId);
    return section?.expanded ?? true;
  };

  const renderIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'lightbulb': <Lightbulb className="h-4 w-4" />,
      'trending-up': <TrendingUp className="h-4 w-4" />,
      'alert-circle': <AlertCircle className="h-4 w-4" />,
      'check-circle': <CheckCircle className="h-4 w-4" />,
      'info': <Info className="h-4 w-4" />,
      'sparkles': <Sparkles className="h-4 w-4" />,
      'bar-chart': <BarChart3 className="h-4 w-4" />,
      'pie-chart': <PieChart className="h-4 w-4" />,
      'target': <Target className="h-4 w-4" />,
      'star': <Star className="h-4 w-4" />,
      'map-pin': <MapPin className="h-4 w-4" />,
      'building': <Building className="h-4 w-4" />,
      'users': <Users className="h-4 w-4" />,
      'dollar-sign': <DollarSign className="h-4 w-4" />,
      'calendar': <Calendar className="h-4 w-4" />,
      'clock': <Clock className="h-4 w-4" />,
      'zap': <Zap className="h-4 w-4" />,
      'award': <Award className="h-4 w-4" />
    };

    return iconName ? iconMap[iconName] : null;
  };

  const renderChart = (chartData: ChartData) => {
    const { type, data, labels } = chartData;

    switch (type) {
      case 'bar':
        return (
          <div className="space-y-2">
            {data.map((value, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-sm text-gray-600">
                  {labels?.[index] || `Item ${index + 1}`}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((value / Math.max(...data)) * 100, 100)}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-right">
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </div>
              </div>
            ))}
          </div>
        );

      case 'progress':
        const progressValue = Array.isArray(data) ? data[0] : data;
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        );

      case 'metric':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.map((value, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </div>
                <div className="text-xs text-gray-500">
                  {labels?.[index] || `Metric ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-gray-500">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  const renderComponent = (component: UIComponent): React.ReactNode => {
    const { type, properties, children, id } = component;
    const key = id || `${type}-${Math.random()}`;

    switch (type) {
      case 'text':
        return (
          <span 
            key={key}
            className={`${properties?.className || ''} ${properties?.variant === 'bold' ? 'font-semibold' : ''}`}
            style={{ color: properties?.color }}
          >
            {properties?.content}
          </span>
        );

      case 'heading':
        const HeadingTag = `h${properties?.level || 3}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            key={key}
            className={`font-semibold text-gray-900 ${properties?.className || ''}`}
          >
            {renderIcon(properties?.icon)}
            {properties?.content}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p key={key} className={`text-gray-700 ${properties?.className || ''}`}>
            {properties?.content}
          </p>
        );

      case 'list':
        const items = properties?.items || [];
        const ListTag = properties?.ordered ? 'ol' : 'ul';
        return (
          <ListTag key={key} className={`space-y-1 ${properties?.className || ''}`}>
            {items.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                {properties?.ordered ? (
                  <span className="text-sm text-gray-500">{index + 1}.</span>
                ) : (
                  <span className="text-blue-500 mt-1">•</span>
                )}
                <span>{item}</span>
              </li>
            ))}
          </ListTag>
        );

      case 'alert':
        const alertVariants = {
          info: 'border-blue-200 bg-blue-50 text-blue-800',
          warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          error: 'border-red-200 bg-red-50 text-red-800',
          success: 'border-green-200 bg-green-50 text-green-800'
        };
        
        return (
          <Alert key={key} className={`border ${alertVariants[properties?.variant as keyof typeof alertVariants] || alertVariants.info}`}>
            {renderIcon(properties?.icon)}
            <AlertDescription>
              {properties?.content}
            </AlertDescription>
          </Alert>
        );

      case 'card':
        const isExpanded = isSectionExpanded(id);
        return (
          <Card key={key} className={`${properties?.className || ''}`}>
            {properties?.title && (
              <div 
                className="flex items-center justify-between p-4 border-b cursor-pointer"
                onClick={() => properties?.collapsible && handleAction({
                  type: 'expand',
                  payload: { sectionId: id }
                })}
              >
                <div className="flex items-center gap-2">
                  {renderIcon(properties?.icon)}
                  <h3 className="font-medium">{properties.title}</h3>
                </div>
                {properties?.collapsible && (
                  isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </div>
            )}
            {(!properties?.collapsible || isExpanded) && (
              <div className="p-4">
                {properties?.content && <p className="text-gray-700 mb-4">{properties.content}</p>}
                {children && (
                  <div className="space-y-3">
                    {children.map((child, index) => renderComponent({...child, id: child.id || `${id}-child-${index}`}))}
                  </div>
                )}
              </div>
            )}
          </Card>
        );

      case 'section':
        const sectionExpanded = isSectionExpanded(id);
        return (
          <div key={key} className={`space-y-4 ${properties?.className || ''}`}>
            {properties?.title && (
              <div 
                className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
                onClick={() => handleAction({
                  type: 'expand',
                  payload: { sectionId: id }
                })}
              >
                <div className="flex items-center gap-2">
                  {renderIcon(properties?.icon)}
                  <h3 className="text-lg font-medium">{properties.title}</h3>
                </div>
                {sectionExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            )}
            {sectionExpanded && children && (
              <div className="space-y-3 ml-6">
                {children.map((child, index) => renderComponent({...child, id: child.id || `${id}-section-${index}`}))}
              </div>
            )}
          </div>
        );

      case 'grid':
        const cols = properties?.columns || 2;
        return (
          <div key={key} className={`grid grid-cols-1 md:grid-cols-${cols} gap-4 ${properties?.className || ''}`}>
            {children?.map((child, index) => renderComponent({...child, id: child.id || `${id}-grid-${index}`}))}
          </div>
        );

      case 'badge':
        const badgeVariants = {
          default: 'bg-blue-100 text-blue-800',
          secondary: 'bg-gray-100 text-gray-800',
          success: 'bg-green-100 text-green-800',
          warning: 'bg-yellow-100 text-yellow-800',
          danger: 'bg-red-100 text-red-800'
        };
        
        return (
          <Badge 
            key={key}
            className={`${badgeVariants[properties?.variant as keyof typeof badgeVariants] || badgeVariants.default} ${properties?.className || ''}`}
          >
            {renderIcon(properties?.icon)}
            {properties?.content}
          </Badge>
        );

      case 'progress':
        return (
          <div key={key} className={`space-y-2 ${properties?.className || ''}`}>
            {properties?.label && (
              <div className="flex justify-between text-sm">
                <span>{properties.label}</span>
                <span>{properties?.value}%</span>
              </div>
            )}
            <Progress value={properties?.value || 0} className="h-2" />
          </div>
        );

      case 'chart':
        return (
          <div key={key} className={`${properties?.className || ''}`}>
            {properties?.title && <h4 className="font-medium mb-3">{properties.title}</h4>}
            {properties?.chartData && renderChart(properties.chartData)}
          </div>
        );

      case 'button':
        return (
          <Button
            key={key}
            onClick={() => properties?.action && handleAction(properties.action)}
            variant={properties?.variant as any || 'default'}
            size={properties?.size as any || 'default'}
            className={properties?.className || ''}
          >
            {renderIcon(properties?.icon)}
            {properties?.content}
          </Button>
        );

      case 'metric':
        return (
          <div key={key} className={`text-center p-4 ${properties?.className || ''}`}>
            <div className={`text-3xl font-bold ${properties?.color ? `text-${properties.color}-600` : 'text-gray-900'}`}>
              {properties?.value}
            </div>
            {properties?.label && (
              <div className="text-sm text-gray-500 mt-1">
                {properties.label}
              </div>
            )}
            {properties?.change && (
              <div className={`text-xs mt-1 ${properties.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {properties.change > 0 ? '↑' : '↓'} {Math.abs(properties.change)}%
              </div>
            )}
          </div>
        );

      case 'feedback':
        const currentFeedback = interactionFeedback[id];
        return (
          <div key={key} className={`flex items-center gap-2 ${properties?.className || ''}`}>
            <span className="text-sm text-gray-600">{properties?.question || 'Was this helpful?'}</span>
            <Button
              size="sm"
              variant={currentFeedback === 'positive' ? 'default' : 'ghost'}
              onClick={() => handleAction({
                type: 'feedback',
                payload: { componentId: id, value: 'positive' }
              })}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant={currentFeedback === 'negative' ? 'default' : 'ghost'}
              onClick={() => handleAction({
                type: 'feedback',
                payload: { componentId: id, value: 'negative' }
              })}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        );

      case 'insight':
        const insightIcons = {
          tip: <Lightbulb className="h-4 w-4 text-yellow-500" />,
          warning: <AlertCircle className="h-4 w-4 text-orange-500" />,
          info: <Info className="h-4 w-4 text-blue-500" />,
          success: <CheckCircle className="h-4 w-4 text-green-500" />
        };

        return (
          <div key={key} className={`flex items-start gap-3 p-3 rounded-lg bg-gray-50 ${properties?.className || ''}`}>
            {insightIcons[properties?.type as keyof typeof insightIcons] || insightIcons.info}
            <div className="flex-1">
              {properties?.title && (
                <div className="font-medium text-sm mb-1">{properties.title}</div>
              )}
              <div className="text-sm text-gray-700">{properties?.content}</div>
            </div>
          </div>
        );

      case 'recommendation':
        return (
          <Card key={key} className={`p-4 border-l-4 border-l-blue-500 ${properties?.className || ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Recommendation</span>
                  {properties?.confidence && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(properties.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700">{properties?.content}</p>
                {properties?.reasons && (
                  <ul className="mt-2 space-y-1">
                    {properties.reasons.map((reason: string, index: number) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {properties?.actions && (
                <div className="flex gap-2">
                  {properties.actions.map((action: UIAction, index: number) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );

      case 'comparison':
        const comparisonItems = properties?.items || [];
        return (
          <div key={key} className={`space-y-3 ${properties?.className || ''}`}>
            {properties?.title && <h4 className="font-medium">{properties.title}</h4>}
            {comparisonItems.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium">{item.value}</div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500">{item.subtitle}</div>
                    )}
                  </div>
                  {item.trend && (
                    <div className={`text-xs ${item.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.trend > 0 ? '↑' : '↓'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        console.warn(`Unsupported UI component type: ${type}`);
        return (
          <div key={key} className="p-2 border border-dashed border-gray-300 rounded text-center text-gray-500">
            Unsupported component: {type}
          </div>
        );
    }
  };

  if (!uiSpec || !uiSpec.components) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No UI specification provided</p>
      </div>
    );
  }

  return (
    <div className={`ai-generated-ui space-y-4 ${className}`}>
      {uiSpec.title && (
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900">{uiSpec.title}</h2>
        </div>
      )}
      
      {uiSpec.description && (
        <p className="text-gray-600 mb-4">{uiSpec.description}</p>
      )}
      
      <div className="space-y-4">
        {uiSpec.components.map((component, index) => 
          renderComponent({
            ...component,
            id: component.id || `root-${index}`
          })
        )}
      </div>
      
      {/* Attribution */}
      <div className="flex items-center justify-center pt-4 border-t border-gray-100 mt-6">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Zap className="h-3 w-3" />
          <span>AI-generated content by Thesys C1</span>
        </div>
      </div>
    </div>
  );
};