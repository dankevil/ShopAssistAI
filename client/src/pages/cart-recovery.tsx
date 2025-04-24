import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, 
  ShoppingCart, 
  Mail, 
  CheckCircle,
  Clock
} from "lucide-react";
import Spinner from "../components/ui/spinner";
// Add imports for dashboard layout
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getUser } from "@/lib/api";

type AbandonedCart = {
  id: number;
  storeId: number;
  shopifyCheckoutId: string;
  customerEmail: string | null;
  customerName: string | null;
  totalPrice: number | null;
  currency: string | null;
  cartItems: Array<{
    id: number;
    title: string;
    price: string;
    quantity: number;
    image?: string;
  }>;
  checkoutUrl: string | null;
  abandonedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type RecoveryAttempt = {
  id: number;
  cartId: number;
  status: string;
  messageContent: string | null;
  discountCodeOffered: string | null;
  discountAmount: string | null;
  sentAt: string | null;
  convertedAt: string | null;
  createdAt: string | null;
};

export default function CartRecovery() {
  const { toast } = useToast();
  const [storeId, setStoreId] = useState<number>(1); // Default store ID, replace with actual store selection
  const [selectedCart, setSelectedCart] = useState<number | null>(null);
  const [includeDiscount, setIncludeDiscount] = useState(false);
  const [timeFrame, setTimeFrame] = useState<string>("24");

  // Fetch abandoned carts
  const {
    data: abandonedCarts,
    isLoading: isLoadingCarts,
    isError: isCartsError,
    refetch: refetchCarts
  } = useQuery<AbandonedCart[]>({
    queryKey: ["/api/cart-recovery/abandoned-carts", storeId, timeFrame],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/cart-recovery/abandoned-carts/${storeId}?hours=${timeFrame}`
      );
      return await res.json();
    }
  });

  // Fetch recovery attempts
  const {
    data: recoveryAttempts,
    isLoading: isLoadingAttempts,
    isError: isAttemptsError,
    refetch: refetchAttempts
  } = useQuery<RecoveryAttempt[]>({
    queryKey: ["/api/cart-recovery/attempts", storeId, selectedCart],
    queryFn: async () => {
      const url = selectedCart 
        ? `/api/cart-recovery/attempts/${storeId}?cartId=${selectedCart}`
        : `/api/cart-recovery/attempts/${storeId}`;
      const res = await apiRequest("GET", url);
      return await res.json();
    }
  });

  // Sync carts with Shopify
  const syncCartsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cart-recovery/sync/${storeId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Carts Synced",
        description: "Abandoned carts have been synced with Shopify",
      });
      refetchCarts();
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Send recovery message
  const sendMessageMutation = useMutation({
    mutationFn: async (cartId: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/cart-recovery/send-message/${cartId}`,
        { includeDiscount }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Recovery Message Sent",
        description: "A recovery message has been sent for this cart",
      });
      refetchAttempts();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update attempt status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ attemptId, status }: { attemptId: number, status: string }) => {
      const res = await apiRequest(
        "PUT", 
        `/api/cart-recovery/attempts/${attemptId}/status`,
        { status }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The recovery attempt status has been updated",
      });
      refetchAttempts();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Format price with currency
  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  // Get cart by ID
  const getCartById = (cartId: number) => {
    return abandonedCarts?.find(cart => cart.id === cartId) || null;
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch(status) {
      case 'sent':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Sent</Badge>;
      case 'delivered':
        return <Badge><Mail className="h-3 w-3 mr-1" /> Delivered</Badge>;
      case 'clicked':
        return <Badge variant="secondary"><ShoppingCart className="h-3 w-3 mr-1" /> Clicked</Badge>;
      case 'converted':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Converted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getUser,
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar user={userData} />
      </div>
      
      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <DashboardHeader
          title="Cart Recovery"
          user={userData}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Cart Recovery</h1>
                  <p className="text-muted-foreground">
                    Recover abandoned carts and increase your sales
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={timeFrame}
                    onValueChange={setTimeFrame}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Time Frame" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">Last 24 Hours</SelectItem>
                      <SelectItem value="48">Last 48 Hours</SelectItem>
                      <SelectItem value="72">Last 72 Hours</SelectItem>
                      <SelectItem value="168">Last 7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => syncCartsMutation.mutate()} 
                    disabled={syncCartsMutation.isPending}
                  >
                    {syncCartsMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync Carts
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="abandoned-carts">
                <TabsList className="mb-4">
                  <TabsTrigger value="abandoned-carts">Abandoned Carts</TabsTrigger>
                  <TabsTrigger value="recovery-attempts">Recovery Attempts</TabsTrigger>
                </TabsList>
        
                <TabsContent value="abandoned-carts">
                  {isLoadingCarts ? (
                    <div className="flex justify-center items-center h-64">
                      <Spinner className="h-8 w-8" />
                    </div>
                  ) : isCartsError ? (
                    <div className="text-center text-destructive p-8">
                      Failed to load abandoned carts
                    </div>
                  ) : abandonedCarts?.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Abandoned Carts</h3>
                      <p className="text-muted-foreground mt-2">
                        There are no abandoned carts in the selected time frame.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {abandonedCarts?.map((cart) => (
                        <Card key={cart.id} className={`${selectedCart === cart.id ? 'ring-2 ring-primary' : ''}`}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  {cart.customerName || 'Anonymous Customer'}
                                </CardTitle>
                                <CardDescription>
                                  {cart.customerEmail || 'No email provided'}
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">
                                  {formatPrice(cart.totalPrice, cart.currency)}
                                </p>
                                <CardDescription>
                                  {new Date(cart.abandonedAt || cart.createdAt || '').toLocaleString()}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <h4 className="text-sm font-medium mb-2">Cart Items:</h4>
                            <ul className="space-y-2">
                              {cart.cartItems?.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                  <span>{item.title} × {item.quantity}</span>
                                  <span>{item.price}</span>
                                </li>
                              )) || <li className="text-muted-foreground">No items in cart</li>}
                            </ul>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2">
                            <Button 
                              variant="outline"
                              onClick={() => setSelectedCart(cart.id)}
                            >
                              View Details
                            </Button>
                            <Button
                              disabled={sendMessageMutation.isPending}
                              onClick={() => sendMessageMutation.mutate(cart.id)}
                            >
                              {sendMessageMutation.isPending ? (
                                <Spinner className="mr-2 h-4 w-4" />
                              ) : (
                                <Mail className="mr-2 h-4 w-4" />
                              )}
                              Send Recovery
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recovery-attempts">
                  <div className="mb-4 flex items-center space-x-2">
                    <Switch
                      id="offer-discount"
                      checked={includeDiscount}
                      onCheckedChange={setIncludeDiscount}
                    />
                    <Label htmlFor="offer-discount">Include discount code in recovery messages</Label>
                  </div>
                  
                  {isLoadingAttempts ? (
                    <div className="flex justify-center items-center h-64">
                      <Spinner className="h-8 w-8" />
                    </div>
                  ) : isAttemptsError ? (
                    <div className="text-center text-destructive p-8">
                      Failed to load recovery attempts
                    </div>
                  ) : recoveryAttempts?.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg">
                      <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Recovery Attempts</h3>
                      <p className="text-muted-foreground mt-2">
                        There are no recovery attempts for the selected cart.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recoveryAttempts?.map((attempt) => {
                        const cart = getCartById(attempt.cartId);
                        return (
                          <Card key={attempt.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    Recovery #{attempt.id} 
                                    <StatusBadge status={attempt.status} />
                                  </CardTitle>
                                  <CardDescription>
                                    Sent: {new Date(attempt.sentAt || attempt.createdAt || '').toLocaleString()}
                                  </CardDescription>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {cart?.customerName || 'Anonymous Customer'}
                                  </p>
                                  <CardDescription>
                                    {cart?.customerEmail || 'No email provided'}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="border rounded-md p-3 bg-muted/50">
                                <p className="text-sm italic">{attempt.messageContent}</p>
                              </div>
                              {attempt.discountCodeOffered && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="font-mono">
                                    {attempt.discountCodeOffered} ({attempt.discountAmount})
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="pt-2 justify-end">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={attempt.status === 'delivered' || updateStatusMutation.isPending}
                                  onClick={() => updateStatusMutation.mutate({ 
                                    attemptId: attempt.id, 
                                    status: 'delivered' 
                                  })}
                                >
                                  Mark Delivered
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={attempt.status === 'clicked' || updateStatusMutation.isPending}
                                  onClick={() => updateStatusMutation.mutate({ 
                                    attemptId: attempt.id, 
                                    status: 'clicked' 
                                  })}
                                >
                                  Mark Clicked
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={attempt.status === 'converted' || updateStatusMutation.isPending}
                                  onClick={() => updateStatusMutation.mutate({ 
                                    attemptId: attempt.id, 
                                    status: 'converted' 
                                  })}
                                >
                                  {updateStatusMutation.isPending ? (
                                    <Spinner className="h-4 w-4 mr-1" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Mark Converted
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
