import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { getShopifyStores } from '@/lib/shopify';
import { useToast } from '@/hooks/use-toast';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ProductRecommendations as ProductRecommendationsComponent } from '@/components/dashboard/ProductRecommendations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Store {
  id: number;
  name: string;
  domain: string;
}

export default function ProductRecommendationsPage() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storeData = await getShopifyStores();
        setStores(storeData);

        if (storeData.length > 0) {
          // Automatically select first store
          setSelectedStoreId(storeData[0].id);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Shopify stores. Please check your connection.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [toast]);

  const handleStoreChange = (value: string) => {
    setSelectedStoreId(parseInt(value));
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (stores.length === 0) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <h2 className="text-2xl font-bold mb-4">No Stores Connected</h2>
          <p className="mb-6 text-gray-500 max-w-lg">
            You need to connect a Shopify store before you can use AI-powered product recommendations.
          </p>
          <button
            className="bg-primary text-white px-6 py-2 rounded-md hover:opacity-90"
            onClick={() => setLocation('/shopify')}
          >
            Connect a Shopify Store
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          AI-Powered Product Recommendations
        </h1>
        <p className="text-gray-500">
          Leverage AI to recommend the most relevant products to your customers based on natural language queries.
        </p>
      </div>

      {stores.length > 1 && (
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Select Store</label>
          <div className="max-w-xs">
            <Select value={selectedStoreId?.toString()} onValueChange={handleStoreChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {selectedStoreId && (
        <ProductRecommendationsComponent storeId={selectedStoreId} />
      )}
    </DashboardShell>
  );
}