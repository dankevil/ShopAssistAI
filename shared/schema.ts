import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false),
  role: text("role").default("user"),
  // Subscription-related fields
  subscriptionTier: text("subscription_tier").default("free"), // 'free', 'starter', 'pro', 'enterprise'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("active"), // 'active', 'past_due', 'canceled', 'trialing'
  interactionsCount: integer("interactions_count").default(0), // Track usage for limits
  interactionsReset: timestamp("interactions_reset"), // When the counter resets (monthly)
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
  role: true,
  subscriptionTier: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
  interactionsCount: true,
  interactionsReset: true,
  subscriptionStartDate: true,
  subscriptionEndDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define platform enum type (optional but good practice)
export const platformEnum = z.enum(['shopify', 'wordpress']);

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform", { enum: platformEnum.options }).notNull().default('shopify'), // Add platform field
  name: text("name").notNull(),
  domain: text("domain").notNull(), // For Shopify: {shop}.myshopify.com, For WP: site URL
  credentials: jsonb("credentials").notNull(), // Replaces accessToken: { accessToken: string } for shopify, { username: string, applicationPassword: string } for WP
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStoreSchema = createInsertSchema(stores).pick({
  userId: true,
  platform: true, // Add platform
  name: true,
  domain: true, 
  credentials: true, // Add credentials
  isActive: true,
}); // Removed accessToken

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

// Define WordPress data cache table
export const wordpressDataCache = pgTable("wordpress_data_cache", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  dataType: text("data_type").notNull(), // e.g., 'posts', 'pages', 'products', 'categories', 'siteInfo'
  data: jsonb("data"),
  lastSynced: timestamp("last_synced").defaultNow(),
});

export const insertWordpressDataCacheSchema = createInsertSchema(wordpressDataCache).pick({
  storeId: true,
  dataType: true,
  data: true,
});

export type InsertWordpressDataCache = z.infer<typeof insertWordpressDataCacheSchema>;
export type WordpressDataCache = typeof wordpressDataCache.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  // Track visitor ID for anonymous customers
  visitorId: text("visitor_id"),
  // Link to customer profile (can be null for legacy conversations)
  customerProfileId: integer("customer_profile_id").references(() => customerProfiles.id),
  // JSON field for memory context specific to this conversation
  memoryContext: jsonb("memory_context"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  storeId: true,
  customerEmail: true,
  customerName: true,
  visitorId: true,
  customerProfileId: true,
  memoryContext: true,
  status: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'bot', 'user'
  metadata: jsonb("metadata"), // could contain info like which API was used, response time, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  sender: true,
  metadata: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const faqCategories = pgTable("faq_categories", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFaqCategorySchema = createInsertSchema(faqCategories).pick({
  storeId: true,
  name: true,
  description: true,
  sortOrder: true,
});

export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;
export type FaqCategory = typeof faqCategories.$inferSelect;

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  categoryId: integer("category_id").references(() => faqCategories.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFaqSchema = createInsertSchema(faqs).pick({
  storeId: true,
  categoryId: true,
  question: true,
  answer: true,
  isActive: true,
  sortOrder: true,
});

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id).unique(),
  brandColor: text("brand_color").default("#4F46E5"),
  chatTitle: text("chat_title").default("Chat with us"),
  welcomeMessage: text("welcome_message").default("Hello! How can I help you today?"),
  logoUrl: text("logo_url"),
  buttonPosition: text("button_position").default("right"), // 'left' or 'right'
  apiKeys: jsonb("api_keys"), // { openaiKey: string }
  defaultLanguage: text("default_language").default("en"), // Default language (ISO code)
  supportedLanguages: jsonb("supported_languages").default(['en']), // Array of supported language codes
  
  // Chatbot features
  chatbotFeatures: jsonb("chatbot_features").default({
    productSearch: true,
    orderStatus: true,
    recommendations: true,
    inventory: true,
  }),
  
  // AI customization
  aiCustomization: jsonb("ai_customization").default({
    conversationMode: 'balanced',
    dataCollectionLevel: 'comprehensive',
    responseLength: 'medium',
    tone: 'professional',
    creativity: 50,
    knowledgePriority: 'balanced',
    trainingMethod: 'auto',
  }),
  
  // Knowledge base settings
  knowledgeBase: jsonb("knowledge_base").default({
    includeProductDescriptions: true,
    includeReviews: true,
    includeCollections: true,
    includePolicies: true,
    includeMetafields: true,
    includeBlogContent: true,
    includeStorefrontContent: true,
  }),
  
  // Conversation settings
  conversationSettings: jsonb("conversation_settings").default({
    maxHistoryLength: 10,
    userIdentification: 'optional',
    handoffThreshold: 3,
    followUpEnabled: true,
    proactiveChat: false,
    messageDelay: 0,
  }),
  
  // Custom training data
  customTraining: jsonb("custom_training").default({
    additionalInstructions: '',
    prohibitedTopics: '',
    favoredProducts: '',
    customFAQs: '',
  }),
  translations: jsonb("translations"), // { languageCode: { key: translation } }
  // Chat background theme settings
  chatBackgroundType: text("chat_background_type").default("solid"), // 'solid', 'gradient', 'pattern', 'image'
  chatBackgroundColor: text("chat_background_color").default("#f9fafb"), // For solid backgrounds
  chatBackgroundGradient: text("chat_background_gradient").default("linear-gradient(to right, #f9fafb, #f3f4f6)"), // For gradient backgrounds
  chatBackgroundPattern: text("chat_background_pattern"), // URL or pattern name
  chatBackgroundImage: text("chat_background_image"), // URL for background image
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  storeId: true,
  brandColor: true,
  chatTitle: true,
  welcomeMessage: true,
  logoUrl: true,
  buttonPosition: true,
  apiKeys: true,
  defaultLanguage: true,
  supportedLanguages: true,
  translations: true,
  chatBackgroundType: true,
  chatBackgroundColor: true,
  chatBackgroundGradient: true,
  chatBackgroundPattern: true,
  chatBackgroundImage: true,
  // New fields for chatbot customization
  chatbotFeatures: true,
  aiCustomization: true,
  knowledgeBase: true,
  conversationSettings: true,
  customTraining: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Customer profiles for AI memory
export const customerProfiles = pgTable("customer_profiles", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  // Identifier can be email, cookie ID, etc.
  identifier: text("identifier").notNull(),
  name: text("name"),
  email: text("email"),
  // Unique visitor ID used to track anonymous visitors
  visitorId: text("visitor_id"),
  // Preferences and other profile information
  preferences: jsonb("preferences"),
  // Previous conversation topics
  conversationHistory: jsonb("conversation_history"),
  // Key information about the customer
  memoryData: jsonb("memory_data"),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  conversationCount: integer("conversation_count").default(1),
  orderHistory: jsonb("order_history"),
  // Language preference (ISO code)
  language: text("language").default("en"),
});

export const customerProfilesRelations = relations(customerProfiles, ({ many }) => ({
  conversations: many(conversations),
}));

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).pick({
  storeId: true,
  identifier: true,
  name: true,
  email: true,
  visitorId: true,
  preferences: true,
  conversationHistory: true,
  memoryData: true,
  orderHistory: true,
  firstSeen: true,
  lastSeen: true,
  conversationCount: true,
  language: true,
});

