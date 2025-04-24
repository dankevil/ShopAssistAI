import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink,
  Users,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: {
    value: number;
    timeFrame: string;
  };
  linkText?: string;
  linkHref?: string;
  iconColor?: string;
  iconBgColor?: string;
  gradient?: string;
}

function StatCard({
  icon,
  title,
  value,
  change,
  linkText,
  linkHref,
  iconColor = 'text-primary-600',
  iconBgColor = 'bg-primary-100',
  gradient
}: StatCardProps) {
  const isPositiveChange = change && change.value > 0;
  const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600';
  const ChangeIcon = isPositiveChange ? ArrowUpRight : ArrowDownRight;
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-md",
      gradient && "relative"
    )}>
      {gradient && (
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: gradient }} />
      )}
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-full p-3`}>
            <div className={`h-6 w-6 ${iconColor}`}>{icon}</div>
          </div>
          {change && (
            <div className={`flex items-center ${changeColor} text-xs font-medium`}>
              <ChangeIcon className="h-3 w-3 mr-0.5" />
              {Math.abs(change.value)}%
              <span className="text-gray-500 ml-1">vs {change.timeFrame}</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
      {linkText && linkHref && (
        <CardFooter className="pt-0 pb-4">
          <a
            href={linkHref}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            {linkText}
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
        </CardFooter>
      )}
    </Card>
  );
}

interface StatsProps {
  conversationsCount: number;
  resolutionRate: number;
  avgResponseTime: string;
}

export function Stats({ 
  conversationsCount = 0, 
  resolutionRate = 0, 
  avgResponseTime = '0.0s' 
}: StatsProps) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
        <div className="flex items-center space-x-2">
          <select 
            className="bg-white text-sm border border-gray-200 rounded-md py-1 pl-3 pr-8"
            defaultValue="7days"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>
    
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MessageSquare />}
          title="Total Conversations"
          value={conversationsCount.toString()}
          change={{ value: 12.5, timeFrame: "last week" }}
          linkText="View all conversations"
          linkHref="/conversations"
          gradient="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
        />
        
        <StatCard
          icon={<CheckCircle />}
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          change={{ value: 3.2, timeFrame: "last week" }}
          linkText="View details"
          linkHref="#"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          gradient="linear-gradient(135deg, #10B981 0%, #34D399 100%)"
        />
        
        <StatCard
          icon={<Clock />}
          title="Avg. Response Time"
          value={avgResponseTime}
          change={{ value: -8.1, timeFrame: "last week" }}
          linkText="View metrics"
          linkHref="#"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          gradient="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
        />
        
        <StatCard
          icon={<Users />}
          title="Total Users"
          value="2,345"
          change={{ value: 5.3, timeFrame: "last week" }}
          linkText="View all users"
          linkHref="#"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          gradient="linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
        />
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Sales Conversion</h3>
              <div className="flex items-center text-green-600 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                7.2%
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-semibold text-gray-900">$12,624</p>
              <p className="text-sm text-gray-500">134 orders this week</p>
            </div>
            
            {/* Sales progress bars */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Direct Sales</span>
                  <span className="text-gray-500">$4,892</span>
                </div>
                <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Chatbot Assisted</span>
                  <span className="text-gray-500">$7,732</span>
                </div>
                <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Chatbot Performance</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1"></span>
                  Active
                </span>
              </div>
            </div>
            
            {/* Key metrics */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Success Rate</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">94.2%</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Cart Recovery</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">38.5%</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Avg. Duration</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">2:45</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs font-medium text-gray-500">NPS Score</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">8.7/10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
