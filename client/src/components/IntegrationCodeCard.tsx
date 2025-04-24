import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getStore, getWidgetEmbedCode } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IntegrationCodeCard() {
  const { toast } = useToast();
  const [embedCode, setEmbedCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  const { data: store, isLoading } = useQuery({
    queryKey: ['/api/stores'],
    queryFn: getStore
  });
  
  useEffect(() => {
    const fetchEmbedCode = async () => {
      if (!store) return;
      
      try {
        const code = await getWidgetEmbedCode(store.shopifyDomain);
        setEmbedCode(code);
      } catch (error) {
        console.error("Failed to get embed code:", error);
      }
    };
    
    fetchEmbedCode();
  }, [store]);
  
  const copyToClipboard = () => {
    if (!embedCode) return;
    
    navigator.clipboard.writeText(embedCode).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Integration code copied to clipboard",
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }).catch(err => {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    });
  };
  
  return (
    <Card className="mt-8">
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Integration Code</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Add this code to your Shopify theme to enable the AI chatbot on your store.
          </p>
          
          {isLoading ? (
            <div className="bg-gray-100 animate-pulse h-16 rounded-md"></div>
          ) : !store ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                You need to connect your Shopify store first to get the integration code.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                <pre className="text-gray-100 text-sm font-mono whitespace-pre"><code>{embedCode || `<script src="${window.location.protocol}//${window.location.host}/widget.js?shop=${store.shopifyDomain}"></script>`}</code></pre>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard} 
                  className="flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {isCopied ? "Copied!" : "Copy to Clipboard"}
                </Button>
              </div>
            </>
          )}
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Installation Status:</h4>
            <div className="flex items-center">
              <span className={`flex-shrink-0 h-4 w-4 rounded-full ${store ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center mr-2`}>
                <span className={`h-2 w-2 rounded-full ${store ? 'bg-green-600' : 'bg-yellow-600'}`}></span>
              </span>
              <p className="text-sm text-gray-500">
                {store ? "Installed and active on your store" : "Not yet installed"}
              </p>
            </div>
          </div>
          
          {store && (
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Installation Instructions:</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li>Log in to your Shopify admin panel</li>
                <li>Go to "Online Store" &gt; "Themes"</li>
                <li>Click "Actions" &gt; "Edit code" on your active theme</li>
                <li>Find the theme.liquid file in the "Layout" folder</li>
                <li>Paste the code above just before the closing &lt;/body&gt; tag</li>
                <li>Click "Save"</li>
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