export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type CustomerProfile = typeof customerProfiles.$inferSelect;

// Add relationId to conversations 
export const conversationsRelations = relations(conversations, ({ one }) => ({
  customerProfile: one(customerProfiles, {
    fields: [conversations.id],
    references: [customerProfiles.id],
  }),
}));

// Message feedback system
export const messageFeedback = pgTable("message_feedback", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  rating: text("rating").notNull(), // 'positive', 'negative'
  comment: text("comment"), // Optional feedback comment
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageFeedbackSchema = createInsertSchema(messageFeedback).pick({
  messageId: true,
  rating: true,
  comment: true,
});

export type InsertMessageFeedback = z.infer<typeof insertMessageFeedbackSchema>;
export type MessageFeedback = typeof messageFeedback.$inferSelect;

// Messages to feedback relationship
export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  feedback: many(messageFeedback),
}));

// Feedback to message relationship
export const messageFeedbackRelations = relations(messageFeedback, ({ one }) => ({
  message: one(messages, {
    fields: [messageFeedback.messageId],
    references: [messages.id],
  }),
}));

// Abandoned Cart Tracking
export const abandonedCarts = pgTable("abandoned_carts", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  shopifyCheckoutId: text("shopify_checkout_id").notNull(),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  customerId: text("customer_id"),
  customerProfileId: integer("customer_profile_id").references(() => customerProfiles.id),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  currency: text("currency"),
  cartItems: jsonb("cart_items").default([]), // Products in the cart
  checkoutUrl: text("checkout_url"),
  abandonedAt: timestamp("abandoned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAbandonedCartSchema = createInsertSchema(abandonedCarts).pick({
  storeId: true,
  shopifyCheckoutId: true,
  customerEmail: true,
  customerName: true,
  customerId: true,
  customerProfileId: true,
  totalPrice: true,
  currency: true,
  cartItems: true,
  checkoutUrl: true,
  abandonedAt: true,
});

export type InsertAbandonedCart = z.infer<typeof insertAbandonedCartSchema>;
export type AbandonedCart = typeof abandonedCarts.$inferSelect;

