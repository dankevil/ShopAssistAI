import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, MessageSquare, BarChart3, ExternalLink, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
  
interface TopTopic {
  name: string;
  percentage: number;
  change?: number;
}

interface AccuracyMetric {
  name: string;
  percentage: number;
  color?: string;
}

interface AiPerformanceProps {
  topTopics?: TopTopic[];
  accuracyMetrics?: AccuracyMetric[];
  isLoading?: boolean;
}

// Helper function to get color class based on percentage
const getColorClass = (percentage: number): string => {
  if (percentage >= 95) return 'bg-green-500';
  if (percentage >= 85) return 'bg-emerald-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 65) return 'bg-amber-500';
  return 'bg-orange-500';
};

export function AiPerformance({
  topTopics = [
    { name: 'Order status inquiries', percentage: 32, change: 5 },
    { name: 'Product availability', percentage: 24, change: -2 },
    { name: 'Return policy', percentage: 18, change: 0 },
    { name: 'Shipping information', percentage: 15, change: 3 },
    { name: 'Product recommendations', percentage: 11, change: 1 },
  ],
  accuracyMetrics = [
    { name: 'Overall', percentage: 92, color: 'bg-primary-500' },
    { name: 'Order Information', percentage: 96, color: 'bg-green-500' },
    { name: 'Product Information', percentage: 94, color: 'bg-blue-500' },
    { name: 'Policy Questions', percentage: 88, color: 'bg-amber-500' },
  ],
  isLoading = false
}: AiPerformanceProps) {
  return (
    <Card className="shadow-sm border-gray-100 overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-6 flex flex-row items-center justify-between bg-gradient-to-br from-violet-50 to-indigo-50 border-b border-indigo-100/60">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg text-white shadow-sm">
            <Brain className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">AI Performance</CardTitle>
        </div>
        <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-700 font-medium">
          <Zap className="h-3.5 w-3.5 mr-1 text-amber-500" />
          GPT-4o
        </Badge>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* AI Stats Summary */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Avg. Response Time</p>
            <p className="text-2xl font-bold text-gray-900">1.2s</p>
            <div className="flex items-center text-green-600 text-xs font-medium mt-1">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              <span>18% faster</span>
            </div>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900">96.4%</p>
            <div className="flex items-center text-green-600 text-xs font-medium mt-1">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              <span>2.1% better</span>
            </div>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Conversations</p>
            <p className="text-2xl font-bold text-gray-900">3,428</p>
            <div className="flex items-center text-gray-500 text-xs font-medium mt-1">
              <MessageSquare className="h-3 w-3 mr-0.5" />
              <span>This month</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Top AI Topics */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-4 w-4 mr-1.5 text-indigo-500" />
                Top Conversation Topics
              </h4>
              <Button variant="link" size="sm" className="h-7 px-0 text-xs text-indigo-600">
                View report
              </Button>
            </div>
            
            <ul className="space-y-4">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <li key={i} className="animate-pulse">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 bg-gray-200 h-4 w-40 rounded"></span>
                      <span className="text-sm font-medium text-gray-900 bg-gray-200 h-4 w-10 rounded"></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-300 h-2 rounded-full"></div>
                    </div>
                  </li>
                ))
              ) : (
                topTopics.map((topic, index) => (
                  <li key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{topic.name}</span>
                      <div className="flex items-center">
                        {topic.change !== undefined && topic.change !== 0 && (
                          <Badge variant="outline" className={cn(
                            "mr-2 py-0 px-1.5 h-5 text-[10px] font-medium",
                            topic.change > 0 
                              ? "bg-green-50 text-green-700 border-green-100" 
                              : "bg-red-50 text-red-700 border-red-100"
                          )}>
                            {topic.change > 0 ? '+' : ''}{topic.change}%
                          </Badge>
                        )}
                        <span className="text-sm font-semibold text-gray-900">{topic.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`${getColorClass(60 + index * 10)} h-2 rounded-full`} 
                        style={{ width: `${topic.percentage}%` }}
                      ></div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          
          {/* Response Accuracy */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <Zap className="h-4 w-4 mr-1.5 text-amber-500" />
                Response Accuracy
              </h4>
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Full analytics
              </Button>
            </div>
            
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-5 border border-gray-100">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="mb-4 last:mb-0 animate-pulse">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium bg-gray-200 h-4 w-32 rounded"></span>
                      <span className="text-sm font-medium bg-gray-200 h-4 w-10 rounded"></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-gray-300 h-2.5 rounded-full"></div>
                    </div>
                  </div>
                ))
              ) : (
                accuracyMetrics.map((metric, index) => (
                  <div key={index} className={index > 0 ? 'mt-4' : ''}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                      <div className="flex items-center bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        <span className={cn(
                          "text-sm font-bold",
                          metric.percentage >= 95 ? "text-green-600" :
                          metric.percentage >= 85 ? "text-emerald-600" :
                          metric.percentage >= 75 ? "text-blue-600" :
                          metric.percentage >= 65 ? "text-amber-600" : "text-orange-600"
                        )}>{metric.percentage}%</span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={metric.percentage} 
                        className={`h-2 bg-gray-100 [&>div]:${metric.color || getColorClass(metric.percentage)}`}
                      />
                      {/* Benchmark line */}
                      {index === 0 && (
                        <div className="absolute top-0 bottom-0 border-r-2 border-dashed border-indigo-400" style={{ left: '90%' }}>
                          <span className="absolute -top-7 -right-6 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Target
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
