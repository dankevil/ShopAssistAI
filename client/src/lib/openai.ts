import { apiRequest } from './queryClient';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ProductInfo = {
  id: number;
  title: string;
  description?: string;
  price: string;
  image?: string;
  stockStatus?: string;
  url?: string;
  variants?: Array<{
    id: number;
    title: string;
    price: string;
    inventory_quantity: number;
  }>;
};

export type ConversationResponse = {
  conversationId?: number;
  botResponse: string;
  botMessageId?: number;
  products?: ProductInfo[];
  intent?: {
    type: string;
    confidence: number;
    productQuery?: string;
    orderQuery?: string;
    specificProduct?: number;
  };
  orderInfo?: any;
};

// Function to send a conversation to the bot (via backend)
export const sendConversation = async (
  conversationId: number | 'new',
  storeId: number,
  message: string,
  customData?: any
): Promise<ConversationResponse> => {
  try {
    const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
      storeId,
      content: message,
      sender: 'user',
      customData
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Function to search products in the store
export const searchProducts = async (
  storeId: number,
  query: string
): Promise<ProductInfo[]> => {
  try {
    const response = await apiRequest('GET', `/api/shopify/products?storeId=${storeId}&query=${encodeURIComponent(query)}`);
    return await response.json();
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Function to get product recommendations
export const getProductRecommendations = async (
  storeId: number,
  productId: number
): Promise<ProductInfo[]> => {
  try {
    const response = await apiRequest('GET', `/api/shopify/product-recommendations?storeId=${storeId}&productId=${productId}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    return [];
  }
};

// Mock function to get FAQ matches (actual matching happens server-side)
export const getTopFAQMatches = async (message: string, faqs: any[]) => {
  // In a real implementation, this would call the backend API
  // to use AI to match the message against FAQs
  return faqs.filter(faq => 
    faq.question.toLowerCase().includes(message.toLowerCase()) || 
    message.toLowerCase().includes(faq.question.toLowerCase())
  ).slice(0, 3);
};
