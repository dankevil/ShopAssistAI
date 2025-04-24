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
// Import specific WP functions and generic store/settings functions
import { connectWordPress, syncWordPressData, getStores, getSettings, updateSettings } from '@/lib/api'; 
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
  Info as InfoCircleIcon,
  Link as LinkIcon, // Changed from Link to avoid conflict
  Server, // Icon for WordPress
  Key // For Application Password
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
import { queryClient } from '@/lib/queryClient'; // Import queryClient

// Define the Store type based on backend response (including platform)
interface StoreType {
  id: number;
  userId: number;
  platform: 'shopify' | 'wordpress';
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: string; // Assuming string from JSON
  hasCredentials?: boolean; // Flag indicating credentials exist (from safeStores)
}

interface WordPressIntegrationProps {
  userId: number;
  onStoreConnected?: (storeId: number) => void;
}

export function WordPressIntegration({ userId, onStoreConnected }: WordPressIntegrationProps) {
  const [wpDomain, setWpDomain] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState(''); // For Application Password
  const [activeTab, setActiveTab] = useState('features');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // Feature states (mirroring ShopifyIntegration for now)
  const [features, setFeatures] = useState({ /* ... same structure ... */ });
  const [aiCustomization, setAiCustomization] = useState({ /* ... same structure ... */ });
  const [knowledgeBase, setKnowledgeBase] = useState({ /* ... same structure ... */ });
  const [conversationSettings, setConversationSettings] = useState({ /* ... same structure ... */ });
  const [customTraining, setCustomTraining] = useState({ /* ... same structure ... */ });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { toast } = useToast();

  // Query for all stores (Shopify + WordPress)
  const { 
    data: storesData,
    isLoading: isLoadingStores,
    error: storesError,
    refetch: refetchStores
  } = useQuery<{ stores: StoreType[] }>({ // Specify StoreType array
    queryKey: ['/api/stores'], // Use the generic endpoint key
    queryFn: getStores,
  });

  // Filter for WordPress stores
  const wordpressStores = storesData?.stores?.filter(s => s.platform === 'wordpress') || [];

  // Effect to select the first WP store if none selected
  useEffect(() => {
    if (!selectedStoreId && wordpressStores.length > 0) {
      setSelectedStoreId(wordpressStores[0].id);
    }
  }, [wordpressStores, selectedStoreId]);

  // Get the currently selected store object
  const activeStore = wordpressStores.find(s => s.id === selectedStoreId);

  // Mutation for connecting a WordPress store
  const connectMutation = useMutation({
    mutationFn: connectWordPress,
    onSuccess: (data) => {
      toast({
        title: 'WordPress Connected',
        description: data.message || 'Your WordPress site has been connected successfully.',
      });
      refetchStores(); // Refetch stores list
      if (data.store && onStoreConnected) {
        onStoreConnected(data.store.id);
        setSelectedStoreId(data.store.id); // Select the newly connected store
      }
       // Reset form fields
      setWpDomain('');
      setWpUsername('');
      setWpPassword('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Unable to connect to WordPress. Please check details and try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for syncing WordPress data
  const syncMutation = useMutation({
      mutationFn: syncWordPressData,
      onMutate: () => setIsSyncing(true),
      onSuccess: (data) => {
          toast({ title: 'Sync Started', description: data.message || 'WordPress data sync initiated.' });
          // Optionally invalidate cache related to WP data if needed
          // queryClient.invalidateQueries({ queryKey: ['wordpressData', selectedStoreId] });
      },
      onError: (error: Error) => {
          toast({ title: 'Sync Failed', description: error.message, variant: 'destructive' });
      },
      onSettled: () => setIsSyncing(false),
  });

  const handleConnect = () => {
    if (!wpDomain || !wpUsername || !wpPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please enter WordPress Site URL, Username, and Application Password.',
        variant: 'destructive',
      });
      return;
    }

    connectMutation.mutate({ 
        domain: wpDomain,
        username: wpUsername,
        applicationPassword: wpPassword 
    });
  };
  
   const handleSync = () => {
        if (!selectedStoreId) {
            toast({ title: 'Error', description: 'No WordPress store selected for sync.', variant: 'destructive' });
            return;
        }
        syncMutation.mutate(selectedStoreId);
    };

  // Query for loading settings for the selected WordPress store
  const { 
    data: settingsData,
    refetch: refetchSettings,
    isLoading: isLoadingSettingsData 
  } = useQuery({
    queryKey: ['/api/settings', selectedStoreId], // Key includes store ID
    queryFn: () => getSettings(selectedStoreId), // Pass selected ID
    enabled: !!selectedStoreId, // Only run if a store is selected
  });
  
  // Effect to update local state when settings are loaded
  useEffect(() => {
    if (settingsData) {
      // Initialize state with data from the API (similar to Shopify)
      if (settingsData.chatbotFeatures) setFeatures(settingsData.chatbotFeatures);
      if (settingsData.aiCustomization) setAiCustomization(settingsData.aiCustomization);
      if (settingsData.knowledgeBase) setKnowledgeBase(settingsData.knowledgeBase);
      if (settingsData.conversationSettings) setConversationSettings(settingsData.conversationSettings);
      if (settingsData.customTraining) setCustomTraining(settingsData.customTraining);
      setIsLoadingSettings(false);
    } else if (selectedStoreId) {
        // If a store is selected but no settings data, indicate loading
        setIsLoadingSettings(true);
    }
  }, [settingsData, selectedStoreId]);

  // Mutation for saving settings
  const saveSettingsMutation = useMutation({
    mutationFn: (data: any) => updateSettings(settingsData?.id, data), // Use settings ID
    onMutate: () => setIsSaving(true),
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your chatbot configuration for WordPress has been updated.",
      });
      refetchSettings(); // Refetch settings after save
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save Settings",
        description: error.message || "An error occurred while saving settings.",
        variant: "destructive",
      });
    },
     onSettled: () => setIsSaving(false),
  });

  const handleSaveSettings = () => {
    if (!settingsData?.id) {
        toast({ title: "Error", description: "Cannot save settings: No active settings found.", variant: "destructive" });
        return;
    };
    
    const settingsToSave = {
      chatbotFeatures: features,
      aiCustomization: aiCustomization,
      knowledgeBase: knowledgeBase,
      conversationSettings: conversationSettings,
      customTraining: customTraining,
    };
    
    saveSettingsMutation.mutate(settingsToSave);
  };

  // Check URL parameters for store_connected=wordpress (optional, for potential redirects)
  // ... (similar logic to Shopify if needed) ...

  // --- RENDER LOGIC --- 
  return (
    <Card>
      <CardHeader>
        <CardTitle>WordPress Integration</CardTitle>
        <CardDescription>
          Connect your WordPress site to power your AI chatbot with your website content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Tabs defaultValue="connect" className="w-full">
          <TabsList>
            <TabsTrigger value="connect">Connect New Site</TabsTrigger>
            {wordpressStores.length > 0 && (
              <TabsTrigger value="manage">Manage Connected Sites</TabsTrigger>
            )}
          </TabsList>

          {/* Connect Tab */} 
          <TabsContent value="connect" className="mt-6">
            <div className="space-y-4 max-w-lg">
              <p className="text-sm text-gray-600">
                Enter your WordPress site details. You'll need to generate an "Application Password" 
                in your WordPress admin dashboard (Users {'>'} Profile {'>'} Application Passwords section).
              </p>
              
               <div>
                <Label htmlFor="wpDomain">WordPress Site URL (e.g., https://example.com)</Label>
                <Input
                  id="wpDomain"
                  value={wpDomain}
                  onChange={(e) => setWpDomain(e.target.value)}
                  placeholder="https://your-wordpress-site.com"
                />
              </div>
              
              <div>
                <Label htmlFor="wpUsername">WordPress Admin Username</Label>
                <Input
                  id="wpUsername"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  placeholder="your_wp_admin_username"
                />
              </div>

              <div>
                <Label htmlFor="wpPassword">Application Password</Label>
                <Input
                  id="wpPassword"
                  type="password"
                  value={wpPassword}
                  onChange={(e) => setWpPassword(e.target.value)}
                  placeholder="Enter generated Application Password"
                />
                 <p className="mt-1 text-xs text-gray-500">
                   Generate this in WP Admin {'>'} Users {'>'} Profile {'>'} Application Passwords.
                 </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="inline-flex items-center"
              >
                {connectMutation.isPending ? (
                  <><RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />Connecting...</>
                ) : (
                  <><LinkIcon className="-ml-1 mr-2 h-5 w-5" />Connect WordPress Site</>
                )}
              </Button>
             </div>
          </TabsContent>

 