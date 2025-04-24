import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWidgetCode } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';

interface EmbedCodeProps {
  storeId: number;
}

export function EmbedCode({ storeId }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/widget/code', storeId],
    queryFn: () => getWidgetCode(storeId),
    enabled: !!storeId,
  });

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'The embed code has been copied to your clipboard.',
      });
    }).catch(() => {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy the code. Try manually selecting and copying.',
        variant: 'destructive',
      });
    });
  };

  const basicEmbedCode = data?.code || '<script src="https://example.com/widget.js?id=LOADING" async></script>';

  const advancedHideOnPagesCode = `<script 
  src="https://example.com/widget.js?id=${storeId}" 
  data-exclude-paths="/checkout,/account" 
  async
></script>`;

  const advancedCustomInitCode = `<!-- Add this script to your website's HTML -->
<script src="https://example.com/widget.js?id=${storeId}" async></script>

<!-- Add this script anywhere after the above script -->
<script>
  window.AIChatbot = window.AIChatbot || {};
  window.AIChatbot.q = window.AIChatbot.q || [];
  window.AIChatbot.q.push(['init', {
    openOnLoad: false,
    position: 'left',
    customData: {
      userId: '123',
      userEmail: 'user@example.com'
    }
  }]);
</script>`;

  const advancedEventsCode = `<script>
  document.addEventListener('aichatbot:ready', function() {
    console.log('Chatbot is ready');
  });

  document.addEventListener('aichatbot:open', function() {
    console.log('Chatbot was opened');
  });

  document.addEventListener('aichatbot:close', function() {
    console.log('Chatbot was closed');
  });
</script>`;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
          <CardDescription>
            There was an error generating your embed code. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Embed Code</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Copy and paste this code snippet into your website to add the AI chatbot.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-gray-50 p-4 m-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Installation Instructions</h4>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Simple Integration
            </span>
          </div>
          <ol className="list-decimal pl-5 mb-6 space-y-2 text-sm text-gray-700">
            <li>Copy the code below</li>
            <li>Paste it before the closing <code className="text-gray-900 font-mono text-xs">&lt;/body&gt;</code> tag on every page where you want the chatbot to appear</li>
            <li>Save your changes and refresh your website</li>
          </ol>
          
          <div className="relative">
            <pre className="bg-gray-800 text-white text-sm p-4 rounded-lg overflow-x-auto">
              <code>{isLoading ? 'Loading...' : basicEmbedCode}</code>
            </pre>
            <Button 
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 text-xs"
              onClick={() => handleCopy(basicEmbedCode)}
              disabled={isLoading}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Advanced Integration Options</h4>
            
            <Tabs defaultValue="hide">
              <TabsList className="mb-4">
                <TabsTrigger value="hide">Hide on Specific Pages</TabsTrigger>
                <TabsTrigger value="custom">Custom Initialization</TabsTrigger>
                <TabsTrigger value="events">Custom Events</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hide">
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <h5 className="text-sm font-medium text-gray-900">Hide on Specific Pages</h5>
                  <p className="mt-1 text-xs text-gray-500">Add this data attribute to the script tag to hide the chatbot on specific pages.</p>
                  <div className="relative mt-2">
                    <pre className="bg-gray-100 text-gray-800 text-xs p-2 rounded overflow-x-auto">
                      <code>{advancedHideOnPagesCode}</code>
                    </pre>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 text-xs"
                      onClick={() => handleCopy(advancedHideOnPagesCode)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="custom">
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <h5 className="text-sm font-medium text-gray-900">Custom Initialization</h5>
                  <p className="mt-1 text-xs text-gray-500">Initialize the chatbot with custom settings programmatically.</p>
                  <div className="relative mt-2">
                    <pre className="bg-gray-100 text-gray-800 text-xs p-2 rounded overflow-x-auto">
                      <code>{advancedCustomInitCode}</code>
                    </pre>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 text-xs"
                      onClick={() => handleCopy(advancedCustomInitCode)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="events">
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <h5 className="text-sm font-medium text-gray-900">Custom Events</h5>
                  <p className="mt-1 text-xs text-gray-500">Listen for chatbot events in your website.</p>
                  <div className="relative mt-2">
                    <pre className="bg-gray-100 text-gray-800 text-xs p-2 rounded overflow-x-auto">
                      <code>{advancedEventsCode}</code>
                    </pre>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 text-xs"
                      onClick={() => handleCopy(advancedEventsCode)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
