import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStore, getStoreConfig, updateStoreConfig, connectShopify } from "@/lib/api";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Configuration() {
  const { toast } = useToast();
  const [shopDomain, setShopDomain] = useState("");

  const { data: store, isLoading: isStoreLoading } = useQuery({
    queryKey: ['/api/stores'],
    queryFn: getStore,
  });

  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['/api/store-config'],
    queryFn: getStoreConfig,
    enabled: !!store
  });

  const updateConfigMutation = useMutation({
    mutationFn: updateStoreConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-config'] });
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
      setIsEditingApiKey(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
    }
  });

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain) {
      toast({
        title: "Error",
        description: "Please enter a valid Shopify store domain",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Format domain if needed
      let formattedDomain = shopDomain;
      if (!formattedDomain.includes('.myshopify.com')) {
        formattedDomain += '.myshopify.com';
      }
      
      await connectShopify(formattedDomain);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Shopify store",
        variant: "destructive",
      });
    }
  };

  const handleSaveApiKey = async () => {
    if (!openaiApiKey || openaiApiKey === "••••••••••••••••••••••••••") {
      toast({
        title: "Error",
        description: "Please enter a valid OpenAI API key",
        variant: "destructive",
      });
      return;
    }
    
    updateConfigMutation.mutate({ openaiApiKey });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Configuration</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Shopify Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Shopify Connection</CardTitle>
              <CardDescription>
                Connect your Shopify store to enable the AI chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {store ? (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-md p-4 border border-green-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Connected to Shopify</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Your store <span className="font-medium">{store.shopName}</span> is connected</p>
                          <p className="text-xs mt-1">Domain: {store.shopifyDomain}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConnectShopify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopDomain">Shopify Store Domain</Label>
                    <div className="flex">
                      <Input
                        id="shopDomain"
                        placeholder="your-store.myshopify.com"
                        value={shopDomain}
                        onChange={(e) => setShopDomain(e.target.value)}
                        className="flex-grow"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Enter your Shopify store domain to connect your store
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isStoreLoading || !shopDomain}
                    className="w-full md:w-auto"
                  >
                    Connect Shopify Store
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          
          {/* OpenAI API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>OpenAI API Configuration</CardTitle>
              <CardDescription>
                AI functionality is already included with your service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">AI Functionality Included</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Your chatbot is already configured to use OpenAI's GPT-4o model for AI responses. No additional API key is required.</p>
                      <p className="mt-2">The AI integration is pre-configured and managed by our service.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Current status of your chatbot integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium text-gray-900">Shopify Connection</h3>
                    <div className="mt-2 flex items-center">
                      <div className={`w-2 h-2 rounded-full ${store ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                      <span className="text-sm text-gray-600">{store ? 'Connected' : 'Not Connected'}</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium text-gray-900">OpenAI API</h3>
                    <div className="mt-2 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Configured</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium text-gray-900">Chat Widget</h3>
                    <div className="mt-2 flex items-center">
                      <div className={`w-2 h-2 rounded-full ${store ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></div>
                      <span className="text-sm text-gray-600">{store ? 'Ready to Deploy' : 'Pending'}</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium text-gray-900">MongoDB Chat Logs</h3>
                    <div className="mt-2 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
