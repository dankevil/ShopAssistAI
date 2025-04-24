import axios from 'axios';

interface ShopifyAuthParams {
  shop: string;
  apiKey: string;
  scopes: string;
  redirectUri: string;
  state?: string;
}

interface ShopifyTokenParams {
  shop: string;
  code: string;
  apiKey: string;
  apiSecret: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  processed_at: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
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
  shipping_lines: Array<{
    code: string;
    price: string;
    title: string;
    carrier_identifier: string | null;
  }>;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string;
  status: string;
  variants: Array<{
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: number;
    product_id: number;
    position: number;
    src: string;
    width: number;
    height: number;
  }>;
}

export interface ShopifyCollection {
  id: number;
  title: string;
  body_html: string | null;
  handle: string;
  products: ShopifyProduct[];
}

export interface ShopifyShop {
  id: number;
  name: string;
  email: string;
  domain: string;
  province: string;
  country: string;
  address1: string;
  zip: string;
  city: string;
  source: string | null;
  phone: string;
  primary_locale: string;
  currency: string;
  shop_owner: string;
}

// Generate the OAuth URL for Shopify authorization
export function generateAuthUrl(params: ShopifyAuthParams): string {
  const { shop, apiKey, scopes, redirectUri, state } = params;
  
  const queryParams = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state: state || '',
    'grant_options[]': 'per-user',
  });
  
  return `https://${shop}/admin/oauth/authorize?${queryParams.toString()}`;
}

// Exchange the OAuth code for an access token
export async function getAccessToken(params: ShopifyTokenParams): Promise<string> {
  const { shop, code, apiKey, apiSecret } = params;
  
  try {
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Shopify access token:', error);
    throw new Error('Failed to get access token from Shopify');
  }
}

// Get shop details
export async function getShopDetails(shop: string, accessToken: string): Promise<ShopifyShop> {
  try {
    const response = await axios.get(`https://${shop}/admin/api/2023-04/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });
    
    return response.data.shop;
  } catch (error) {
    console.error('Error getting shop details:', error);
    throw new Error('Failed to get shop details from Shopify');
  }
}

// Get order by ID or order number
export async function getOrder(
  shop: string, 
  accessToken: string, 
  identifier: string
): Promise<ShopifyOrder | null> {
  try {
    // Try to get by order number first
    const response = await axios.get(
      `https://${shop}/admin/api/2023-04/orders.json?name=${identifier}`, 
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    
    if (response.data.orders && response.data.orders.length > 0) {
      return response.data.orders[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving order:', error);
    throw new Error('Failed to get order from Shopify');
  }
}

// Get orders for a specific customer by email
export async function getOrdersByEmail(
  shop: string, 
  accessToken: string, 
  email: string
): Promise<ShopifyOrder[]> {
  try {
    const response = await axios.get(
      `https://${shop}/admin/api/2023-04/orders.json?email=${email}`, 
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    
    return response.data.orders || [];
  } catch (error) {
    console.error('Error retrieving orders by email:', error);
    throw new Error('Failed to get orders from Shopify');
  }
}

// Search products
export async function searchProducts(
  shop: string, 
  accessToken: string, 
  query: string
): Promise<ShopifyProduct[]> {
  try {
    const response = await axios.get(
      `https://${shop}/admin/api/2023-04/products.json?title=${encodeURIComponent(query)}`, 
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    
    return response.data.products || [];
  } catch (error) {
    console.error('Error searching products:', error);
    throw new Error('Failed to search products from Shopify');
  }
}

// Get product details by ID
export async function getProduct(
  shop: string, 
  accessToken: string, 
  productId: string
): Promise<ShopifyProduct> {
  try {
    const response = await axios.get(
      `https://${shop}/admin/api/2023-04/products/${productId}.json`, 
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    
    return response.data.product;
  } catch (error) {
    console.error('Error retrieving product:', error);
    throw new Error('Failed to get product from Shopify');
  }
}

// Get collections
export async function getCollections(
  shop: string, 
  accessToken: string
): Promise<ShopifyCollection[]> {
  try {
    const response = await axios.get(
      `https://${shop}/admin/api/2023-04/custom_collections.json`, 
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    
    return response.data.custom_collections || [];
  } catch (error) {
    console.error('Error retrieving collections:', error);
    throw new Error('Failed to get collections from Shopify');
  }
}
