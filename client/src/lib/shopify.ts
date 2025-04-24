import { apiRequest } from './queryClient';

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  variants: Array<{
    id: number;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    src: string;
  }>;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
  shipping_address: {
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
  };
}

// Connect a Shopify store
export const connectShopify = async (shop: string) => {
  if (!shop.includes('.')) {
    shop = `${shop}.myshopify.com`;
  }
  
  try {
    const response = await apiRequest('GET', `/api/shopify/auth?shop=${encodeURIComponent(shop)}`);
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error connecting to Shopify:', error);
    throw error;
  }
};

// Get all stores for the current user
export const getShopifyStores = async () => {
  try {
    const response = await apiRequest('GET', '/api/shopify/stores');
    const data = await response.json();
    return data.stores;
  } catch (error) {
    console.error('Error getting stores:', error);
    throw error;
  }
};

// Get order by order number
export const getOrderByNumber = async (storeId: number, orderNumber: string) => {
  try {
    const response = await apiRequest('GET', `/api/shopify/order?storeId=${storeId}&orderNumber=${encodeURIComponent(orderNumber)}`);
    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Get orders by customer email
export const getOrdersByEmail = async (storeId: number, email: string) => {
  try {
    const response = await apiRequest('GET', `/api/shopify/order?storeId=${storeId}&email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.orders;
  } catch (error) {
    console.error('Error getting orders by email:', error);
    throw error;
  }
};

// Search products
export const searchShopifyProducts = async (storeId: number, query: string) => {
  try {
    const response = await apiRequest('GET', `/api/shopify/products?storeId=${storeId}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Get AI-powered product recommendations
export const getProductRecommendations = async (storeId: number, query: string) => {
  try {
    const response = await apiRequest('GET', `/api/shopify/product-recommendations?storeId=${storeId}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return {
      recommendations: data.recommendations || [],
      query: data.query
    };
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    throw error;
  }
};
