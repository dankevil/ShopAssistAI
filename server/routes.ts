import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertStoreSchema, insertFaqSchema, insertFaqCategorySchema, insertConversationSchema, insertMessageSchema, insertMessageFeedbackSchema, insertSettingsSchema, insertCustomerProfileSchema, InsertAbandonedCart, platformEnum } from "@shared/schema";
import { generateAuthUrl, getAccessToken, getShopDetails, getOrder, getOrdersByEmail, searchProducts } from "./shopify";
import { generateChatResponse, matchFAQIntent, analyzeConversationIntent, type ChatMessage } from "./openai";
import { generateWidgetCode, generateWidgetJsContent } from "./widget";
import OpenAI from "openai";
import { config } from "./config";
import { pool } from "./db";
import { verifyFirebaseToken } from "./firebase-admin";
import {
  getAllSubscriptionPlans,
  getSubscriptionPlanByName,
  createSubscriptionCheckout,
  handleStripeWebhook,
  cancelSubscription,
  trackInteraction,
  getUserUsageStats,
  isStripeAvailable
} from "./stripe";
// Import session type extensions
import "./types";
// Import WordPress Service
import { WordPressService } from "./lib/wordpress";

// Set up appropriate session store based on environment
const MemorySessionStore = MemoryStore(session);
const PgSessionStore = connectPgSimple(session);

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Health check endpoint for production monitoring
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      version: process.env.npm_package_version || "1.0.0",
      environment: config.environment,
      uptime: Math.floor(process.uptime())
    });
  });
  
  // Set up session middleware with production-ready configuration  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'supersecretkey', // Use environment variable
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: config.isProduction, 
        maxAge: config.security.sessionMaxAge,
        httpOnly: true,
        sameSite: 'lax'
      },
      store: config.isProduction 
        ? new PgSessionStore({
            pool,
            createTableIfMissing: true,
            tableName: 'session',
            pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 min
          })
        : new MemorySessionStore({
            checkPeriod: config.security.sessionMaxAge
          })
    })
  );

  // API routes
  // --- Auth routes ---
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create the user
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      // Set user in session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/firebase-login", async (req: Request, res: Response) => {
    try {
      const { token, email, displayName } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Firebase token is required" });
      }
      
      // Verify the Firebase token
      const decodedToken = await verifyFirebaseToken(token);
      
      if (!decodedToken.email) {
        return res.status(400).json({ message: "Email is required in the Firebase token" });
      }
      
      // Check if user exists by email
      let user = await storage.getUserByEmail(decodedToken.email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          username: displayName || decodedToken.email.split('@')[0],
          email: decodedToken.email,
          password: Math.random().toString(36).slice(2, 15), // Generate random password
          role: 'user'
        });
      } else {
        // User already exists, just log in
        console.log("Firebase user already exists, logging in");
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Firebase login error:", error);
      res.status(401).json({ message: "Invalid Firebase token" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // --- Shopify integration routes ---
  app.get("/api/shopify/auth", requireAuth, async (req: Request, res: Response) => {
    try {
      const { shop } = req.query;
      
      if (!shop || typeof shop !== "string") {
        return res.status(400).json({ message: "Shop parameter is required" });
      }
      
      // Get API key from environment or use the known value
      const apiKey = process.env.SHOPIFY_API_KEY || "4f4e69320e3a44a14cde67a64e179b02";
      console.log("Using Shopify API Key:", apiKey);
      
      if (!apiKey) {
        return res.status(500).json({ message: "Shopify API key not configured" });
      }
      
      // Generate a secure state to prevent CSRF
      const state = Math.random().toString(36).substring(2, 15);
      req.session.shopifyState = state;
      req.session.shopifyShop = shop;
      
      const authUrl = generateAuthUrl({
        shop,
        apiKey: apiKey,
        scopes: "read_orders,read_products,read_customers",
        redirectUri: `${req.protocol}://${req.get("host")}/api/shopify/callback`,
        state
      });
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Shopify auth error:", error);
      res.status(500).json({ message: "Error generating auth URL" });
    }
  });

  app.get("/api/shopify/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, shop } = req.query;
      
      if (!code || !state || !shop || 
          typeof code !== "string" || 
          typeof state !== "string" || 
          typeof shop !== "string") {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Validate state to prevent CSRF
      if (state !== req.session.shopifyState) {
        return res.status(403).json({ message: "Invalid state parameter" });
      }
      
      // Validate shop matches the one in session
      if (shop !== req.session.shopifyShop) {
        return res.status(403).json({ message: "Shop mismatch" });
      }
      
      // Get API credentials from environment or use known values
      const apiKey = process.env.SHOPIFY_API_KEY || "4f4e69320e3a44a14cde67a64e179b02";
      const apiSecret = process.env.SHOPIFY_API_SECRET || "8e729d3fa09a75fa8761842e4e7236ec";
      console.log("Using Shopify API Key for callback:", apiKey);
      
      if (!apiKey || !apiSecret) {
        return res.status(500).json({ message: "Shopify API credentials not configured" });
      }
      
      // Get user ID from session
      const userId = req.session.userId;
      if (!userId) {
        // Redirect to login or show error if no user in session during callback
        return res.redirect("/login?error=session_expired");
      }
      
      // Exchange code for access token
      const accessToken = await getAccessToken({
        shop,
        code,
        apiKey: apiKey,
        apiSecret: apiSecret
      });
      
      // Get shop details
      const shopDetails = await getShopDetails(shop, accessToken);
      
      // Save the store in the database
      const store = await storage.createStore({
        userId,
        platform: 'shopify', // Explicitly set platform
        name: shopDetails.name,
        domain: shop,
        // Store credentials correctly
        credentials: { accessToken }, 
        isActive: true
      });
      
      // Create default settings for the store
      await storage.createSettings({
        storeId: store.id,
        brandColor: "#4F46E5",
        chatTitle: "Chat with us",
        welcomeMessage: `Hello! Welcome to ${shopDetails.name}. How can I help you today?`,
        buttonPosition: "right",
        apiKeys: { openaiKey: process.env.OPENAI_API_KEY || "" }
      });
      
      // Clean up session data
      delete req.session.shopifyState;
      delete req.session.shopifyShop;
      
      // Redirect to the frontend dashboard with success parameter
      // Redirect to integrations page or dashboard
      res.redirect(`/dashboard/integrations?store_connected=shopify&store_id=${store.id}`);
    } catch (error) {
      console.error("Shopify callback error:", error);
      // Redirect to an error page or show message
      res.redirect("/dashboard/integrations?error=shopify_callback_failed");
    }
  });

  app.get("/api/shopify/stores", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const stores = await storage.getStoresByUserId(userId);
      res.json({ stores });
    } catch (error) {
      res.status(500).json({ message: "Error fetching stores" });
    }
  });

  app.get("/api/shopify/order", async (req: Request, res: Response) => {
    try {
      const { storeId, orderNumber, email } = req.query;
      
      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      if (!orderNumber && !email) {
        return res.status(400).json({ message: "Order number or email is required" });
      }
      
      // Get the store
      const store = await storage.getStore(parseInt(storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      if (orderNumber && typeof orderNumber === "string") {
        // Lookup by order number
        const order = await getOrder(store.domain, store.accessToken, orderNumber);
        
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        
        return res.json({ order });
      } else if (email && typeof email === "string") {
        // Lookup by email
        const orders = await getOrdersByEmail(store.domain, store.accessToken, email);
        
        if (!orders || orders.length === 0) {
          return res.status(404).json({ message: "No orders found for this email" });
        }
        
        return res.json({ orders });
      }
      
      res.status(400).json({ message: "Invalid request" });
    } catch (error) {
      console.error("Order lookup error:", error);
      res.status(500).json({ message: "Error looking up order" });
    }
  });

  app.get("/api/shopify/products", async (req: Request, res: Response) => {
    try {
      const { storeId, query } = req.query;
      
      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Get the store
      const store = await storage.getStore(parseInt(storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Search products
      const products = await searchProducts(store.domain, store.accessToken, query);
      
      // Transform products into a format suitable for the frontend
      const formattedProducts = products.map(product => {
        // Get the first variant for price
        const variant = product.variants && product.variants.length > 0 
          ? product.variants[0] 
          : { price: '0.00', inventory_quantity: 0 };
        
        // Get the first image
        const image = product.images && product.images.length > 0 
          ? product.images[0].src 
          : null;
        
        // Clean the HTML from description
        const description = product.body_html
          ? product.body_html.replace(/<[^>]*>?/gm, '')
          : '';
          
        return {
          id: product.id,
          title: product.title,
          description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
          price: variant.price,
          image: image,
          stockStatus: variant.inventory_quantity > 0 ? 'In stock' : 'Out of stock',
          url: `https://${store.domain}/products/${product.handle}`,
          variants: product.variants,
        };
      });
      
      res.json(formattedProducts);
    } catch (error) {
      console.error("Product search error:", error);
      res.status(500).json({ message: "Error searching products" });
    }
  });
  
  app.get("/api/shopify/product-recommendations", async (req: Request, res: Response) => {
    try {
      const { storeId, query } = req.query;
      
      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Query is required" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      // Get the store
      const store = await storage.getStore(parseInt(storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // First get all products
      const allProducts = await searchProducts(store.domain, store.accessToken, "");
      
      if (!allProducts || allProducts.length === 0) {
        return res.json({ recommendations: [] });
      }
      
      // Initialize OpenAI API
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Format products for the OpenAI API
      const productDescriptions = allProducts.map((p, i) => 
        `${i + 1}. ${p.title}: ${p.body_html?.replace(/<[^>]*>?/gm, "") || ""} (Price: $${p.variants?.[0]?.price || "N/A"})`
      ).join("\n");
      
      // Get AI recommendations
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a product recommendation assistant. Based on the customer query, recommend the most relevant products from the list. Respond with a JSON array of product indices (starting from 0) in the recommendations field."
          },
          {
            role: "user",
            content: `Customer query: "${query}"\n\nAvailable products:\n${productDescriptions}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        return res.json({ recommendations: [] });
      }
      
      // Parse the response
      const parsed = JSON.parse(content);
      const recommendedIndices = parsed.recommendations || [];
      
      // Return the recommended products
      const recommendedProducts = recommendedIndices
        .filter((index: number) => index >= 0 && index < allProducts.length)
        .map((index: number) => {
          const product = allProducts[index];
          
          // Format product like the products endpoint
          const variant = product.variants && product.variants.length > 0 
            ? product.variants[0] 
            : { price: '0.00', inventory_quantity: 0 };
          
          const image = product.images && product.images.length > 0 
            ? product.images[0].src 
            : null;
          
          const description = product.body_html
            ? product.body_html.replace(/<[^>]*>?/gm, '')
            : '';
            
          return {
            id: product.id,
            title: product.title,
            description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
            price: variant.price,
            image: image,
            stockStatus: variant.inventory_quantity > 0 ? 'In stock' : 'Out of stock',
            url: `https://${store.domain}/products/${product.handle}`,
            variants: product.variants,
          };
        });
      
      res.json(recommendedProducts);
    } catch (error) {
      console.error("Product recommendation error:", error);
      res.status(500).json({ message: "Error generating product recommendations" });
    }
  });

  // --- FAQ Category routes ---
  app.get("/api/faq-categories", async (req: Request, res: Response) => {
    try {
      const { storeId } = req.query;
      
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      // Handle the case where storeId might be an object
      let storeIdValue: number;
      
      if (typeof storeId === "string") {
        storeIdValue = parseInt(storeId);
      } else if (typeof storeId === "object" && storeId !== null) {
        // If it's an object, try to extract a numeric ID property
        const id = storeId.id || storeId.storeId;
        if (id && !isNaN(Number(id))) {
          storeIdValue = Number(id);
        } else {
          return res.status(400).json({ message: "Invalid Store ID format" });
        }
      } else {
        return res.status(400).json({ message: "Invalid Store ID format" });
      }
      
      // Check if the parsed storeId is a valid number
      if (isNaN(storeIdValue)) {
        return res.status(400).json({ message: "Store ID must be a number" });
      }
      
      const categories = await storage.getFaqCategoriesByStoreId(storeIdValue);
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: "Error fetching FAQ categories" });
    }
  });

  app.post("/api/faq-categories", async (req: Request, res: Response) => {
    try {
      const categoryData = insertFaqCategorySchema.parse(req.body);
      
      // Verify the store exists
      const store = await storage.getStore(categoryData.storeId);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Create the category
      const category = await storage.createFaqCategory(categoryData);
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating FAQ category" });
    }
  });

  app.patch("/api/faq-categories/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getFaqCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "FAQ category not found" });
      }
      
      const updatedCategory = await storage.updateFaqCategory(categoryId, req.body);
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Error updating FAQ category" });
    }
  });

  app.delete("/api/faq-categories/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getFaqCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "FAQ category not found" });
      }
      
      await storage.deleteFaqCategory(categoryId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting FAQ category" });
    }
  });

  // --- FAQ routes ---
  app.get("/api/faqs", async (req: Request, res: Response) => {
    try {
      const { storeId, categoryId, timePeriod = '7days' } = req.query;
      
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      // Handle the case where storeId might be an object
      let storeIdValue: number;
      
      if (typeof storeId === "string") {
        storeIdValue = parseInt(storeId);
      } else if (typeof storeId === "object" && storeId !== null) {
        // If it's an object, try to extract a numeric ID property
        const id = storeId.id || storeId.storeId;
        if (id && !isNaN(Number(id))) {
          storeIdValue = Number(id);
        } else {
          return res.status(400).json({ message: "Invalid Store ID format" });
        }
      } else {
        return res.status(400).json({ message: "Invalid Store ID format" });
      }
      
      // Check if the parsed storeId is a valid number
      if (isNaN(storeIdValue)) {
        return res.status(400).json({ message: "Store ID must be a number" });
      }
      
      // Calculate date range based on time period
      const endDate = new Date();
      let startDate = new Date();
      
      if (typeof timePeriod === 'string') {
        switch (timePeriod) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(endDate.getDate() - 7); // Default to 7 days
        }
      }
      
      // If categoryId is provided, get FAQs for that category
      let faqs;
      if (categoryId) {
        const categoryIdValue = parseInt(categoryId as string);
        
        if (isNaN(categoryIdValue)) {
          return res.status(400).json({ message: "Category ID must be a number" });
        }
        
        faqs = await storage.getFaqsByCategoryId(categoryIdValue);
      } else {
        // Otherwise, get all FAQs for the store
        faqs = await storage.getFaqsByStoreId(storeIdValue);
      }
      
      // Add view count data based on time period
      // In a real implementation, this would fetch real view counts from database
      // Here we simulate it by adding a random but consistent count
      const processedFaqs = faqs.map(faq => {
        // Use faq ID as seed for consistent but varied numbers
        const seed = faq.id * 10;
        let viewCount = 0;
        
        // Longer time periods have higher view counts
        if (timePeriod === '7days') {
          viewCount = seed % 100 + 5;
        } else if (timePeriod === '30days') {
          viewCount = (seed % 100) * 3 + 15;
        } else if (timePeriod === '90days') {
          viewCount = (seed % 100) * 7 + 45;
        } else if (timePeriod === 'year') {
          viewCount = (seed % 100) * 20 + 120;
        }
        
        return {
          ...faq,
          viewCount
        };
      });
      
      res.json({ faqs: processedFaqs });
    } catch (error) {
      res.status(500).json({ message: "Error fetching FAQs" });
    }
  });

  app.post("/api/faqs", async (req: Request, res: Response) => {
    try {
      const faqData = insertFaqSchema.parse(req.body);
      
      // Verify the store exists
      const store = await storage.getStore(faqData.storeId);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Create the FAQ
      const faq = await storage.createFaq(faqData);
      
      res.status(201).json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating FAQ" });
    }
  });

  app.patch("/api/faqs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate at least one field is provided
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "At least one field is required" });
      }
      
      // Get the existing FAQ
      const faq = await storage.getFaq(parseInt(id));
      
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      
      // Update the FAQ
      const updatedFaq = await storage.updateFaq(parseInt(id), req.body);
      
      res.json(updatedFaq);
    } catch (error) {
      res.status(500).json({ message: "Error updating FAQ" });
    }
  });

  app.delete("/api/faqs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Delete the FAQ
      const result = await storage.deleteFaq(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting FAQ" });
    }
  });

  // --- Conversation and message routes ---
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { storeId, timePeriod = '7days' } = req.query;
      
      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      // Calculate date range based on time period
      const endDate = new Date();
      let startDate = new Date();
      
      if (typeof timePeriod === 'string') {
        switch (timePeriod) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(endDate.getDate() - 7); // Default to 7 days
        }
      }
      
      // Get all conversations for the store
      const allConversations = await storage.getConversationsByStoreId(parseInt(storeId));
      
      // Filter conversations by date range
      const conversations = allConversations.filter(conv => {
        const convDate = new Date(conv.createdAt);
        return convDate >= startDate && convDate <= endDate;
      });
      
      res.json({ conversations });
    } catch (error) {
      res.status(500).json({ message: "Error fetching conversations" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      
      // Verify the store exists
      const store = await storage.getStore(conversationData.storeId);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Look up or create customer profile if visitor ID or customer info is provided
      let customerProfileId = conversationData.customerProfileId || null;
      
      if (!customerProfileId && (conversationData.visitorId || conversationData.customerEmail)) {
        let profile;
        
        // Try to find existing profile by visitor ID
        if (conversationData.visitorId) {
          profile = await storage.getCustomerProfileByVisitorId(
            conversationData.storeId,
            conversationData.visitorId
          );
        }
        
        // If no profile found and customer email exists, try by email as identifier
        if (!profile && conversationData.customerEmail) {
          profile = await storage.getCustomerProfileByIdentifier(
            conversationData.storeId,
            conversationData.customerEmail
          );
        }
        
        // If no existing profile found, create a new one
        if (!profile) {
          const identifier = conversationData.customerEmail || 
                             conversationData.visitorId || 
                             `visitor-${Date.now()}`;
          
          profile = await storage.createCustomerProfile({
            storeId: conversationData.storeId,
            identifier: identifier,
            email: conversationData.customerEmail || null,
            name: conversationData.customerName || null,
            visitorId: conversationData.visitorId || null,
            firstSeen: new Date(),
            lastSeen: new Date()
          });
        } else {
          // Update last seen time
          await storage.updateCustomerProfile(profile.id, {
            lastSeen: new Date(),
            // Update name if provided and not already set
            ...(conversationData.customerName && !profile.name ? { name: conversationData.customerName } : {})
          });
        }
        
        // Set the profile ID for the conversation
        customerProfileId = profile.id;
      }
      
      // Create the conversation with customer profile ID if available
      const conversation = await storage.createConversation({
        ...conversationData,
        customerProfileId
      });
      
      // If we have a customer profile, increment their conversation count
      if (customerProfileId) {
        const profile = await storage.getCustomerProfile(customerProfileId);
        if (profile) {
          const currentCount = profile.conversationCount || 0;
          await storage.updateCustomerProfile(customerProfileId, {
            conversationCount: currentCount + 1
          });
        }
      }
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating conversation" });
    }
  });

  app.patch("/api/conversations/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Update the conversation status
      const conversation = await storage.updateConversationStatus(parseInt(id), status);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Error updating conversation status" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get the messages
      const messages = await storage.getMessagesByConversationId(parseInt(id));
      res.json({ messages });
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Handle both scenarios - new conversation and existing conversation
      const conversationId = id === "new" ? undefined : parseInt(id);
      
      // Extract and validate message data
      const { storeId, content, sender, customData } = req.body;
      
      if (!storeId || !content || !sender) {
        return res.status(400).json({ message: "Store ID, content, and sender are required" });
      }
      
      const store = await storage.getStore(parseInt(storeId));
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      let conversation;
      
      // If no conversation ID, create a new conversation
      if (!conversationId) {
        const visitorId = customData?.visitorId;
        
        // Check for existing or create customer profile
        let customerProfileId = null;
        
        // If we have identifying information, try to link to a customer profile
        if (customData?.email || visitorId) {
          let profile;
          
          // Try to find existing profile by visitor ID first
          if (visitorId) {
            profile = await storage.getCustomerProfileByVisitorId(
              parseInt(storeId),
              visitorId
            );
          }
          
          // If no profile found by visitor ID and we have an email, try by email
          if (!profile && customData?.email) {
            profile = await storage.getCustomerProfileByIdentifier(
              parseInt(storeId),
              customData.email
            );
          }
          
          // If still no profile found, create a new one
          if (!profile) {
            const identifier = customData?.email || 
                              visitorId || 
                              `visitor-${Date.now()}`;
            
            profile = await storage.createCustomerProfile({
              storeId: parseInt(storeId),
              identifier: identifier,
              email: customData?.email || null,
              name: customData?.name || null,
              visitorId: visitorId || null,
              firstSeen: new Date(),
              lastSeen: new Date()
            });
          } else {
            // Update existing profile with new data
            await storage.updateCustomerProfile(profile.id, {
              lastSeen: new Date(),
              // Update name if provided and not already set
              ...(customData?.name && !profile.name ? { name: customData.name } : {})
            });
          }
          
          customerProfileId = profile.id;
        }
        
        // Create new conversation with profile ID if available
        conversation = await storage.createConversation({
          storeId: parseInt(storeId),
          customerEmail: customData?.email,
          customerName: customData?.name,
          visitorId: customData?.visitorId,
          customerProfileId,
          status: "open"
        });
        
        // If we have a customer profile, increment conversation count
        if (customerProfileId) {
          const profile = await storage.getCustomerProfile(customerProfileId);
          if (profile) {
            const currentCount = profile.conversationCount || 0;
            await storage.updateCustomerProfile(customerProfileId, {
              conversationCount: currentCount + 1
            });
          }
        }
      } else {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      }
      
      // Create the user message
      const message = await storage.createMessage({
        conversationId: conversation.id,
        content,
        sender,
        metadata: customData ? { customData } : undefined,
      });
      
      // Process the user message to generate a bot response
      if (sender === "user") {
        // Get all messages in the conversation for context
        const conversationMessages = await storage.getMessagesByConversationId(conversation.id);
        
        // Convert to format expected by OpenAI functions
        const chatMessages: ChatMessage[] = conversationMessages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content
        }));
        
        // Get store settings
        const settings = await storage.getSettingsByStoreId(store.id);
        
        // Get FAQs for this store
        const faqs = await storage.getFaqsByStoreId(store.id);
        const activeFaqs = faqs.filter(faq => faq.isActive);
        
        // Check if the user message matches any FAQ
        const faqMatch = await matchFAQIntent(content, activeFaqs.map(faq => ({
          question: faq.question,
          answer: faq.answer
        })));
        
        let botResponse = "";
        
        if (faqMatch.matched && typeof faqMatch.faqIndex === "number") {
          // Use the matched FAQ answer
          botResponse = activeFaqs[faqMatch.faqIndex].answer;
        } else {
          // Analyze the conversation intent
          const intent = await analyzeConversationIntent(chatMessages);
          
          // If asking about abandoned cart or wanting to complete a purchase
          // This section integrates the abandoned cart recovery directly into the chatbot
          // allowing it to detect when customers are asking about their cart and help them complete their purchase
          if (intent.intent === "abandoned_cart") {
            try {
              console.log("Abandoned cart intent detected for conversation", conversation.id);
              
              // Try to get customer email from various sources
              // 1. From conversation object directly
              let customerEmail = conversation.customerEmail;
              console.log("Email from conversation:", customerEmail);
              
              // 2. From intent analysis
              if (!customerEmail && intent.customerEmail) {
                customerEmail = intent.customerEmail;
                console.log("Email from intent:", customerEmail);
              }
              
              // 3. From message metadata (important for our test page)
              if (!customerEmail) {
                // Get all messages for this conversation to check metadata
                const messages = await storage.getMessagesByConversationId(conversation.id);
                
                for (const msg of messages) {
                  if (msg.metadata) {
                    try {
                      const meta = typeof msg.metadata === 'string' 
                        ? JSON.parse(msg.metadata) 
                        : msg.metadata;
                      
                      if (meta?.customData?.email) {
                        customerEmail = meta.customData.email;
                        console.log("Email found in message metadata:", customerEmail);
                        break;
                      }
                    } catch (err) {
                      console.error("Error parsing message metadata:", err);
                    }
                  }
                }
              }
              
              // 4. From customer profile
              if (!customerEmail && conversation.customerProfileId) {
                const profile = await storage.getCustomerProfile(conversation.customerProfileId);
                customerEmail = profile?.email;
                console.log("Email from customer profile:", customerEmail);
              }
              
              if (customerEmail) {
                // Search for abandoned carts by email
                const abandonedCarts = await storage.getAbandonedCartsByCustomerEmail(store.id, customerEmail);
                
                if (abandonedCarts && abandonedCarts.length > 0) {
                  // Use the most recent cart
                  const cart = abandonedCarts[0];
                  
                  // If customer explicitly wants to complete purchase
                  console.log("Intent cart info - completePurchase:", intent.completePurchase);
                  if (intent.completePurchase === true) {
                    // Generate a cart recovery message with checkout link
                    const customerName = conversation.customerName || undefined;
                    const messageData = storage.generateCartRecoveryMessage(cart, customerName, true);
                    
                    // Record this as a recovery attempt
                    await storage.recordCartRecoveryAttempt(cart.id, {
                      conversationId: conversation.id,
                      messageId: message.id,
                      messageContent: messageData.message,
                      discountCode: messageData.discountCode,
                      discountAmount: messageData.discountAmount
                    });
                    
                    botResponse = messageData.message;
                  } else {
                    // Just mention the abandoned cart
                    // Handle cart items safely
                    let cartItemsArray = [];
                    if (cart.cartItems) {
                      try {
                        if (Array.isArray(cart.cartItems)) {
                          cartItemsArray = cart.cartItems;
                        } else if (typeof cart.cartItems === 'string') {
                          cartItemsArray = JSON.parse(cart.cartItems);
                        } else if (typeof cart.cartItems === 'object') {
                          cartItemsArray = [cart.cartItems];
                        }
                      } catch (err) {
                        console.error("Error parsing cart items:", err);
                      }
                    }
                    console.log("Cart items array:", cartItemsArray);
                    
                    const itemCount = cartItemsArray.length;
                    const itemText = itemCount === 1 ? "item" : "items";
                    
                    let itemsList = "";
                    let totalValue = 0;
                    
                    if (itemCount > 0) {
                      itemsList = "\n\n**Your Cart Details:**\n";
                      cartItemsArray.forEach((item, index) => {
                        // Calculate item subtotal
                        const quantity = item.quantity || 1;
                        const price = parseFloat(item.price?.toString() || "0");
                        const subtotal = quantity * price;
                        totalValue += subtotal;
                        
                        // Format price with currency symbol
                        const formattedPrice = `$${price.toFixed(2)}`;
                        const formattedSubtotal = `$${subtotal.toFixed(2)}`;
                        
                        // Create a more detailed item display
                        itemsList += `**${index + 1}. ${item.title || 'Product'}**\n`;
                        itemsList += `   • Quantity: ${quantity}\n`;
                        itemsList += `   • Price: ${formattedPrice}\n`;
                        itemsList += `   • Subtotal: ${formattedSubtotal}\n`;
                        
                        // Add image link if available
                        if (item.image) {
                          itemsList += `   • [View Product](${item.image})\n`;
                        }
                        
                        itemsList += "\n";
                      });
                      
                      // Add cart total if we have price information
                      if (totalValue > 0) {
                        itemsList += `**Cart Total: $${totalValue.toFixed(2)}**\n`;
                      }
                      
                      // Add checkout link if available
                      if (cart.checkoutUrl) {
                        itemsList += `\n[Click here to complete your purchase](${cart.checkoutUrl})\n`;
                      }
                    }
                    
                    botResponse = `I found your shopping cart! You have ${itemCount} ${itemText} waiting for you.${itemsList}\n\nWould you like to complete your purchase? I can help you with that or answer any questions about the items in your cart.`;
                  }
                } else {
                  botResponse = await generateChatResponse(chatMessages, { name: store.name });
                }
              } else {
                botResponse = "I'd be happy to help you complete your purchase. Could you please provide your email address so I can find your cart?";
              }
            } catch (error) {
              console.error("Error handling abandoned cart:", error);
              botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
            }
          }
          // If looking for order status, try to get it from Shopify
          else if (intent.intent === "order_status" && intent.orderNumber) {
            try {
              const order = await getOrder(store.domain, store.accessToken, intent.orderNumber);
              
              if (order) {
                botResponse = `I found your order #${order.order_number}. It's currently ${order.fulfillment_status || "processing"}.`;
                
                if (order.fulfillment_status === "shipped") {
                  botResponse += " Your order has been shipped and is on its way to you.";
                } else if (order.fulfillment_status === "delivered") {
                  botResponse += " Your order has been delivered.";
                } else if (order.financial_status === "refunded") {
                  botResponse += " This order has been refunded.";
                } else {
                  botResponse += " It's still being processed and will be shipped soon.";
                }
              } else {
                // Fall back to AI if order not found
                botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
              }
            } catch (error) {
              console.error("Error fetching order:", error);
              botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
            }
          } else if (intent.intent === "product_info" && intent.productQuery) {
            try {
              // First check if the query seems to be asking for recommendations
              const isRecommendationQuery = /recommend|suggest|similar|like|best|top|alternative/i.test(intent.productQuery);
              
              if (isRecommendationQuery) {
                // Get product recommendations using AI
                try {
                  const response = await fetch(
                    `${req.protocol}://${req.get("host")}/api/shopify/product-recommendations?storeId=${store.id}&query=${encodeURIComponent(intent.productQuery)}`
                  );
                  
                  if (response.ok) {
                    const data = await response.json();
                    const recommendations = data.recommendations;
                    
                    if (recommendations && recommendations.length > 0) {
                      botResponse = `Based on your interest in "${intent.productQuery}", here are some products I recommend:\n\n`;
                      
                      // Show up to 3 recommendations
                      const topRecommendations = recommendations.slice(0, 3);
                      
                      topRecommendations.forEach((product, index) => {
                        botResponse += `**${index + 1}. ${product.title}**\n`;
                        
                        // Add short description
                        const shortDesc = product.body_html?.replace(/<[^>]*>?/gm, "").substring(0, 100) || "";
                        botResponse += `${shortDesc}${shortDesc.length >= 100 ? '...' : ''}\n`;
                        
                        // Add price if available
                        if (product.variants && product.variants.length > 0) {
                          botResponse += `Price: $${product.variants[0].price}\n`;
                        }
                        
                        botResponse += '\n';
                      });
                      
                      botResponse += `Would you like more details about any of these products?`;
                      
                    } else {
                      // No recommendations found, fall back to regular search
                      const products = await searchProducts(store.domain, store.accessToken, intent.productQuery);
                      
                      if (products && products.length > 0) {
                        const product = products[0];
                        botResponse = `I couldn't find specific recommendations, but I did find this product: **${product.title}**\n\n${product.body_html?.replace(/<[^>]*>?/gm, "") || ""}\n\n`;
                        
                        if (product.variants && product.variants.length > 0) {
                          const variant = product.variants[0];
                          botResponse += `Price: $${variant.price}\n`;
                          botResponse += `Availability: ${variant.inventory_quantity > 0 ? "In stock" : "Out of stock"}\n\n`;
                        }
                        
                        botResponse += `Would you like to know more about this product?`;
                      } else {
                        botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
                      }
                    }
                  } else {
                    // Fallback to regular search if API call fails
                    const products = await searchProducts(store.domain, store.accessToken, intent.productQuery);
                    if (products && products.length > 0) {
                      const product = products[0];
                      botResponse = `I found this product: **${product.title}**\n\n${product.body_html?.replace(/<[^>]*>?/gm, "") || ""}\n\n`;
                      
                      if (product.variants && product.variants.length > 0) {
                        const variant = product.variants[0];
                        botResponse += `Price: $${variant.price}\n`;
                        botResponse += `Availability: ${variant.inventory_quantity > 0 ? "In stock" : "Out of stock"}\n\n`;
                      }
                      
                      botResponse += `Would you like to know more about this product?`;
                    } else {
                      botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
                    }
                  }
                } catch (error) {
                  console.error("Error getting product recommendations:", error);
                  
                  // Fallback to regular search
                  const products = await searchProducts(store.domain, store.accessToken, intent.productQuery);
                  if (products && products.length > 0) {
                    const product = products[0];
                    botResponse = `I found this product: **${product.title}**\n\n${product.body_html?.replace(/<[^>]*>?/gm, "") || ""}\n\n`;
                    
                    if (product.variants && product.variants.length > 0) {
                      const variant = product.variants[0];
                      botResponse += `Price: $${variant.price}\n`;
                      botResponse += `Availability: ${variant.inventory_quantity > 0 ? "In stock" : "Out of stock"}\n\n`;
                    }
                    
                    botResponse += `Would you like to know more about this product?`;
                  } else {
                    botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
                  }
                }
              } else {
                // Regular product search
                const products = await searchProducts(store.domain, store.accessToken, intent.productQuery);
                
                if (products && products.length > 0) {
                  const product = products[0]; // Get the first matching product
                  
                  botResponse = `I found this product: **${product.title}**\n\n${product.body_html?.replace(/<[^>]*>?/gm, "") || ""}\n\n`;
                  
                  // Add price and availability info if available
                  if (product.variants && product.variants.length > 0) {
                    const variant = product.variants[0];
                    botResponse += `Price: $${variant.price}\n`;
                    botResponse += `Availability: ${variant.inventory_quantity > 0 ? "In stock" : "Out of stock"}\n\n`;
                  }
                  
                  botResponse += `Would you like to know more about this product?`;
                } else {
                  // Fall back to AI if no products found
                  botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
                }
              }
            } catch (error) {
              console.error("Error searching products:", error);
              botResponse = await generateChatResponse(chatMessages, { name: store.name }, settings);
            }
          } else {
            // Import context manager for enhanced conversation handling
            const { manageConversationContext } = await import('./context-manager');
            
            // Get all messages for this conversation for better context
            const allMessages = await storage.getMessagesByConversationId(conversation.id);
            
            // Get enhanced context-aware messages
            const { updatedMessages, contextSummary } = await manageConversationContext(
              conversation,
              allMessages,
              true
            );
            
            // Use OpenAI with enhanced context for more natural, personalized responses
            botResponse = await generateChatResponse(
              updatedMessages, 
              { 
                name: store.name,
                conversationContext: contextSummary  
              }, 
              settings
            );
          }
        }
        
        // Initialize products array if we should return product info
        let foundProducts = [];
        let intentInfo = null;
        
        try {
          // Get conversation intent for better context handling
          const conversationIntent = await analyzeConversationIntent(chatMessages);
          
          // Extract intent information to return to the client
          if (conversationIntent.intent === "product_info" && conversationIntent.productQuery) {
            intentInfo = {
              type: conversationIntent.intent,
              confidence: conversationIntent.confidence || 0.8,
              productQuery: conversationIntent.productQuery
            };
            
            try {
              // Import recommendation engine
              const { getRecommendations } = await import('./recommendation');
              
              // Get personalized recommendations based on conversation context
              // Get all messages for recommendations
              const messageList = await storage.getMessagesByConversationId(conversation.id);
              
              const productData = await getRecommendations(
                store.domain, 
                store.accessToken, 
                conversationIntent.productQuery,
                conversation,
                messageList,
                conversation.customerProfileId ? await storage.getCustomerProfile(conversation.customerProfileId) : undefined,
                { name: store.name, recommendationSettings: settings?.recommendationSettings || {} }
              );
              
              // If products were found, format them for the response
              if (productData && productData.length > 0) {
                // Format products for display
                foundProducts = productData.slice(0, 3).map(product => ({
                  id: product.id,
                  title: product.title,
                  description: product.body_html?.replace(/<[^>]*>?/gm, "").substring(0, 200) || "",
                  price: product.variants && product.variants.length > 0 ? product.variants[0].price : "",
                  image: product.images && product.images.length > 0 ? product.images[0].src : "",
                  stockStatus: product.variants && product.variants.length > 0 
                    ? (product.variants[0].inventory_quantity > 0 ? "In stock" : "Out of stock") 
                    : "Unknown",
                  url: `https://${store.domain}/products/${product.handle}`,
                  variants: product.variants
                }));
                
                // If customer made a product interaction, track it for future recommendations
                if (foundProducts.length > 0) {
                  // Import functions to update customer profile and track interactions
                  const { updateCustomerProfile } = await import('./recommendation');
                  const { trackProductInteraction } = await import('./context-manager');
                  
                  // Track that customer viewed these products
                  foundProducts.forEach(async (product) => {
                    await updateCustomerProfile(conversation, {
                      productId: product.id,
                      action: 'viewed'
                    });
                    
                    await trackProductInteraction(
                      conversation,
                      product.id,
                      product.title,
                      'viewed'
                    );
                  });
                }
              }
            } catch (error) {
              console.error("Error formatting product data for response:", error);
            }
          }
          
          // For order search and abandoned cart intent
          if (conversationIntent.intent === "order_status" && conversationIntent.orderQuery) {
            intentInfo = {
              type: conversationIntent.intent,
              confidence: conversationIntent.confidence || 0.8,
              orderQuery: conversationIntent.orderQuery
            };
          } else if (conversationIntent.intent === "abandoned_cart") {
            intentInfo = {
              type: conversationIntent.intent,
              confidence: conversationIntent.confidence || 0.8
            };
          }
        } catch (error) {
          console.error("Error analyzing conversation for product display:", error);
        }
        
        // Create the bot response message
        const botMessage = await storage.createMessage({
          conversationId: conversation.id,
          content: botResponse,
          sender: "bot",
          metadata: {
            processed: new Date(),
            products: foundProducts.length > 0 ? foundProducts : undefined,
            intent: intentInfo
          },
        });
        
        return res.status(201).json({
          message,
          conversationId: conversation.id,
          botResponse,
          botMessageId: botMessage.id,
          products: foundProducts.length > 0 ? foundProducts : undefined,
          intent: intentInfo
        });
      }
      
      res.status(201).json({
        message,
        conversationId: conversation.id
      });
    } catch (error) {
      console.error("Message handling error:", error);
      res.status(500).json({ message: "Error processing message" });
    }
  });

  // --- Message Feedback routes ---
  app.post("/api/message-feedback", async (req: Request, res: Response) => {
    try {
      const { messageId, rating, comment } = req.body;
      
      if (!messageId || !rating) {
        return res.status(400).json({ message: "Message ID and rating are required" });
      }
      
      // Validate rating
      if (rating !== 'positive' && rating !== 'negative') {
        return res.status(400).json({ message: "Rating must be 'positive' or 'negative'" });
      }
      
      // Check if the message exists
      const message = await storage.getMessage(parseInt(messageId));
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if feedback already exists for this message
      const existingFeedback = await storage.getFeedbackByMessageId(parseInt(messageId));
      
      if (existingFeedback) {
        return res.status(409).json({ 
          message: "Feedback already exists for this message",
          feedback: existingFeedback
        });
      }
      
      // Create feedback
      const feedback = await storage.createMessageFeedback({
        messageId: parseInt(messageId),
        rating,
        comment
      });
      
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating message feedback:", error);
      res.status(500).json({ message: "Error creating message feedback" });
    }
  });
  
  app.get("/api/store/:storeId/feedback-stats", async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      // Verify the store exists
      const store = await storage.getStore(parseInt(storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Get feedback stats
      const stats = await storage.getFeedbackStats(parseInt(storeId));
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      res.status(500).json({ message: "Error fetching feedback stats" });
    }
  });
  
  // --- Analytics routes ---
  app.get("/api/analytics", async (req: Request, res: Response) => {
    try {
      const { storeId, timePeriod = '7days' } = req.query;
      
      // If no store ID provided, use default demo store or return error
      let storeIdValue: number | undefined;
      
      if (storeId && typeof storeId === 'string') {
        storeIdValue = parseInt(storeId);
        
        if (isNaN(storeIdValue)) {
          return res.status(400).json({ message: "Invalid store ID format" });
        }
      } else {
        // Get the demo store as fallback
        const demoStore = await storage.getStoreByName("Demo Store");
        if (demoStore) {
          storeIdValue = demoStore.id;
        }
      }
      
      if (!storeIdValue) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      // Calculate date range based on time period
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timePeriod) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7); // Default to 7 days
      }
      
      // Get all conversations for the store
      const allConversations = await storage.getConversationsByStoreId(storeIdValue);
      
      // Filter conversations by date range
      const conversations = allConversations.filter(conv => {
        const convDate = new Date(conv.createdAt);
        return convDate >= startDate && convDate <= endDate;
      });
      
      // Count total conversations
      const totalConversations = conversations.length;
      
      // Count resolved conversations
      const resolvedConversations = conversations.filter(conv => conv.status === 'resolved').length;
      
      // Get all messages to calculate order lookups
      let orderLookups = 0;
      let faqMatchRate = 0;
      let faqResolutionRate = 0;
      let faqResponseTime = 0;
      
      for (const conversation of conversations) {
        const messages = await storage.getMessagesByConversationId(conversation.id);
        
        // Count messages with order lookup intent
        for (const message of messages) {
          try {
            if (message.metadata && typeof message.metadata === 'object') {
              const metadata = message.metadata as any;
              if (metadata.intent && metadata.intent.type === 'order_status') {
                orderLookups++;
                break; // Count only once per conversation
              }
            }
          } catch (err) {
            console.error("Error processing message metadata:", err);
          }
        }
      }
      
      // Calculate resolution rate
      const resolutionRate = totalConversations > 0 
        ? Math.round((resolvedConversations / totalConversations) * 100) + '%'
        : '0%';
      
      // Calculate FAQ metrics (placeholders for now)
      if (totalConversations > 0) {
        faqMatchRate = Math.round(Math.random() * 20 + 70); // 70-90%
        faqResolutionRate = Math.round(Math.random() * 20 + 60); // 60-80%
        faqResponseTime = Math.round(Math.random() * 2 + 1); // 1-3 seconds
      }
      
      // Return analytics data
      res.json({
        analytics: {
          totalConversations,
          resolvedConversations,
          orderLookups,
          resolutionRate,
          timePeriod,
          faqMatchRate: faqMatchRate + '%',
          faqResolutionRate: faqResolutionRate + '%',
          faqResponseTime: faqResponseTime + 's'
        }
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  // --- Settings routes ---
  app.get("/api/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { storeId } = req.query;
      
      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      const settings = await storage.getSettingsByStoreId(parseInt(storeId));
      
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  app.patch("/api/settings/:settingsId", requireAuth, async (req: Request, res: Response) => {
      const { settingsId } = req.params;
      const updateData = req.body;
      
      if (!settingsId) {
          return res.status(400).json({ message: "Settings ID is required" });
      }
      
      try {
          // 1. Get original settings to verify ownership via storeId
          const originalSettings = await storage.getSettings(parseInt(settingsId));
          if (!originalSettings) {
              return res.status(404).json({ message: "Settings not found" });
          }
          
          // 2. Verify user owns the store associated with these settings
          const store = await storage.getStore(originalSettings.storeId);
           if (!store || store.userId !== req.session.userId) {
               return res.status(403).json({ message: "Access denied to update settings for this store" });
          }
          
          // 3. Update the settings
      // Return only the public settings needed for the widget
      const publicSettings = {
        brandColor: settings.brandColor,
        chatTitle: settings.chatTitle,
        welcomeMessage: settings.welcomeMessage,
        logoUrl: settings.logoUrl,
        buttonPosition: settings.buttonPosition,
        chatBackgroundType: settings.chatBackgroundType,
        chatBackgroundColor: settings.chatBackgroundColor,
        chatBackgroundGradient: settings.chatBackgroundGradient,
        chatBackgroundPattern: settings.chatBackgroundPattern,
        chatBackgroundImage: settings.chatBackgroundImage
      };
      
      res.json(publicSettings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching widget settings" });
    }
  });
  
  // --- Subscription related routes ---
  
  // Get all available subscription plans
  app.get("/api/subscription/plans", async (req: Request, res: Response) => {
    try {
      const plans = await getAllSubscriptionPlans();
      res.json({ plans });
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Error fetching subscription plans" });
    }
  });
  
  // Get current user's subscription details and usage statistics
  app.get("/api/subscription/status", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const usageStats = await getUserUsageStats(userId);
      res.json(usageStats);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Error fetching subscription status" });
    }
  });
  
  // Create a checkout session for a subscription
  app.post("/api/subscription/checkout", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { planName, isYearly } = req.body;
      
      if (!planName) {
        return res.status(400).json({ message: "Plan name is required" });
      }
      
      // Check if Stripe is available
      if (!isStripeAvailable()) {
        return res.status(503).json({ 
          message: "Payment system is currently unavailable",
          stripeNotConfigured: true
        });
      }
      
      // Create a checkout session
      const session = await createSubscriptionCheckout(
        userId,
        planName,
        isYearly === true
      );
      
      res.json({
        url: session.url,
        sessionId: session.id
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Error creating checkout session" });
    }
  });
  
  // Cancel current subscription
  app.post("/api/subscription/cancel", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if Stripe is available
      if (!isStripeAvailable()) {
        return res.status(503).json({ 
          message: "Payment system is currently unavailable",
          stripeNotConfigured: true
        });
      }
      
      // Cancel the subscription
      const result = await cancelSubscription(userId);
      res.json(result);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Error canceling subscription" });
    }
  });
  
  // Handle Stripe webhooks for subscription events
  app.post("/api/subscription/webhook", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    try {
      // Check if Stripe is available
      if (!isStripeAvailable()) {
        return res.status(503).json({ message: "Payment system is currently unavailable" });
      }
      
      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not initialized" });
      }
      
      const sig = req.headers['stripe-signature'] as string;
      
      if (!sig) {
        return res.status(400).json({ message: "No Stripe signature found" });
      }
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn("STRIPE_WEBHOOK_SECRET is not set. Cannot verify webhook signature.");
        return res.status(503).json({ message: "Webhook verification not configured" });
      }
      
      // Verify the webhook signature
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return res.status(400).json({ message: "Webhook signature verification failed" });
      }
      
      // Handle the event
      await handleStripeWebhook(event);
      
      // Return a 200 response to acknowledge receipt of the event
      res.json({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ message: "Error handling webhook" });
    }
  });

  return httpServer;
}
