import { apiRequest } from './queryClient';
import { queryClient } from './queryClient';
import { connectWordPress, syncWordPressData } from './wordpress';

// Auth API
export const login = async (username: string, password: string) => {
  const response = await apiRequest('POST', '/api/auth/login', { username, password });
  return response.json();
};

export const register = async (username: string, password: string, email: string) => {
  const response = await apiRequest('POST', '/api/auth/register', { username, password, email });
  return response.json();
};

export const logout = async () => {
  const response = await apiRequest('POST', '/api/auth/logout');
  return response.json();
};

export const getUser = async () => {
  const response = await apiRequest('GET', '/api/auth/me');
  return response.json();
};

// Shopify API
export const getShopifyAuthUrl = async (shop: string) => {
  const response = await apiRequest('GET', `/api/shopify/auth?shop=${encodeURIComponent(shop)}`);
  return response.json();
};

export const getStores = async () => {
  const response = await apiRequest('GET', '/api/stores');
  const data = await response.json();
  return data;
};

export const getOrderInfo = async (storeId: number, orderNumber?: string, email?: string) => {
  let url = `/api/shopify/order?storeId=${storeId}`;
  
  if (orderNumber) {
    url += `&orderNumber=${encodeURIComponent(orderNumber)}`;
  }
  
  if (email) {
    url += `&email=${encodeURIComponent(email)}`;
  }
  
  const response = await apiRequest('GET', url);
  return response.json();
};

export const searchProducts = async (storeId: number, query: string) => {
  const response = await apiRequest('GET', `/api/shopify/products?storeId=${storeId}&query=${encodeURIComponent(query)}`);
  return response.json();
};

// FAQ Category API
export const getFAQCategories = async (storeId: number) => {
  const response = await apiRequest('GET', `/api/faq-categories?storeId=${storeId}`);
  return response.json();
};

export const createFAQCategory = async (storeId: number, name: string, description?: string, sortOrder?: number) => {
  const response = await apiRequest('POST', '/api/faq-categories', { 
    storeId, 
    name, 
    description,
    sortOrder 
  });
  return response.json();
};

export const updateFAQCategory = async (id: number, data: { name?: string; description?: string; sortOrder?: number }) => {
  const response = await apiRequest('PATCH', `/api/faq-categories/${id}`, data);
  return response.json();
};

export const deleteFAQCategory = async (id: number) => {
  await apiRequest('DELETE', `/api/faq-categories/${id}`);
  return true;
};

// FAQ API
export const getFAQs = async (storeId: number, categoryId?: number) => {
  let url = `/api/faqs?storeId=${storeId}`;
  if (categoryId) {
    url += `&categoryId=${categoryId}`;
  }
  const response = await apiRequest('GET', url);
  return response.json();
};

export const createFAQ = async (storeId: number, question: string, answer: string, categoryId?: number, sortOrder?: number) => {
  const response = await apiRequest('POST', '/api/faqs', { 
    storeId, 
    question, 
    answer,
    categoryId,
    sortOrder,
    isActive: true 
  });
  return response.json();
};

export const updateFAQ = async (id: number, data: { 
  question?: string; 
  answer?: string; 
  isActive?: boolean;
  categoryId?: number;
  sortOrder?: number;
}) => {
  const response = await apiRequest('PATCH', `/api/faqs/${id}`, data);
  return response.json();
};

export const updateFAQSortOrder = async (id: number, sortOrder: number) => {
  const response = await apiRequest('PATCH', `/api/faqs/${id}`, { sortOrder });
  return response.json();
};

export const deleteFAQ = async (id: number) => {
  await apiRequest('DELETE', `/api/faqs/${id}`);
  return true;
};

// Conversation API
export const getConversations = async (storeId: number) => {
  const response = await apiRequest('GET', `/api/conversations?storeId=${storeId}`);
  return response.json();
};

export const createConversation = async (storeId: number, customerEmail?: string, customerName?: string) => {
  const response = await apiRequest('POST', '/api/conversations', { 
    storeId, 
    customerEmail, 
    customerName,
    status: 'open'
  });
  return response.json();
};

export const updateConversationStatus = async (id: number, status: string) => {
  const response = await apiRequest('PATCH', `/api/conversations/${id}/status`, { status });
  return response.json();
};

export const getMessages = async (conversationId: number) => {
  const response = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
  return response.json();
};

export const sendMessage = async (conversationId: number | 'new', storeId: number, content: string, sender: 'user' | 'bot', customData?: any) => {
  const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
    storeId,
    content,
    sender,
    customData
  });
  return response.json();
};

// Settings API
export const getSettings = async (storeId: number | null) => {
  if (!storeId) {
    console.warn('getSettings called with null storeId');
    return null;
  }
  const response = await apiRequest('GET', `/api/settings?storeId=${storeId}`);
  return response.json();
};

export const updateSettings = async (settingsId: number | undefined | null, data: any) => {
  if (!settingsId) {
    console.error('updateSettings requires a valid settingsId');
    throw new Error('Settings ID is required to update settings.');
  }
  const response = await apiRequest('PATCH', `/api/settings/${settingsId}`, data);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update settings');
  }
  const updatedSettings = await response.json();
  queryClient.invalidateQueries({ queryKey: [`/api/settings/${updatedSettings.storeId}`] });
  return updatedSettings;
};

// Widget API
export const getWidgetCode = async (storeId: number) => {
  const response = await apiRequest('GET', `/api/widget/code/${storeId}`);
  return response.json();
};

// Export the new WordPress functions
export { connectWordPress, syncWordPressData };
