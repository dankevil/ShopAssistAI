import { useState } from 'react';
import { getProductRecommendations } from '@/lib/shopify';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductRecommendationsProps {
  storeId: number;
}

interface Product {
  id: number;
  title: string;
  description?: string;
  body_html?: string;
  price?: string;
  variants?: Array<{
    price: string;
    inventory_quantity: number;
  }>;
  images?: Array<{
    src: string;
  }>;
}

export function ProductRecommendations({ storeId }: ProductRecommendationsProps) {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a query to get product recommendations',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await getProductRecommendations(storeId, query);
      setRecommendations(result.recommendations);

      if (result.recommendations.length === 0) {
        toast({
          title: 'No recommendations found',
          description: 'Try a different query or check if there are products in your store.',
        });
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to get product recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Extract description from body_html
  const getDescription = (product: Product) => {
    const description = product.description || 
      (product.body_html ? product.body_html.replace(/<[^>]*>?/gm, "") : "");
    return description.length > 150 ? description.substring(0, 150) + '...' : description;
  };

  // Get price from product
  const getPrice = (product: Product) => {
    if (product.price) return product.price;
    if (product.variants && product.variants.length > 0) return product.variants[0].price;
    return 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Product Recommendations</CardTitle>
        <CardDescription>
          Get intelligent product recommendations based on customer queries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-6">
          <Input
            placeholder="E.g., 'recommend lightweight summer t-shirts' or 'best accessories for hiking'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Find Products
              </>
            )}
          </Button>
        </div>

        {hasSearched && (
          <div className="border rounded-md">
            {recommendations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell className="max-w-xs">{getDescription(product)}</TableCell>
                      <TableCell>${getPrice(product)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                No recommendations found for this query. Try a different search term.
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p>
          AI recommendations are powered by OpenAI's GPT-4o. Results are based on your product catalog.
        </p>
      </CardFooter>
    </Card>
  );
}