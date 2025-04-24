import fetch from "node-fetch";

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  variants: any[];
  handle: string;
  product_url: string;
}

export interface ShopifyOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  fulfillment_status: string | null;
  financial_status: string;
  total_price: string;
  line_items: any[];
  shipping_address: any;
  shipping_lines: any[];
  tracking_numbers?: string[];
  estimated_delivery?: string | null;
}

export class ShopifyService {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string = "2023-07"; // Update to latest version as needed

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
  }

  private getBaseUrl(): string {
    return `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.accessToken,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error making Shopify API request to ${endpoint}:`, error);
      throw error;
    }
  }

  async getShopDetails(): Promise<any> {
    const response = await this.makeRequest('/shop.json');
    return response.shop;
  }

  async getProducts(limit: number = 10, page: number = 1): Promise<ShopifyProduct[]> {
    const response = await this.makeRequest(`/products.json?limit=${limit}&page=${page}`);
    
    return response.products.map((product: any) => {
      const price = product.variants && product.variants[0] ? product.variants[0].price : "N/A";
      const imageUrl = product.images && product.images[0] ? product.images[0].src : null;
      
      return {
        id: product.id,
        title: product.title,
        description: product.body_html,
        price,
        image_url: imageUrl,
        variants: product.variants,
        handle: product.handle,
        product_url: `https://${this.shopDomain}/products/${product.handle}`
      };
    });
  }

  async searchProducts(query: string, limit: number = 5): Promise<ShopifyProduct[]> {
    const response = await this.makeRequest(`/products.json?title=${encodeURIComponent(query)}&limit=${limit}`);
    
    return response.products.map((product: any) => {
      const price = product.variants && product.variants[0] ? product.variants[0].price : "N/A";
      const imageUrl = product.images && product.images[0] ? product.images[0].src : null;
      
      return {
        id: product.id,
        title: product.title,
        description: product.body_html,
        price,
        image_url: imageUrl,
        variants: product.variants,
        handle: product.handle,
        product_url: `https://${this.shopDomain}/products/${product.handle}`
      };
    });
  }

  async getOrderByIdAndEmail(orderId: string, email: string): Promise<ShopifyOrder | null> {
    try {
      // Search for orders by ID
      const response = await this.makeRequest(`/orders.json?name=${encodeURIComponent(orderId)}`);
      
      if (response.orders && response.orders.length > 0) {
        // Find the order with matching email
        const order = response.orders.find((o: any) => 
          o.contact_email && o.contact_email.toLowerCase() === email.toLowerCase()
        );
        
        if (order) {
          return this.formatOrderResponse(order);
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting order:", error);
      return null;
    }
  }
  
  async getOrderById(orderNumber: string): Promise<ShopifyOrder | null> {
    try {
      const response = await this.makeRequest(`/orders.json?name=${encodeURIComponent(orderNumber)}`);
      
      if (response.orders && response.orders.length > 0) {
        return this.formatOrderResponse(response.orders[0]);
      }
      
      return null;
    } catch (error) {
      console.error("Error getting order by ID:", error);
      return null;
    }
  }
  
  private formatOrderResponse(order: any): ShopifyOrder {
    // Extract tracking numbers from fulfillments
    const trackingNumbers: string[] = [];
    const fulfillments = order.fulfillments || [];
    
    fulfillments.forEach((fulfillment: any) => {
      if (fulfillment.tracking_number) {
        trackingNumbers.push(fulfillment.tracking_number);
      }
      if (fulfillment.tracking_numbers && fulfillment.tracking_numbers.length > 0) {
        trackingNumbers.push(...fulfillment.tracking_numbers);
      }
    });
    
    // Estimate delivery date (simplified version)
    let estimatedDelivery = null;
    if (order.fulfillment_status === 'fulfilled' && order.created_at) {
      const createdDate = new Date(order.created_at);
      createdDate.setDate(createdDate.getDate() + 7); // Simple estimate: 7 days from creation
      estimatedDelivery = createdDate.toISOString().split('T')[0];
    }
    
    return {
      id: order.id,
      order_number: order.name,
      created_at: order.created_at,
      status: order.status,
      fulfillment_status: order.fulfillment_status,
      financial_status: order.financial_status,
      total_price: order.total_price,
      line_items: order.line_items,
      shipping_address: order.shipping_address,
      shipping_lines: order.shipping_lines,
      tracking_numbers: trackingNumbers,
      estimated_delivery: estimatedDelivery
    };
  }
}

// Helper function to initialize OAuth
export async function initiateShopifyOAuth(shop: string, redirectUri: string, apiKey: string): Promise<string> {
  // Validate shop parameter format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    throw new Error("Invalid shop parameter format");
  }
  
  // Set permission scopes needed for the app
  const scopes = [
    'read_products',
    'read_orders',
    'read_customers'
  ].join(',');
  
  // Generate a random state value for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);
  
  // Build the authorization URL
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  return authUrl;
}

export async function getAccessToken(
  shop: string, 
  code: string, 
  apiKey: string, 
  apiSecret: string
): Promise<string> {
  const url = `https://${shop}/admin/oauth/access_token`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code: code,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Shopify access token:', error);
    throw error;
  }
}
