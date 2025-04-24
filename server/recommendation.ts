import OpenAI from "openai";
import { type Message, type Conversation, conversations } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { searchProducts } from "./shopify";
import { ShopifyProduct } from "./shopify";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'missing-api-key'  
});

interface ProductWithScore {
  product: ShopifyProduct;
  score: number;
  matchReason: string;
}

interface CustomerPreference {
  category: string;
  score: number;
}

interface CustomerProfile {
  preferences: CustomerPreference[];
  priceRange?: { min: number; max: number };
  viewedProducts: number[];
  purchasedProducts: number[];
  seasonality?: string;
  engagementLevel: 'low' | 'medium' | 'high';
}

/**
 * Gets product recommendations using a collaborative filtering approach and advanced AI context analysis
 */
export async function getRecommendations(
  domain: string,
  accessToken: string,
  query: string,
  conversation: Conversation,
  messages: Message[],
  userProfile?: any, // Pass user profile data if available
  storeData?: any,
): Promise<ShopifyProduct[]> {
  try {
    // 1. First, get basic product matches based on query
    const initialProducts = await searchProducts(domain, accessToken, query);
    
    if (!initialProducts || initialProducts.length === 0) {
      return [];
    }
    
    // 2. Analyze conversation context for better recommendations
    const customerContext = await analyzeCustomerContext(messages);
    
    // 3. Build or retrieve customer profile/preferences
    let customerProfile = userProfile || await buildCustomerProfile(conversation, messages);
    
    // 4. Score products based on customer context and profile
    const scoredProducts = scoreProducts(initialProducts, customerContext, customerProfile);
    
    // 5. Apply business rules and personalization filters
    const filteredProducts = applyBusinessRules(scoredProducts, storeData);
    
    // 6. Return top recommendations
    return filteredProducts.slice(0, 3).map(item => item.product);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
}

/**
 * Analyzes message content to extract customer context
 */
async function analyzeCustomerContext(messages: Message[]): Promise<any> {
  try {
    // Extract user messages only
    const userMessages = messages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.content)
      .join('\n');
    
    if (!userMessages) {
      return { categories: [], priceRange: null, preferences: [] };
    }
    
    const prompt = `
    Analyze the following customer messages and extract key preferences for product recommendations:
    
    ${userMessages}
    
    Identify and extract:
    1. Product categories they seem interested in
    2. Price sensitivity (if any)
    3. Specific features or attributes they care about
    4. Style preferences
    5. Brands they've mentioned positively
    
    Return only a JSON object with these fields:
    {
      "categories": ["category1", "category2"],
      "priceRange": { "min": number or null, "max": number or null },
      "preferences": [
        { "feature": "feature name", "importance": number from 1-10 },
        { "style": "style description", "importance": number from 1-10 }
      ],
      "brands": ["brand1", "brand2"]
    }
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error analyzing customer context:", error);
    return { categories: [], priceRange: null, preferences: [] };
  }
}

/**
 * Builds a customer profile based on previous interactions
 */
async function buildCustomerProfile(conversation: Conversation, messages: Message[]): Promise<CustomerProfile> {
  // Start with a basic profile
  const profile: CustomerProfile = {
    preferences: [],
    viewedProducts: [],
    purchasedProducts: [],
    engagementLevel: 'low'
  };
  
  // Check if we have historical memory context
  if (conversation.memoryContext) {
    try {
      const memoryContext = conversation.memoryContext as any;
      
      // Extract previously viewed products if available
      if (memoryContext.viewedProducts && Array.isArray(memoryContext.viewedProducts)) {
        profile.viewedProducts = memoryContext.viewedProducts;
      }
      
      // Extract previously purchased products if available
      if (memoryContext.purchasedProducts && Array.isArray(memoryContext.purchasedProducts)) {
        profile.purchasedProducts = memoryContext.purchasedProducts;
      }
      
      // Extract preferences if available
      if (memoryContext.preferences && Array.isArray(memoryContext.preferences)) {
        profile.preferences = memoryContext.preferences;
      }
      
      // Determine engagement level based on conversation length
      if (messages.length > 15) {
        profile.engagementLevel = 'high';
      } else if (messages.length > 5) {
        profile.engagementLevel = 'medium';
      }
    } catch (error) {
      console.error("Error parsing memory context:", error);
    }
  }
  
  return profile;
}

/**
 * Scores products based on customer context and profile
 */
function scoreProducts(
  products: ShopifyProduct[],
  customerContext: any,
  customerProfile: CustomerProfile
): ProductWithScore[] {
  return products.map(product => {
    let score = 50; // Base score
    const matchReasons: string[] = [];
    
    // 1. Score based on product category matching customer preferences
    const productType = product.product_type?.toLowerCase() || '';
    const productTitle = product.title.toLowerCase();
    const productDescription = product.body_html?.toLowerCase() || '';
    
    // Check if product matches any preferred categories
    customerContext.categories?.forEach((category: string) => {
      const categoryLower = category.toLowerCase();
      if (
        productType.includes(categoryLower) || 
        productTitle.includes(categoryLower) ||
        productDescription.includes(categoryLower)
      ) {
        score += 15;
        matchReasons.push(`Matches preferred category: ${category}`);
      }
    });
    
    // 2. Score based on price range if specified
    if (customerContext.priceRange && product.variants && product.variants.length > 0) {
      const productPrice = parseFloat(product.variants[0].price);
      const { min, max } = customerContext.priceRange;
      
      if (min !== null && max !== null) {
        if (productPrice >= min && productPrice <= max) {
          score += 20;
          matchReasons.push(`Within preferred price range: $${min}-$${max}`);
        } else {
          score -= 10;
        }
      } else if (min !== null && productPrice >= min) {
        score += 10;
        matchReasons.push(`Above minimum price preference: $${min}`);
      } else if (max !== null && productPrice <= max) {
        score += 15;
        matchReasons.push(`Below maximum price preference: $${max}`);
      }
    }
    
    // 3. Score based on feature preferences
    customerContext.preferences?.forEach((pref: any) => {
      const featureLower = pref.feature?.toLowerCase() || pref.style?.toLowerCase() || '';
      const importance = pref.importance || 5;
      
      if (
        featureLower && 
        (productTitle.includes(featureLower) || 
         productDescription.includes(featureLower))
      ) {
        const points = Math.min(importance * 2, 20); // Cap at 20 points
        score += points;
        matchReasons.push(`Matches preferred feature: ${featureLower}`);
      }
    });
    
    // 4. Score based on brand preferences
    customerContext.brands?.forEach((brand: string) => {
      const brandLower = brand.toLowerCase();
      if (
        product.vendor?.toLowerCase().includes(brandLower) ||
        productTitle.includes(brandLower)
      ) {
        score += 20;
        matchReasons.push(`Matches preferred brand: ${brand}`);
      }
    });
    
    // 5. Score based on past customer behavior
    if (customerProfile.viewedProducts.includes(product.id)) {
      score += 5;
      matchReasons.push('Previously viewed by customer');
    }
    
    // Reduced score for previously purchased products (to encourage diversity)
    if (customerProfile.purchasedProducts.includes(product.id)) {
      score -= 15;
      matchReasons.push('Already purchased by customer');
    }
    
    return {
      product,
      score,
      matchReason: matchReasons.join(', ')
    };
  }).sort((a, b) => b.score - a.score); // Sort by score descending
}

/**
 * Apply business rules from store settings to recommendations
 */
function applyBusinessRules(scoredProducts: ProductWithScore[], storeData?: any): ProductWithScore[] {
  if (!storeData || !storeData.recommendationSettings) {
    return scoredProducts;
  }
  
  let filteredProducts = [...scoredProducts];
  const settings = storeData.recommendationSettings;
  
  // Apply promotion settings for featured products
  if (settings.featuredProducts && Array.isArray(settings.featuredProducts)) {
    // Boost score for featured products
    filteredProducts = filteredProducts.map(item => {
      const isFeatured = settings.featuredProducts.some(
        (featuredId: number) => featuredId === item.product.id
      );
      
      if (isFeatured) {
        return {
          ...item,
          score: item.score + 30,
          matchReason: item.matchReason + ', Featured product'
        };
      }
      
      return item;
    });
  }
  
  // Apply inventory rules
  if (settings.hideOutOfStock) {
    filteredProducts = filteredProducts.filter(item => {
      return item.product.variants.some(variant => variant.inventory_quantity > 0);
    });
  }
  
  // Re-sort after applying rules
  filteredProducts.sort((a, b) => b.score - a.score);
  
  return filteredProducts;
}

/**
 * Updates customer profile with new information
 */
export async function updateCustomerProfile(
  conversation: Conversation,
  productInteraction?: {
    productId: number;
    action: 'viewed' | 'purchased' | 'addedToCart';
  },
  preferences?: CustomerPreference[]
) {
  try {
    // Get existing memory context or create new one
    let memoryContext: any = conversation.memoryContext || {};
    
    // Update viewed products
    if (productInteraction && productInteraction.action === 'viewed') {
      const viewedProducts = memoryContext.viewedProducts || [];
      if (!viewedProducts.includes(productInteraction.productId)) {
        viewedProducts.push(productInteraction.productId);
      }
      memoryContext.viewedProducts = viewedProducts;
    }
    
    // Update purchased products
    if (productInteraction && productInteraction.action === 'purchased') {
      const purchasedProducts = memoryContext.purchasedProducts || [];
      if (!purchasedProducts.includes(productInteraction.productId)) {
        purchasedProducts.push(productInteraction.productId);
      }
      memoryContext.purchasedProducts = purchasedProducts;
    }
    
    // Update preferences
    if (preferences && preferences.length > 0) {
      memoryContext.preferences = preferences;
    }
    
    // Update the conversation in the database with typed access
    await db.update(conversations)
      .set({ memoryContext })
      .where(eq(conversations.id, conversation.id));
      
    return true;
  } catch (error) {
    console.error("Error updating customer profile:", error);
    return false;
  }
}