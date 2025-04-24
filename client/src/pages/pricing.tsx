import { useQuery, useMutation } from '@tanstack/react-query';
import { getUser } from '@/lib/api';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Pricing plan feature definitions
const tiers = [
  {
    name: "Free",
    id: "free",
    price: { monthly: 0, annually: 0 },
    description: "For small stores or those new to chatbots to test the platform",
    features: [
      { name: "Basic AI chatbot (500 interactions/month)", included: true },
      { name: "Shopify integration (catalog sync, order lookup)", included: true },
      { name: "Standard FAQ system (up to 10 FAQs)", included: true },
      { name: "Basic analytics (conversation volume, top queries)", included: true },
      { name: "Embedded widget with default branding", included: true },
      { name: "Community support (forums, knowledge base)", included: true },
      { name: "Product recommendations", included: false },
      { name: "Cart recovery automation", included: false },
      { name: "Advanced customization", included: false },
      { name: "Multi-language support", included: false },
      { name: "Priority support", included: false },
    ],
    callToAction: "Get Started",
    highlighted: false,
    badge: null,
  },
  {
    name: "Starter",
    id: "starter",
    price: { monthly: 29, annually: 290 },
    description: "For growing merchants needing more functionality and customization",
    features: [
      { name: "Increased usage (2,000 interactions/month)", included: true },
      { name: "All Free Tier features", included: true },
      { name: "Intelligent product recommendations (text-based)", included: true },
      { name: "Basic cart recovery (50 recovery attempts/month)", included: true },
      { name: "Enhanced customization (logo, colors, tone)", included: true },
      { name: "Multi-language support (up to 3 languages)", included: true },
      { name: "Email support (48-hour response time)", included: true },
      { name: "Advanced analytics", included: false },
      { name: "Advanced product recommendations", included: false },
      { name: "Full cart recovery automation", included: false },
      { name: "Priority support", included: false },
    ],
    callToAction: "Upgrade Now",
    highlighted: true,
    badge: "Popular",
  },
  {
    name: "Pro",
    id: "pro",
    price: { monthly: 99, annually: 990 },
    description: "For established merchants with higher traffic and advanced requirements",
    features: [
      { name: "Higher usage (10,000 interactions/month)", included: true },
      { name: "All Starter Tier features", included: true },
      { name: "Advanced product recommendations (visual carousel)", included: true },
      { name: "Full cart recovery automation (unlimited)", included: true },
      { name: "Comprehensive analytics with visualization", included: true },
      { name: "Multi-language support (unlimited languages)", included: true },
      { name: "Advanced customization (widget placement, behavior)", included: true },
      { name: "Priority email and chat support (24-hour response)", included: true },
    ],
    callToAction: "Upgrade Now",
    highlighted: false,
    badge: null,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    price: { monthly: null, annually: null },
    description: "For high-volume merchants or those requiring bespoke solutions",
    features: [
      { name: "Unlimited customer interactions", included: true },
      { name: "All Pro Tier features", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom AI training (industry-specific datasets)", included: true },
      { name: "Multi-channel support (email, SMS, social media)", included: true },
      { name: "Advanced integrations (CRM, ERP systems)", included: true },
      { name: "SLA-backed support (12-hour response time)", included: true },
      { name: "White-labeling option (fully branded chatbot)", included: true },
    ],
    callToAction: "Contact Sales",
    highlighted: false,
    badge: "Enterprise",
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const { toast } = useToast();
  
  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getUser,
  });
  
  // Fetch available subscription plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription/plans'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription/plans");
      return res.json();
    },
    // Don't fetch plans if we don't have a logged-in user
    enabled: !!userData,
  });
  
  // Fetch user's subscription status
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription/status");
      return res.json();
    },
    // Don't fetch subscription status if we don't have a logged-in user
    enabled: !!userData,
  });
  
  // Mutation for checkout process
  const checkoutMutation = useMutation({
    mutationFn: async (variables: { planName: string; isYearly: boolean }) => {
      const res = await apiRequest("POST", "/api/subscription/checkout", variables);
      return res.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Checkout Error",
        description: "There was a problem creating the checkout session. Please try again later.",
        variant: "destructive",
      });
      console.error("Checkout error:", error);
    },
  });
  
  // Mutation for canceling a subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/cancel");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully. You will continue to have access until the end of your billing period.",
      });
      
      // Refetch subscription data to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Error",
        description: "There was a problem cancelling your subscription. Please try again later.",
        variant: "destructive",
      });
      console.error("Cancellation error:", error);
    },
  });
  
  // Determine the current plan (default to free if not available)
  const currentPlan = subscriptionData?.subscription?.tier || "free";
  
  // Handle the upgrade button click
  const handleUpgrade = (planId: string) => {
    if (planId === 'enterprise') {
      // For enterprise plan, show a message
      toast({
        title: "Enterprise Plan",
        description: "Please contact our sales team for enterprise pricing and features.",
      });
      // Here you could also redirect to a contact form or open a modal
      return;
    }
    
    // Start the checkout process
    checkoutMutation.mutate({
      planName: planId,
      isYearly: billingCycle === 'annually',
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Sidebar user={userData} />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1">
        <DashboardHeader title="Pricing & Plans" user={userData} />
        
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
              <p className="mt-4 text-lg text-gray-600">
                Select the plan that best fits your business needs
              </p>
              
              <div className="mt-6 flex justify-center items-center space-x-4">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <Switch
                  checked={billingCycle === 'annually'}
                  onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
                />
                <span className={`text-sm font-medium ${billingCycle === 'annually' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Annually
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-100">
                    Save 20%
                  </Badge>
                </span>
              </div>
            </div>
            
            {/* Login prompt for non-authenticated users */}
            {!userData && !isLoadingUser && (
              <Alert variant="default" className="mb-8 border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle>Sign in required</AlertTitle>
                <AlertDescription>
                  Please <a href="/login" className="text-primary font-medium hover:underline">sign in</a> to manage your subscription and access paid features.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Stripe API key notice */}
            <Alert className="mb-8 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Stripe Integration Notice</AlertTitle>
              <AlertDescription>
                The subscription payment functionality requires Stripe API keys to be configured. For testing purposes, 
                you can view the subscription UI but checkout won't be functional until Stripe keys are provided.
              </AlertDescription>
            </Alert>
            
            {/* Current subscription status */}
            {subscriptionData && (
              <div className="mb-12 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Your Current Subscription</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Plan: <span className="font-medium text-primary-600">{subscriptionData.subscription?.name || 'Free'}</span>
                      </p>
                    </div>
                    
                    {subscriptionData.subscription?.status && subscriptionData.subscription.status !== 'active' && (
                      <Badge 
                        variant="outline" 
                        className={`ml-2 ${
                          subscriptionData.subscription.status === 'past_due' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : subscriptionData.subscription.status === 'canceled' 
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}
                      >
                        {subscriptionData.subscription.status.charAt(0).toUpperCase() + 
                          subscriptionData.subscription.status.slice(1).replace('_', ' ')}
                      </Badge>
                    )}
                    
                    {subscriptionData.subscription?.nextBillingDate && (
                      <div className="text-sm text-gray-600 mt-2 sm:mt-0">
                        Next billing date:{' '}
                        <span className="font-medium">
                          {new Date(subscriptionData.subscription.nextBillingDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {subscriptionData.usage && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Monthly interactions usage: {subscriptionData.usage.current}/{subscriptionData.usage.limit}
                        </span>
                        <span className="text-sm font-medium text-gray-500">
                          {Math.round((subscriptionData.usage.current / subscriptionData.usage.limit) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(subscriptionData.usage.current / subscriptionData.usage.limit) * 100} 
                        className="h-2"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Resets on {new Date(subscriptionData.usage.resetDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {subscriptionData.subscription?.tier !== 'free' && (
                    <div className="mt-4 flex">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel your subscription? Your benefits will continue until the end of your billing period.")) {
                            cancelSubscriptionMutation.mutate();
                          }
                        }}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        {cancelSubscriptionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Cancel Subscription"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isLoadingSubscription && (
              <div className="mb-12 flex items-center justify-center p-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                <span className="text-gray-600">Loading subscription data...</span>
              </div>
            )}
          
            <div className="mt-4 grid gap-6 lg:grid-cols-4 lg:gap-6">
              {tiers.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`flex flex-col ${
                    tier.id === 'enterprise' 
                      ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-lg' 
                      : tier.highlighted 
                        ? 'border-primary shadow-lg ring-1 ring-primary/20' 
                        : 'border-gray-200'
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">{tier.name}</CardTitle>
                      {tier.badge && (
                        <Badge className={`
                          ${tier.id === 'enterprise' 
                            ? 'bg-indigo-600 text-white border-none' 
                            : 'bg-primary text-white border-none'
                          }`}>
                          {tier.badge}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="pt-1.5 min-h-[40px]">
                      {tier.description}
                    </CardDescription>
                    <div className="mt-4">
                      {tier.price[billingCycle] !== null ? (
                        <>
                          <span className="text-3xl font-bold text-gray-900">
                            ${tier.price[billingCycle]}
                          </span>
                          {tier.id !== 'free' && (
                            <span className="text-gray-500 ml-2">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          Custom Pricing
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <ul className="space-y-3 pt-4">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 flex-shrink-0 mr-2" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-500'}`}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="pt-6 pb-8">
                    <Button 
                      className={`w-full ${
                        tier.id === 'enterprise' 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                          : tier.highlighted 
                            ? 'bg-primary hover:bg-primary/90' 
                            : ''
                      }`}
                      variant={tier.id === 'enterprise' ? 'default' : tier.highlighted ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={currentPlan === tier.id}
                    >
                      {currentPlan === tier.id ? 'Current Plan' : tier.callToAction}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-8">
                <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
                <div className="mt-8 space-y-8">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Can I upgrade my plan at any time?</h3>
                    <p className="mt-2 text-sm text-gray-600">Yes, you can upgrade your plan at any time. Your new plan will take effect immediately and you'll be charged the prorated amount for the remainder of your billing cycle.</p>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">What happens if I exceed my monthly interactions?</h3>
                    <p className="mt-2 text-sm text-gray-600">If you exceed your monthly interaction limit, you'll be prompted to upgrade to a higher tier. We won't automatically charge you for overages.</p>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Is there a long-term contract?</h3>
                    <p className="mt-2 text-sm text-gray-600">No, all our plans are subscription-based with no long-term commitment. You can cancel at any time.</p>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">How do you count interactions?</h3>
                    <p className="mt-2 text-sm text-gray-600">An interaction is counted each time a customer sends a message to your chatbot and receives a response. Follow-up messages in the same conversation are also counted as separate interactions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}