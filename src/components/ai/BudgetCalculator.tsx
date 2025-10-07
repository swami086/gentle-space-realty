import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Info,
  Download,
  Share2,
  Sparkles,
  Building,
  Users,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Property } from '@/types/property';
import { Calculation, CalculationResult } from '@/types/thesys';
import { useAIStore } from '@/store/aiStore';
import { useThesysC1 } from '@/hooks/useThesysC1';
import { GenUIRenderer } from './GenUIRenderer';

interface BudgetCalculatorProps {
  properties?: Property[];
  onCalculationComplete?: (calculation: Calculation) => void;
  className?: string;
}

interface BudgetInputs {
  propertyType: 'office' | 'co-working' | 'meeting-room';
  teamSize: number;
  duration: number; // in months
  location: string;
  workingDays: number; // per month
  additionalServices: string[];
  budgetRange: [number, number]; // min, max per month in INR
}

interface CostBreakdown {
  baseRent: number;
  securityDeposit: number;
  maintenanceFee: number;
  utilities: number;
  amenityCharges: number;
  gst: number;
  total: number;
}

interface ROIProjection {
  period: string;
  cost: number;
  savings: number;
  efficiency: number;
  netBenefit: number;
}

export const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({
  properties = [],
  onCalculationComplete,
  className = ''
}) => {
  const [inputs, setInputs] = useState<BudgetInputs>({
    propertyType: 'office',
    teamSize: 10,
    duration: 12,
    location: 'koramangala',
    workingDays: 22,
    additionalServices: [],
    budgetRange: [50000, 150000]
  });

  const [activeTab, setActiveTab] = useState('calculator');
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [currentCalculation, setCurrentCalculation] = useState<Calculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<string[]>([]);

  const { savedCalculations, addCalculation } = useAIStore();
  const {
    uiSpec,
    loading: aiLoading,
    error: aiError,
    generateUI
  } = useThesysC1();

  useEffect(() => {
    if (savedCalculations.length > 0) {
      setCalculations(savedCalculations);
    }
  }, [savedCalculations]);

  useEffect(() => {
    if (currentCalculation) {
      generateAIInsights();
    }
  }, [currentCalculation?.id]); // Only depend on calculation ID to prevent infinite loops

  const calculateBudget = async () => {
    setLoading(true);
    
    try {
      // Calculate base costs
      const breakdown = calculateCostBreakdown();
      const projections = calculateROIProjections(breakdown);
      const insights = generateBudgetInsights(breakdown, projections);

      const result: CalculationResult = {
        totalCost: breakdown.total,
        breakdown: {
          'Base Rent': breakdown.baseRent,
          'Security Deposit': breakdown.securityDeposit,
          'Maintenance': breakdown.maintenanceFee,
          'Utilities': breakdown.utilities,
          'Amenities': breakdown.amenityCharges,
          'GST (18%)': breakdown.gst
        },
        projections: projections.reduce((acc, proj) => ({
          ...acc,
          [proj.period]: proj.cost
        }), {}),
        insights
      };

      const calculation: Calculation = {
        id: Date.now().toString(),
        type: 'budget',
        parameters: { ...inputs },
        results: result,
        timestamp: new Date()
      };

      setCurrentCalculation(calculation);
      addCalculation(calculation);
      onCalculationComplete?.(calculation);

    } catch (error) {
      console.error('Budget calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCostBreakdown = (): CostBreakdown => {
    // Base rent calculation (mock pricing based on location and type)
    const locationMultiplier = {
      'koramangala': 1.3,
      'indiranagar': 1.2,
      'whitefield': 1.0,
      'hsr-layout': 1.1,
      'electronic-city': 0.9
    }[inputs.location] || 1.0;

    const typeMultiplier = {
      'office': 1.2,
      'co-working': 0.8,
      'meeting-room': 1.5
    }[inputs.propertyType];

    const baseRatePerSeat = 8000; // INR per seat per month
    const baseRent = Math.round(inputs.teamSize * baseRatePerSeat * locationMultiplier * typeMultiplier);
    
    // Other cost components
    const securityDeposit = baseRent * 3; // 3 months rent as deposit
    const maintenanceFee = Math.round(baseRent * 0.15); // 15% of rent
    const utilities = Math.round(inputs.teamSize * 500); // ₹500 per person
    const amenityCharges = Math.round(inputs.teamSize * 1200); // ₹1200 per person for amenities
    
    const subtotal = baseRent + maintenanceFee + utilities + amenityCharges;
    const gst = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + gst;

    return {
      baseRent,
      securityDeposit,
      maintenanceFee,
      utilities,
      amenityCharges,
      gst,
      total
    };
  };

  const calculateROIProjections = (breakdown: CostBreakdown): ROIProjection[] => {
    const monthlyOperationalCost = breakdown.total;
    const periods = ['6 months', '1 year', '2 years', '3 years'];

    return periods.map(period => {
      const months = period === '6 months' ? 6 : 
                   period === '1 year' ? 12 :
                   period === '2 years' ? 24 : 36;

      const totalCost = monthlyOperationalCost * months + breakdown.securityDeposit;
      
      // Mock efficiency and savings calculations
      const efficiencyGain = Math.min(months * 0.5, 15); // Up to 15% efficiency gain
      const potentialSavings = totalCost * 0.1 * (efficiencyGain / 15); // Savings based on efficiency
      const netBenefit = potentialSavings - (totalCost * 0.05); // Subtract opportunity cost

      return {
        period,
        cost: totalCost,
        savings: Math.round(potentialSavings),
        efficiency: Math.round(efficiencyGain * 10) / 10,
        netBenefit: Math.round(netBenefit)
      };
    });
  };

  const generateBudgetInsights = (breakdown: CostBreakdown, projections: ROIProjection[]): string[] => {
    const insights: string[] = [];

    // Cost analysis insights
    if (breakdown.baseRent > inputs.budgetRange[1] * 0.7) {
      insights.push('Base rent is high relative to your budget. Consider co-working spaces or smaller locations.');
    } else if (breakdown.baseRent < inputs.budgetRange[0] * 0.5) {
      insights.push('You have budget flexibility. Consider premium locations or larger spaces.');
    }

    // Location insights
    if (inputs.location === 'koramangala' || inputs.location === 'indiranagar') {
      insights.push('Prime location with excellent connectivity but higher costs.');
    } else {
      insights.push('Cost-effective location with good potential for savings.');
    }

    // Team size insights
    if (inputs.teamSize > 20) {
      insights.push('Large team size qualifies for bulk discounts and better negotiation power.');
    } else if (inputs.teamSize < 5) {
      insights.push('Small team size makes co-working spaces more cost-effective.');
    }

    // Duration insights
    if (inputs.duration >= 24) {
      insights.push('Long-term commitment can secure better rates and reduced deposits.');
    } else if (inputs.duration < 6) {
      insights.push('Short-term commitment may have higher per-month costs but more flexibility.');
    }

    return insights;
  };

  const generateAIInsights = async () => {
    if (!currentCalculation) return;

    try {
      await generateUI(
        `Generate interactive budget calculator with cost breakdowns and ROI analysis`,
        {
          propertyType: inputs.propertyType,
          teamSize: inputs.teamSize,
          duration: inputs.duration,
          location: inputs.location,
          calculation: currentCalculation
        }
      );
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    }
  };

  const compareScenarios = () => {
    const scenarios = [
      { ...inputs, propertyType: 'office' as const, name: 'Private Office' },
      { ...inputs, propertyType: 'co-working' as const, name: 'Co-working Space' },
      { ...inputs, teamSize: Math.ceil(inputs.teamSize * 0.7), name: 'Optimized Team Size' }
    ];

    const comparisons = scenarios.map(scenario => {
      const originalInputs = { ...inputs };
      setInputs(scenario);
      const breakdown = calculateCostBreakdown();
      setInputs(originalInputs);
      
      return {
        ...scenario,
        monthlyCost: breakdown.total,
        yearlyTotal: breakdown.total * 12 + breakdown.securityDeposit
      };
    });

    return comparisons;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputChange = (field: keyof BudgetInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const exportCalculation = () => {
    if (!currentCalculation) return;
    
    const data = {
      inputs,
      calculation: currentCalculation,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-calculation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <Card className={`w-full bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-green-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Smart Budget Calculator
            </h2>
            <p className="text-sm text-gray-600">
              Plan your office space investment with AI-powered insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {currentCalculation && (
            <>
              <Button variant="outline" size="sm" onClick={exportCalculation}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 p-6 pb-0">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="projections">ROI Projections</TabsTrigger>
          <TabsTrigger value="compare">Compare Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="p-6 space-y-6">
          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Type */}
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={inputs.propertyType}
                onValueChange={(value: any) => handleInputChange('propertyType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Private Office
                    </div>
                  </SelectItem>
                  <SelectItem value="co-working">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Co-working Space
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting-room">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Meeting Rooms
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Preferred Location</Label>
              <Select
                value={inputs.location}
                onValueChange={(value) => handleInputChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="koramangala">Koramangala (Premium)</SelectItem>
                  <SelectItem value="indiranagar">Indiranagar (Prime)</SelectItem>
                  <SelectItem value="whitefield">Whitefield (Tech Hub)</SelectItem>
                  <SelectItem value="hsr-layout">HSR Layout (Growing)</SelectItem>
                  <SelectItem value="electronic-city">Electronic City (Budget)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Team Size</Label>
                <span className="text-sm font-medium">{inputs.teamSize} people</span>
              </div>
              <Slider
                value={[inputs.teamSize]}
                onValueChange={(value) => handleInputChange('teamSize', value[0])}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>100</span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lease Duration</Label>
                <span className="text-sm font-medium">{inputs.duration} months</span>
              </div>
              <Slider
                value={[inputs.duration]}
                onValueChange={(value) => handleInputChange('duration', value[0])}
                min={1}
                max={60}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 month</span>
                <span>5 years</span>
              </div>
            </div>

            {/* Working Days */}
            <div className="space-y-2">
              <Label>Working Days per Month</Label>
              <Input
                type="number"
                value={inputs.workingDays}
                onChange={(e) => handleInputChange('workingDays', parseInt(e.target.value))}
                min={1}
                max={31}
              />
            </div>

            {/* Budget Range */}
            <div className="space-y-3">
              <Label>Budget Range (per month)</Label>
              <div className="px-3">
                <Slider
                  value={inputs.budgetRange}
                  onValueChange={(value) => handleInputChange('budgetRange', value as [number, number])}
                  min={10000}
                  max={500000}
                  step={5000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm mt-2">
                  <span>{formatCurrency(inputs.budgetRange[0])}</span>
                  <span>{formatCurrency(inputs.budgetRange[1])}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={calculateBudget}
              disabled={loading}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white px-8"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Calculate Budget
            </Button>
          </div>

          {/* AI-Generated Calculator Insights */}
          {uiSpec && (
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium">AI Budget Analysis</h3>
              </div>
              <GenUIRenderer
                uiSpec={uiSpec}
                context={{
                  propertyType: inputs.propertyType,
                  teamSize: inputs.teamSize,
                  duration: inputs.duration,
                  location: inputs.location
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="p-6">
          {currentCalculation ? (
            <div className="space-y-6">
              {/* Cost Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Monthly Total</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(currentCalculation.results.totalCost)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Annual Total</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(currentCalculation.results.totalCost * 12)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">Cost per Person</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(Math.round(currentCalculation.results.totalCost / inputs.teamSize))}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              {/* Detailed Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Cost Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(currentCalculation.results.breakdown).map(([category, amount]) => {
                    const percentage = (amount / currentCalculation.results.totalCost) * 100;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{category}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Insights */}
              {currentCalculation.results.insights && (
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Budget Insights
                  </h3>
                  <div className="space-y-3">
                    {currentCalculation.results.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Run a budget calculation to see the detailed breakdown</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projections" className="p-6">
          {currentCalculation ? (
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Long-term Cost Projections
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(currentCalculation.results.projections).map(([period, cost]) => (
                  <Card key={period} className="p-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">{period}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(cost)}
                    </p>
                    <div className="flex items-center justify-center mt-2 text-xs">
                      {cost > currentCalculation.results.totalCost * 12 ? (
                        <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                      ) : cost < currentCalculation.results.totalCost * 12 ? (
                        <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-400 mr-1" />
                      )}
                      <span className={
                        cost > currentCalculation.results.totalCost * 12 ? 'text-red-600' :
                        cost < currentCalculation.results.totalCost * 12 ? 'text-green-600' :
                        'text-gray-600'
                      }>
                        vs monthly rate
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Run a budget calculation to see cost projections</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare" className="p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Scenario Comparison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compareScenarios().map((scenario, index) => (
                <Card key={index} className="p-4">
                  <h4 className="font-medium mb-3">{scenario.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Team Size:</span>
                      <span>{scenario.teamSize} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{scenario.propertyType.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>Monthly:</span>
                      <span className="font-medium">{formatCurrency(scenario.monthlyCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yearly Total:</span>
                      <span className="font-medium">{formatCurrency(scenario.yearlyTotal)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};