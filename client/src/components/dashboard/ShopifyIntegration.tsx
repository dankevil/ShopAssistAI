import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { connectShopify, getShopifyStores } from '@/lib/shopify';
import { getStores, getSettings, updateSettings } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Store, 
  Tag, 
  Box, 
  Truck, 
  MessageCircle, 
  Book, 
  FileText, 
  Lightbulb, 
  Warehouse, 
  ShoppingBag, 
  Settings, 
  Users, 
  Zap,
  Filter,
  Layers,
  BookOpen,
  Brain,
  Info as InfoCircleIcon
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShopifyIntegrationProps {
  userId: number;
  onStoreConnected?: (storeId: number) => void;
}

export function ShopifyIntegration({ userId, onStoreConnected }: ShopifyIntegrationProps) {
  const [shopInput, setShopInput] = useState('');
  const [activeTab, setActiveTab] = useState('features');
  
  // Basic features
  const [features, setFeatures] = useState({
    productSearch: true,
    orderStatus: true,
    recommendations: true,
    inventory: true,
  });
  
  // Advanced AI customization options
  const [aiCustomization, setAiCustomization] = useState({
    conversationMode: 'balanced',
    dataCollectionLevel: 'comprehensive',
    responseLength: 'medium',
    tone: 'professional',
    creativity: 50,
    knowledgePriority: 'balanced',
    trainingMethod: 'auto',
  });
  
  // Knowledge base settings
  const [knowledgeBase, setKnowledgeBase] = useState({
    includeProductDescriptions: true,
    includeReviews: true,
    includeCollections: true,
    includePolicies: true,
    includeMetafields: true,
    includeBlogContent: true,
    includeStorefrontContent: true,
  });
  
  // Conversation handling
  const [conversationSettings, setConversationSettings] = useState({
    maxHistoryLength: 10,
    userIdentification: 'optional',
    handoffThreshold: 3,
    followUpEnabled: true,
    proactiveChat: false,
    messageDelay: 0,
  });
  
  // Custom training data
  const [customTraining, setCustomTraining] = useState({
    additionalInstructions: '',
    prohibitedTopics: '',
    favoredProducts: '',
    customFAQs: '',
  });
  
  // Loading and saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  const { toast } = useToast();

  const { 
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/shopify/stores'],
    queryFn: getStores,
  });

  const connectMutation = useMutation({
    mutationFn: connectShopify,
    onSuccess: (authUrl) => {
      // Redirect to Shopify OAuth flow
      window.location.href = authUrl;
    },
    onError: () => {
      toast({
        title: 'Connection failed',
        description: 'Unable to connect to Shopify. Please check your store name and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleConnect = () => {
    let shopName = shopInput.trim();
    if (!shopName) {
      toast({
        title: 'Store name required',
        description: 'Please enter your Shopify store name',
        variant: 'destructive',
      });
      return;
    }

    // Add myshopify.com suffix if not present
    if (!shopName.includes('.')) {
      shopName = `${shopName}.myshopify.com`;
    }

    connectMutation.mutate(shopName);
  };

  const handleFeatureToggle = (feature: keyof typeof features) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const store = data?.stores?.[0];
  const connected = !!store;

  // Load settings for the store
  const { 
    data: settingsData,
    refetch: refetchSettings,
    isLoading: isLoadingSettingsData 
  } = useQuery({
    queryKey: ['/api/settings', store?.id],
    queryFn: () => getSettings(store?.id),
    enabled: !!store?.id
  });
  
  // Update state when settings data changes
  useEffect(() => {
    if (settingsData) {
      // Initialize state with data from the API
      if (settingsData.chatbotFeatures) setFeatures(settingsData.chatbotFeatures);
      if (settingsData.aiCustomization) setAiCustomization(settingsData.aiCustomization);
      if (settingsData.knowledgeBase) setKnowledgeBase(settingsData.knowledgeBase);
      if (settingsData.conversationSettings) setConversationSettings(settingsData.conversationSettings);
      if (settingsData.customTraining) setCustomTraining(settingsData.customTraining);
      setIsLoadingSettings(false);
    }
  }, [settingsData]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: any) => updateSettings(store?.id, data),
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your chatbot configuration has been updated successfully.",
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle saving all settings
  const handleSaveSettings = () => {
    if (!store?.id) return;
    
    setIsSaving(true);
    
    const settingsToSave = {
      chatbotFeatures: features,
      aiCustomization: aiCustomization,
      knowledgeBase: knowledgeBase,
      conversationSettings: conversationSettings,
      customTraining: customTraining,
    };
    
    saveSettingsMutation.mutate(settingsToSave);
    setIsSaving(false);
  };

  // Check URL parameters for store_connected=true
  const urlParams = new URLSearchParams(window.location.search);
  const justConnected = urlParams.get('store_connected') === 'true';
  const newStoreId = urlParams.get('store_id');

  // Call onStoreConnected if store was just connected
  if (justConnected && newStoreId && onStoreConnected) {
    onStoreConnected(parseInt(newStoreId));
    // Remove the query params to avoid triggering this again on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shopify Integration</CardTitle>
          <CardDescription>Connect your Shopify store to enable product and order information in your chatbot.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to load Shopify store information. Please try again.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Shopify Integration</CardTitle>
        <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">
          Connect your Shopify store to enable product and order information in your chatbot.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        {!connected && !isLoading && (
          <div className="text-center">
            <Store className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No store connected</h3>
            <p className="mt-1 text-sm text-gray-500">Connect your Shopify store to enable product and order information in your chatbot.</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Input
                  value={shopInput}
                  onChange={(e) => setShopInput(e.target.value)}
                  placeholder="your-store"
                  className="max-w-md mx-auto"
                />
                <span className="text-gray-500 text-sm">.myshopify.com</span>
              </div>
              <Button
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="inline-flex items-center"
              >
                {connectMutation.isPending ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Store className="-ml-1 mr-2 h-5 w-5" />
                    Connect Shopify Store
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {justConnected && newStoreId && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Your Shopify store has been connected successfully and is now syncing data.
            </AlertDescription>
          </Alert>
        )}

        {(connected || isLoading) && (
          <>
            {isLoading ? (
              <div className="border-b border-gray-200 pb-5 mb-5 animate-pulse">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Store Information</h3>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-md bg-gray-200"></div>
                  <div className="ml-4">
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    <div className="h-3 w-60 bg-gray-200 rounded mt-2"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-b border-gray-200 pb-5 mb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Store Information</h3>
                <div className="mt-4 flex items-center">
                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={`https://avatar.vercel.sh/${store.domain}.png`} alt="Store logo" />
                    <AvatarFallback className="bg-primary-100 text-primary-800">
                      {store.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <h4 className="text-md font-medium text-gray-900">{store.name}</h4>
                    <p className="text-sm text-gray-500">{store.domain}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="border-b border-gray-200 pb-5 mb-5 animate-pulse">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Data Sync Status</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="h-4 w-20 bg-gray-200 rounded mb-3"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-b border-gray-200 pb-5 mb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Data Sync Status</h3>
                <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Card>
                    <CardContent className="pt-5">
                      <dt className="text-sm font-medium text-gray-500 truncate">Products</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">248</dd>
                      <dd className="mt-2 text-sm text-gray-500">Last synced 5 minutes ago</dd>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-5">
                      <dt className="text-sm font-medium text-gray-500 truncate">Collections</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">12</dd>
                      <dd className="mt-2 text-sm text-gray-500">Last synced 5 minutes ago</dd>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-5">
                      <dt className="text-sm font-medium text-gray-500 truncate">Orders (30 days)</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">156</dd>
                      <dd className="mt-2 text-sm text-gray-500">Last synced 5 minutes ago</dd>
                    </CardContent>
                  </Card>
                </dl>
              </div>
            )}

            <div>
              <Tabs defaultValue="features" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="features" className="flex items-center">
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Basic Features</span>
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex items-center">
                    <Brain className="mr-2 h-4 w-4" />
                    <span>AI Customization</span>
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Knowledge Base</span>
                  </TabsTrigger>
                  <TabsTrigger value="conversation" className="flex items-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Conversation</span>
                  </TabsTrigger>
                  <TabsTrigger value="training" className="flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    <span>Custom Training</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Basic Features Tab */}
                <TabsContent value="features" className="mt-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Chatbot Features</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enable or disable core features to customize what your AI assistant can do for your customers.
                  </p>
                  <div className="space-y-4">
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Checkbox
                          id="product_search"
                          checked={features.productSearch}
                          onCheckedChange={() => handleFeatureToggle('productSearch')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <Label htmlFor="product_search" className="font-medium text-gray-700">Product Search</Label>
                        <p className="text-gray-500">Allow customers to search for products through the chatbot</p>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Checkbox
                          id="order_status"
                          checked={features.orderStatus}
                          onCheckedChange={() => handleFeatureToggle('orderStatus')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <Label htmlFor="order_status" className="font-medium text-gray-700">Order Status Lookup</Label>
                        <p className="text-gray-500">Let customers check their order status using order number or email</p>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Checkbox
                          id="recommendations"
                          checked={features.recommendations}
                          onCheckedChange={() => handleFeatureToggle('recommendations')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <Label htmlFor="recommendations" className="font-medium text-gray-700">Product Recommendations</Label>
                        <p className="text-gray-500">Provide AI-powered product recommendations based on customer queries</p>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Checkbox
                          id="inventory"
                          checked={features.inventory}
                          onCheckedChange={() => handleFeatureToggle('inventory')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <Label htmlFor="inventory" className="font-medium text-gray-700">Inventory Status</Label>
                        <p className="text-gray-500">Show real-time inventory status for products</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* AI Customization Tab */}
                <TabsContent value="ai" className="mt-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Behavior Customization</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Fine-tune how the AI chatbot interacts with your customers and handles product information.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ai-mode" className="text-sm font-medium text-gray-700">Conversation Mode</Label>
                        <Select 
                          value={aiCustomization.conversationMode} 
                          onValueChange={(value) => setAiCustomization(prev => ({...prev, conversationMode: value}))}
                        >
                          <SelectTrigger id="ai-mode" className="w-full mt-1">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic - Simple Q&A</SelectItem>
                            <SelectItem value="balanced">Balanced - Context Aware</SelectItem>
                            <SelectItem value="expert">Expert - Sales Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">Determines how sophisticated the chatbot's conversation abilities are</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="ai-tone" className="text-sm font-medium text-gray-700">Response Tone</Label>
                        <Select 
                          value={aiCustomization.tone} 
                          onValueChange={(value) => setAiCustomization(prev => ({...prev, tone: value}))}
                        >
                          <SelectTrigger id="ai-tone" className="w-full mt-1">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casual">Casual & Friendly</SelectItem>
                            <SelectItem value="professional">Professional & Formal</SelectItem>
                            <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                            <SelectItem value="technical">Technical & Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">The personality and style of the chatbot's responses</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="ai-length" className="text-sm font-medium text-gray-700">Response Length</Label>
                        <Select 
                          value={aiCustomization.responseLength} 
                          onValueChange={(value) => setAiCustomization(prev => ({...prev, responseLength: value}))}
                        >
                          <SelectTrigger id="ai-length" className="w-full mt-1">
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="concise">Concise - Brief answers</SelectItem>
                            <SelectItem value="medium">Medium - Balanced responses</SelectItem>
                            <SelectItem value="detailed">Detailed - Comprehensive information</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">How detailed the chatbot's answers should be</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ai-training" className="text-sm font-medium text-gray-700">Training Method</Label>
                        <Select 
                          value={aiCustomization.trainingMethod} 
                          onValueChange={(value) => setAiCustomization(prev => ({...prev, trainingMethod: value}))}
                        >
                          <SelectTrigger id="ai-training" className="w-full mt-1">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Automatic - System managed</SelectItem>
                            <SelectItem value="scheduled">Scheduled - Regular updates</SelectItem>
                            <SelectItem value="manual">Manual - On-demand updates</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">How frequently the AI learns from new store data</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="ai-collection" className="text-sm font-medium text-gray-700">Data Collection Level</Label>
                        <Select 
                          value={aiCustomization.dataCollectionLevel} 
                          onValueChange={(value) => setAiCustomization(prev => ({...prev, dataCollectionLevel: value}))}
                        >
                          <SelectTrigger id="ai-collection" className="w-full mt-1">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic - Essential product info only</SelectItem>
                            <SelectItem value="standard">Standard - Products and policies</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive - All store content</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">How much data to collect from your store for training</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">AI Creativity Level</Label>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-gray-500 mr-2">Factual</span>
                          <Slider
                            value={[aiCustomization.creativity]}
                            min={0}
                            max={100}
                            step={10}
                            className="flex-1"
                            onValueChange={(value) => setAiCustomization(prev => ({...prev, creativity: value[0]}))}
                          />
                          <span className="text-xs text-gray-500 ml-2">Creative</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Balance between factual responses and creative suggestions</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Knowledge Base Tab */}
                <TabsContent value="knowledge">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Base Configuration</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select which data sources from your store should be used to train the AI assistant.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox
                            id="include-products"
                            checked={knowledgeBase.includeProductDescriptions}
                            onCheckedChange={(checked) => 
                              setKnowledgeBase(prev => ({...prev, includeProductDescriptions: !!checked}))
                            }
                          />
                          <Label htmlFor="include-products" className="ml-2 font-medium">
                            Product Descriptions
                          </Label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircleIcon className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-60">
                                Includes full product descriptions, specifications, and features in the AI's knowledge
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox
                            id="include-reviews"
                            checked={knowledgeBase.includeReviews}
                            onCheckedChange={(checked) => 
                              setKnowledgeBase(prev => ({...prev, includeReviews: !!checked}))
                            }
                          />
                          <Label htmlFor="include-reviews" className="ml-2 font-medium">
                            Product Reviews
                          </Label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircleIcon className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-60">
                                Enables the AI to reference customer reviews and ratings in responses
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox
                            id="include-collections"
                            checked={knowledgeBase.includeCollections}
                            onCheckedChange={(checked) => 
                              setKnowledgeBase(prev => ({...prev, includeCollections: !!checked}))
                            }
                          />
                          <Label htmlFor="include-collections" className="ml-2 font-medium">
                            Collections & Categories
                          </Label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircleIcon className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-60">
                                Helps the AI understand product organization and relationships between items
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox
                            id="include-policies"
                            checked={knowledgeBase.includePolicies}
                            onCheckedChange={(checked) => 
                              setKnowledgeBase(prev => ({...prev, includePolicies: !!checked}))
                            }
                          />
                          <Label htmlFor="include-policies" className="ml-2 font-medium">
                            Store Policies
                          </Label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircleIcon className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-60">
                                Includes shipping, returns, and other store policies in the AI's responses
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox
                            id="include-metafields"
                            checked={knowledgeBase.includeMetafields}
                            onCheckedChange={(checked) => 
                              setKnowledgeBase(prev => ({...prev, includeMetafields: !!checked}))
                            }
                          />
                          <Label htmlFor="include-metafields" className="ml-2 font-medium">
                            Product Metafields
                          </Label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircleIcon className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-60">
                                Includes custom product data fields like dimensions, materials, etc.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox
                            id="include-blog"
                            checked={knowledgeBase.includeBlogContent}
                            onCheckedChange={(checked) => 
                              setKnowledgeBase(prev => ({...prev, includeBlogContent: !!checked}))
                            }
                          />
                          <Label htmlFor="include-blog" className="ml-2 font-medium">
                            Blog Content
                          </Label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircleIcon className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-60">
                                Allows the AI to reference your blog posts and articles when answering questions
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox
                            id="include-storefront"
                            checked={knowledgeBase.includeStorefrontContent}
                            onCheckedChange={(checked) => 
                              setKnowledgeBase(prev => ({...prev, includeStorefrontContent: !!checked}))
                            }
                          />
                          <Label htmlFor="include-storefront" className="ml-2 font-medium">
                            Storefront Pages
                          </Label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircleIcon className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-60">
                                Incorporates about pages, contact info, and other content from your store's pages
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Lightbulb className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Knowledge Base Training</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Select more data sources to make your AI assistant more knowledgeable about your store and products. The system will automatically extract and process this data to train the AI.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Conversation Tab */}
                <TabsContent value="conversation">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Settings</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure how the chatbot handles customer conversations and manages context.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user-identification" className="text-sm font-medium text-gray-700">Customer Identification</Label>
                        <Select 
                          value={conversationSettings.userIdentification} 
                          onValueChange={(value) => setConversationSettings(prev => ({...prev, userIdentification: value}))}
                        >
                          <SelectTrigger id="user-identification" className="w-full mt-1">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="anonymous">Anonymous - No identification</SelectItem>
                            <SelectItem value="optional">Optional - Customer decides</SelectItem>
                            <SelectItem value="required">Required - Must identify for chat</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">Whether customers need to identify themselves before chatting</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="max-history" className="text-sm font-medium text-gray-700">Conversation Memory Length</Label>
                        <Select 
                          value={conversationSettings.maxHistoryLength.toString()} 
                          onValueChange={(value) => setConversationSettings(prev => ({...prev, maxHistoryLength: parseInt(value)}))}
                        >
                          <SelectTrigger id="max-history" className="w-full mt-1">
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">Short (5 messages)</SelectItem>
                            <SelectItem value="10">Medium (10 messages)</SelectItem>
                            <SelectItem value="20">Long (20 messages)</SelectItem>
                            <SelectItem value="50">Extended (50 messages)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">How many previous messages to include for context</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex-1">
                          <Label htmlFor="follow-up-enabled" className="font-medium text-gray-700">Follow-up Questions</Label>
                          <p className="text-xs text-gray-500">Enable chatbot to ask follow-up questions to clarify customer needs</p>
                        </div>
                        <div>
                          <Switch
                            id="follow-up-enabled"
                            checked={conversationSettings.followUpEnabled}
                            onCheckedChange={(checked: boolean) => 
                              setConversationSettings(prev => ({...prev, followUpEnabled: checked}))
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex-1">
                          <Label htmlFor="proactive-chat" className="font-medium text-gray-700">Proactive Chat</Label>
                          <p className="text-xs text-gray-500">Chatbot initiates conversation after customer browses for a period</p>
                        </div>
                        <div>
                          <Switch
                            id="proactive-chat"
                            checked={conversationSettings.proactiveChat}
                            onCheckedChange={(checked: boolean) => 
                              setConversationSettings(prev => ({...prev, proactiveChat: checked}))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="handoff-threshold" className="text-sm font-medium text-gray-700">Human Handoff Threshold</Label>
                        <Select 
                          value={conversationSettings.handoffThreshold.toString()} 
                          onValueChange={(value) => setConversationSettings(prev => ({...prev, handoffThreshold: parseInt(value)}))}
                        >
                          <SelectTrigger id="handoff-threshold" className="w-full mt-1">
                            <SelectValue placeholder="Select threshold" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Immediately after 1 failed response</SelectItem>
                            <SelectItem value="2">After 2 failed responses</SelectItem>
                            <SelectItem value="3">After 3 failed responses</SelectItem>
                            <SelectItem value="5">After 5 failed responses</SelectItem>
                            <SelectItem value="0">Never (AI only)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">When to offer human support after failed AI responses</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Message Typing Delay</Label>
                        <div className="flex items-center mt-2 space-x-2">
                          <Slider
                            value={[conversationSettings.messageDelay]}
                            min={0}
                            max={3}
                            step={0.5}
                            className="flex-1"
                            onValueChange={(value) => setConversationSettings(prev => ({...prev, messageDelay: value[0]}))}
                          />
                          <span className="text-sm min-w-[60px]">{conversationSettings.messageDelay}s</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Artificial typing delay before sending responses (0 = instant)</p>
                      </div>
                      
                      <div className="pt-4 mt-2">
                        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <AlertTitle className="text-amber-800">Customer Privacy</AlertTitle>
                          <AlertDescription className="text-amber-700 text-xs">
                            All conversation settings respect customer privacy and chat transcripts are only used to improve AI responses with explicit customer consent.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Custom Training Tab */}
                <TabsContent value="training">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Training Data</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Provide additional instructions and information to customize how the AI assistant responds.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="additional-instructions" className="block text-sm font-medium text-gray-700 mb-1">
                        Special Instructions
                      </Label>
                      <Textarea
                        id="additional-instructions"
                        placeholder="E.g.: Always suggest our premium collections first. Emphasize our sustainable practices when discussing product materials."
                        value={customTraining.additionalInstructions}
                        onChange={(e) => setCustomTraining(prev => ({...prev, additionalInstructions: e.target.value}))}
                        className="h-24"
                      />
                      <p className="mt-1 text-xs text-gray-500">Special instructions for the AI to follow when answering customer questions</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="prohibited-topics" className="block text-sm font-medium text-gray-700 mb-1">
                        Topics to Avoid
                      </Label>
                      <Textarea
                        id="prohibited-topics"
                        placeholder="E.g.: Competitor products, pricing negotiations, upcoming unreleased products"
                        value={customTraining.prohibitedTopics}
                        onChange={(e) => setCustomTraining(prev => ({...prev, prohibitedTopics: e.target.value}))}
                        className="h-24"
                      />
                      <p className="mt-1 text-xs text-gray-500">List topics that the AI should not discuss with customers</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="favored-products" className="block text-sm font-medium text-gray-700 mb-1">
                        Featured Products
                      </Label>
                      <Textarea
                        id="favored-products"
                        placeholder="E.g.: Premium Collection, New Spring Line, Bestsellers"
                        value={customTraining.favoredProducts}
                        onChange={(e) => setCustomTraining(prev => ({...prev, favoredProducts: e.target.value}))}
                        className="h-24"
                      />
                      <p className="mt-1 text-xs text-gray-500">Products or collections to emphasize when relevant to customer queries</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="custom-faqs" className="block text-sm font-medium text-gray-700 mb-1">
                        Custom FAQ Content
                      </Label>
                      <Textarea
                        id="custom-faqs"
                        placeholder="E.g.: Q: What makes your products unique? A: Our products are handcrafted using traditional techniques with sustainable materials."
                        value={customTraining.customFAQs}
                        onChange={(e) => setCustomTraining(prev => ({...prev, customFAQs: e.target.value}))}
                        className="h-24"
                      />
                      <p className="mt-1 text-xs text-gray-500">Additional Q&A pairs to train the AI with specific responses for common questions</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Zap className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Real-time Training</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              Changes to custom training data are applied within minutes. The AI will immediately begin using your custom instructions to respond to customer queries.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-8 flex justify-end border-t pt-4">
                <Button
                  variant="outline"
                  className="mr-3 inline-flex items-center"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
                <Button
                  variant="default"
                  className="inline-flex items-center"
                  onClick={handleSaveSettings}
                  disabled={isSaving || saveSettingsMutation.isPending}
                >
                  {isSaving || saveSettingsMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