// Cart Recovery Attempts
export const cartRecoveryAttempts = pgTable("cart_recovery_attempts", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => abandonedCarts.id),
  conversationId: integer("conversation_id").references(() => conversations.id),
  messageId: integer("message_id").references(() => messages.id),
  messageContent: text("message_content"),
  status: text("status").notNull().default("sent"), // 'sent', 'delivered', 'clicked', 'converted'
  discountCodeOffered: text("discount_code_offered"),
  discountAmount: text("discount_amount"),
  sentAt: timestamp("sent_at").defaultNow(),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCartRecoveryAttemptSchema = createInsertSchema(cartRecoveryAttempts).pick({
  cartId: true,
  conversationId: true,
  messageId: true,
  messageContent: true,
  status: true,
  discountCodeOffered: true,
  discountAmount: true,
  sentAt: true,
  convertedAt: true,
});

export type InsertCartRecoveryAttempt = z.infer<typeof insertCartRecoveryAttemptSchema>;
export type CartRecoveryAttempt = typeof cartRecoveryAttempts.$inferSelect;

// Relations between carts, attempts, customer profiles, and conversations
export const abandonedCartsRelations = relations(abandonedCarts, ({ one, many }) => ({
  customerProfile: one(customerProfiles, {
    fields: [abandonedCarts.customerProfileId],
    references: [customerProfiles.id],
  }),
  recoveryAttempts: many(cartRecoveryAttempts),
}));

export const cartRecoveryAttemptsRelations = relations(cartRecoveryAttempts, ({ one }) => ({
  cart: one(abandonedCarts, {
    fields: [cartRecoveryAttempts.cartId],
    references: [abandonedCarts.id],
  }),
  conversation: one(conversations, {
    fields: [cartRecoveryAttempts.conversationId],
    references: [conversations.id],
  }),
  message: one(messages, {
    fields: [cartRecoveryAttempts.messageId],
    references: [messages.id],
  }),
}));

// Cart Recovery Automation Settings
export const automationSettings = pgTable("automation_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id).unique(),
  isEnabled: boolean("is_enabled").default(false),
  initialDelay: integer("initial_delay").notNull().default(1), // hours
  followUpDelay: integer("follow_up_delay").notNull().default(24), // hours
  finalDelay: integer("final_delay").notNull().default(48), // hours
  initialTemplate: text("initial_template").notNull(),
  followUpTemplate: text("follow_up_template").notNull(),
  finalTemplate: text("final_template").notNull(),
  includeDiscountInFinal: boolean("include_discount_in_final").default(true),
  discountAmount: text("discount_amount").default("10"),
  discountType: text("discount_type").default("percentage"), // 'percentage' or 'fixed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAutomationSettingsSchema = createInsertSchema(automationSettings).pick({
  storeId: true,
  isEnabled: true,
  initialDelay: true,
  followUpDelay: true,
  finalDelay: true,
  initialTemplate: true,
  followUpTemplate: true,
  finalTemplate: true,
  includeDiscountInFinal: true,
  discountAmount: true,
  discountType: true,
});

export type InsertAutomationSettings = z.infer<typeof insertAutomationSettingsSchema>;
export type AutomationSettings = typeof automationSettings.$inferSelect;

// Subscription plans table for Stripe integration
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'free', 'starter', 'pro', 'enterprise'
  stripePriceId: text("stripe_price_id"), // Stripe price ID for this plan
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }), // Monthly price (null for free or custom pricing)
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }), // Yearly price (null for free or custom pricing)
  interactions: integer("interactions").notNull(), // Max number of interactions per month (e.g., 500, 2000, 10000)
  description: text("description").notNull(), // Short description of the plan
  features: jsonb("features").notNull(), // JSON array of features included
  active: boolean("active").default(true), // Whether this plan is currently offered
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  stripePriceId: true,
  monthlyPrice: true,
  yearlyPrice: true,
  interactions: true,
  description: true,
  features: true,
  active: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Subscription transactions for tracking all subscription-related events
export const subscriptionTransactions = pgTable("subscription_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  type: text("type").notNull(), // 'new', 'upgrade', 'downgrade', 'renewal', 'cancellation', 'payment_failed'
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("usd"),
  status: text("status").notNull(), // 'succeeded', 'pending', 'failed'
  metadata: jsonb("metadata"), // Additional metadata about the transaction
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionTransactionSchema = createInsertSchema(subscriptionTransactions).pick({
  userId: true,
  planId: true,
  type: true,
  stripeInvoiceId: true,
  stripePaymentIntentId: true,
  amount: true,
  currency: true,
  status: true,
  metadata: true,
});

export type InsertSubscriptionTransaction = z.infer<typeof insertSubscriptionTransactionSchema>;
export type SubscriptionTransaction = typeof subscriptionTransactions.$inferSelect;

// Relationships
export const userRelations = relations(users, ({ many }) => ({
  stores: many(stores),
  subscriptionTransactions: many(subscriptionTransactions),
}));

export const subscriptionPlanRelations = relations(subscriptionPlans, ({ many }) => ({
  transactions: many(subscriptionTransactions),
}));

export const subscriptionTransactionRelations = relations(subscriptionTransactions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptionTransactions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptionTransactions.planId],
    references: [subscriptionPlans.id],
  }),
}));
