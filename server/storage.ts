import { 
  users, type User, type InsertUser,
  stores, type Store, type InsertStore,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  messageFeedback, type MessageFeedback, type InsertMessageFeedback,
  faqCategories, type FaqCategory, type InsertFaqCategory,
  faqs, type Faq, type InsertFaq,
  settings, type Settings, type InsertSettings,
  customerProfiles, type CustomerProfile, type InsertCustomerProfile,
  abandonedCarts, type AbandonedCart, type InsertAbandonedCart,
  cartRecoveryAttempts, type CartRecoveryAttempt, type InsertCartRecoveryAttempt,
  automationSettings, type AutomationSettings, type InsertAutomationSettings,
  wordpressDataCache, type WordpressDataCache, type InsertWordpressDataCache
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Store management
  getStore(id: number): Promise<Store | undefined>;
  getStoreByDomain(domain: string): Promise<Store | undefined>;
  getStoreByName(name: string): Promise<Store | undefined>;
  getStoresByUserId(userId: number): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, data: Partial<Store>): Promise<Store | undefined>;

  // Conversation management
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByStoreId(storeId: number): Promise<Conversation[]>;
  getConversationsByCustomerProfileId(profileId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationStatus(id: number, status: string): Promise<Conversation | undefined>;
  updateConversationMemoryContext(id: number, memoryContext: any): Promise<Conversation | undefined>;

  // Message management
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Message Feedback management
  getMessageFeedback(id: number): Promise<MessageFeedback | undefined>;
  getFeedbackByMessageId(messageId: number): Promise<MessageFeedback | undefined>;
  createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback>;
  getFeedbackStats(storeId: number): Promise<{
    positiveCount: number;
    negativeCount: number;
    totalCount: number;
    positivePercentage: number;
  }>;
  
  // FAQ Category management
  getFaqCategory(id: number): Promise<FaqCategory | undefined>;
  getFaqCategoriesByStoreId(storeId: number): Promise<FaqCategory[]>;
  createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory>;
  updateFaqCategory(id: number, data: Partial<FaqCategory>): Promise<FaqCategory | undefined>;
  deleteFaqCategory(id: number): Promise<boolean>;

  // FAQ management
  getFaq(id: number): Promise<Faq | undefined>;
  getFaqsByStoreId(storeId: number): Promise<Faq[]>;
  getFaqsByCategoryId(categoryId: number): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: number, data: Partial<Faq>): Promise<Faq | undefined>;
  deleteFaq(id: number): Promise<boolean>;
  updateFaqSortOrder(id: number, sortOrder: number): Promise<Faq | undefined>;

  // Settings management
  getSettings(id: number): Promise<Settings | undefined>;
  getSettingsByStoreId(storeId: number): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(id: number, data: Partial<Settings>): Promise<Settings | undefined>;
  
  // Customer Profile management
  getCustomerProfile(id: number): Promise<CustomerProfile | undefined>;
  getCustomerProfileByIdentifier(storeId: number, identifier: string): Promise<CustomerProfile | undefined>;
  getCustomerProfileByVisitorId(storeId: number, visitorId: string): Promise<CustomerProfile | undefined>;
  getCustomerProfilesByStoreId(storeId: number): Promise<CustomerProfile[]>;
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  updateCustomerProfile(id: number, data: Partial<CustomerProfile>): Promise<CustomerProfile | undefined>;
  
  // Cart Recovery management
  getAbandonedCart(id: number): Promise<AbandonedCart | undefined>;
  getRecentAbandonedCarts(storeId: number, hours?: number): Promise<AbandonedCart[]>;
  getAbandonedCartsByCustomerEmail(storeId: number, email: string): Promise<AbandonedCart[]>;
  getAbandonedCartsByCustomerProfile(profileId: number): Promise<AbandonedCart[]>;
  saveAbandonedCart(cart: InsertAbandonedCart): Promise<AbandonedCart>;
  syncAbandonedCarts(store: Store): Promise<AbandonedCart[]>;
  recordCartRecoveryAttempt(cartId: number, messageData: any): Promise<CartRecoveryAttempt>;
  getCartRecoveryAttempts(storeId: number, cartId?: number, status?: string): Promise<CartRecoveryAttempt[]>;
  updateCartRecoveryStatus(attemptId: number, status: string): Promise<CartRecoveryAttempt | null>;
  generateCartRecoveryMessage(cart: AbandonedCart, customerName?: string, includeDiscount?: boolean): any;
  
  // Cart Recovery Automation management
  getAutomationSettings(storeId: number): Promise<AutomationSettings | null>;
  createAutomationSettings(settings: InsertAutomationSettings): Promise<AutomationSettings>;
  updateAutomationSettings(id: number, data: Partial<AutomationSettings>): Promise<AutomationSettings | null>;
  getStoresWithAutomation(): Promise<Store[]>;
  getCartsForAutomation(storeId: number): Promise<AbandonedCart[]>;
  getRecoveryAttemptsByCart(cartId: number): Promise<CartRecoveryAttempt[]>;

  // WordPress Data Cache Management
  saveWordpressData(data: InsertWordpressDataCache): Promise<WordpressDataCache>;
  getWordpressData(storeId: number, dataType: string): Promise<WordpressDataCache | undefined>;
  getLatestWordpressDataTimestamp(storeId: number): Promise<Date | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private messageFeedbacks: Map<number, MessageFeedback>;
  private faqCategories: Map<number, FaqCategory>;
  private faqs: Map<number, Faq>;
  private settingsMap: Map<number, Settings>;
  private customerProfiles: Map<number, CustomerProfile>;
  private abandonedCarts: Map<number, AbandonedCart>;
  private cartRecoveryAttempts: Map<number, CartRecoveryAttempt>;
  private automationSettings: Map<number, AutomationSettings>;
  private wordpressCache: Map<number, WordpressDataCache>;
  
  private currentUserId: number = 1;
  private currentStoreId: number = 1;
  private currentConversationId: number = 1;
  private currentMessageId: number = 1;
  private currentMessageFeedbackId: number = 1;
  private currentFaqCategoryId: number = 1;
  private currentFaqId: number = 1;
  private currentSettingsId: number = 1;
  private currentCustomerProfileId: number = 1;
  private currentCartId: number = 1;
  private currentCartRecoveryAttemptId: number = 1;
  private currentAutomationSettingsId: number = 1;
  private currentWordpressCacheId: number = 1;

  constructor() {
    this.users = new Map();
    this.stores = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.messageFeedbacks = new Map();
    this.faqCategories = new Map();
    this.faqs = new Map();
    this.settingsMap = new Map();
    this.customerProfiles = new Map();
    this.abandonedCarts = new Map();
    this.cartRecoveryAttempts = new Map();
    this.automationSettings = new Map();
    this.wordpressCache = new Map();

    // Add a default user for development
    const defaultUser: User = {
      id: this.currentUserId,
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      isAdmin: true,
      role: 'admin',
      subscriptionTier: 'pro',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'active',
      interactionsCount: 0,
      interactionsReset: null,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: null,
    };
    this.users.set(defaultUser.id, defaultUser);
    this.currentUserId++;

    // Add a default Shopify store for the default user
    const defaultStore: Store = {
      id: this.currentStoreId,
      userId: 1,
      platform: 'shopify',
      name: 'Demo Store',
      domain: 'demo-store.myshopify.com',
      credentials: { accessToken: 'demo-token' },
      isActive: true,
      createdAt: new Date()
    };
    this.stores.set(defaultStore.id, defaultStore);
    this.currentStoreId++;

    // Add default settings for the store
    const defaultSettings: Settings = {
      id: this.currentSettingsId,
      storeId: 1,
      brandColor: '#4F46E5',
      chatTitle: 'Chat with us',
      welcomeMessage: 'Hello! Welcome to Demo Store. How can I help you today?',
      logoUrl: null,
      buttonPosition: 'right',
      apiKeys: { openaiKey: process.env.OPENAI_API_KEY || '' },
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      chatbotFeatures: { productSearch: true, orderStatus: true, recommendations: true, inventory: true },
      aiCustomization: { conversationMode: 'balanced', dataCollectionLevel: 'comprehensive', responseLength: 'medium', tone: 'professional', creativity: 50, knowledgePriority: 'balanced', trainingMethod: 'auto' },
      knowledgeBase: { includeProductDescriptions: true, includeReviews: true, includeCollections: true, includePolicies: true, includeMetafields: true, includeBlogContent: true, includeStorefrontContent: true },
      conversationSettings: { maxHistoryLength: 10, userIdentification: 'optional', handoffThreshold: 3, followUpEnabled: true, proactiveChat: false, messageDelay: 0 },
      customTraining: { additionalInstructions: '', prohibitedTopics: '', favoredProducts: '', customFAQs: '' },
      translations: {},
      chatBackgroundType: 'solid',
      chatBackgroundColor: '#f9fafb',
      chatBackgroundGradient: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
      chatBackgroundPattern: null,
      chatBackgroundImage: null
    };
    this.settingsMap.set(defaultSettings.id, defaultSettings);
    this.currentSettingsId++;
    
    // Add default FAQ categories
    const defaultCategories: FaqCategory[] = [
      {
        id: this.currentFaqCategoryId++,
        storeId: 1,
        name: "Shipping & Delivery",
        description: "Information about shipping methods, delivery times, and tracking",
        sortOrder: 0,
        createdAt: new Date()
      },
      {
        id: this.currentFaqCategoryId++,
        storeId: 1,
        name: "Returns & Refunds",
        description: "Policies and procedures for returns, exchanges, and refunds",
        sortOrder: 1,
        createdAt: new Date()
      },
      {
        id: this.currentFaqCategoryId++,
        storeId: 1,
        name: "Product Information",
        description: "Details about product features, specifications, and usage",
        sortOrder: 2,
        createdAt: new Date()
      },
      {
        id: this.currentFaqCategoryId++,
        storeId: 1,
        name: "Orders & Payments",
        description: "Information about placing orders, payment methods, and processing",
        sortOrder: 3,
        createdAt: new Date()
      }
    ];
    
    for (const category of defaultCategories) {
      this.faqCategories.set(category.id, category);
    }
    
    // Add some default FAQs for the demo store
    const defaultFaqs: Faq[] = [
      {
        id: this.currentFaqId++,
        storeId: 1,
        categoryId: 1,
        question: "What are your shipping options?",
        answer: "We offer standard and expedited shipping options.",
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentFaqId++,
        storeId: 1,
        categoryId: 1,
        question: "How do I track my order?",
        answer: "You can track your order by logging into your account and viewing your order history, or by using the tracking number sent in your shipping confirmation email.",
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentFaqId++,
        storeId: 1,
        categoryId: 2,
        question: "What is your return policy?",
        answer: "We accept returns within 30 days of purchase. Items must be in original condition with tags attached.",
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentFaqId++,
        storeId: 1,
        categoryId: 2,
        question: "How do I initiate a return?",
        answer: "To initiate a return, log into your account, find the order you wish to return, and click the 'Return Items' button. Follow the instructions to print a return shipping label.",
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentFaqId++,
        storeId: 1,
        categoryId: 3,
        question: "Where can I find sizing information?",
        answer: "Detailed sizing information is available on each product page. Check the 'Size Guide' link below the product description for specific measurements.",
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const faq of defaultFaqs) {
      this.faqs.set(faq.id, faq);
    }
    
    // Create a sample customer profile for testing
    const defaultCustomerProfile: CustomerProfile = {
      id: this.currentCustomerProfileId++,
      storeId: 1,
      identifier: 'default-visitor',
      visitorId: 'visitor-123',
      name: 'Test Customer',
      email: 'customer@example.com',
      preferences: { theme: 'dark', preferredCategories: ['shoes', 'shirts'] },
      conversationHistory: { topics: ['sizing', 'returns'], lastConversation: new Date().toISOString() },
      memoryData: { 
        knownInfo: 'Customer usually orders size medium shirts and size 10 shoes.', 
        previousPurchases: ['Blue T-shirt', 'Running shoes']
      },
      firstSeen: new Date(),
      lastSeen: new Date(),
      conversationCount: 3,
      language: 'en',
      orderHistory: {
        orders: [
          { id: 'order-123', date: new Date().toISOString(), amount: 125.50, items: 3 },
          { id: 'order-456', date: new Date().toISOString(), amount: 79.99, items: 1 }
        ]
      }
    };
    this.customerProfiles.set(defaultCustomerProfile.id, defaultCustomerProfile);
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.currentUserId++,
      isAdmin: user.isAdmin ?? false,
      role: user.role ?? 'user',
      subscriptionTier: user.subscriptionTier ?? 'free',
      stripeCustomerId: user.stripeCustomerId ?? null,
      stripeSubscriptionId: user.stripeSubscriptionId ?? null,
      subscriptionStatus: user.subscriptionStatus ?? 'active',
      interactionsCount: user.interactionsCount ?? 0,
      interactionsReset: user.interactionsReset ?? null,
      subscriptionStartDate: user.subscriptionStartDate ?? new Date(),
      subscriptionEndDate: user.subscriptionEndDate ?? null,
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Store management
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoreByDomain(domain: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(
      (store) => store.domain === domain,
    );
  }
  
  async getStoreByName(name: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(
      (store) => store.name === name,
    );
  }

  async getStoresByUserId(userId: number): Promise<Store[]> {
    return Array.from(this.stores.values()).filter(
      (store) => store.userId === userId,
    );
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const newStore: Store = {
      ...storeData,
      id: this.currentStoreId++,
      isActive: storeData.isActive ?? true,
      createdAt: new Date(),
    };
    this.stores.set(newStore.id, newStore);
    return newStore;
  }

  async updateStore(id: number, data: Partial<Store>): Promise<Store | undefined> {
    const store = this.stores.get(id);
    if (!store) return undefined;

    const updatedStore = { ...store, ...data };
    this.stores.set(id, updatedStore);
    return updatedStore;
  }

  // Conversation management
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByStoreId(storeId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) => conversation.storeId === storeId,
    );
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const newConversation: Conversation = { 
      ...conversation, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async updateConversationStatus(id: number, status: string): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const now = new Date();
    const updatedConversation = { 
      ...conversation, 
      status,
      updatedAt: now
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  // Message management
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const newMessage: Message = { 
      ...message, 
      id, 
      createdAt: now 
    };
    this.messages.set(id, newMessage);

    // Update the conversation's updatedAt timestamp
    if (message.conversationId) {
      const conversation = this.conversations.get(message.conversationId);
      if (conversation) {
        conversation.updatedAt = now;
        this.conversations.set(message.conversationId, conversation);
      }
    }

    return newMessage;
  }

  // Message Feedback management
  async getMessageFeedback(id: number): Promise<MessageFeedback | undefined> {
    return this.messageFeedbacks.get(id);
  }

  async getFeedbackByMessageId(messageId: number): Promise<MessageFeedback | undefined> {
    return Array.from(this.messageFeedbacks.values()).find(
      (feedback) => feedback.messageId === messageId
    );
  }

  async createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback> {
    const id = this.currentMessageFeedbackId++;
    const now = new Date();
    const newFeedback: MessageFeedback = {
      ...feedback,
      id,
      createdAt: now
    };
    this.messageFeedbacks.set(id, newFeedback);
    return newFeedback;
  }

  async getFeedbackStats(storeId: number): Promise<{
    positiveCount: number;
    negativeCount: number;
    totalCount: number;
    positivePercentage: number;
  }> {
    // First, get all messages for the store's conversations
    const conversations = await this.getConversationsByStoreId(storeId);
    const conversationIds = conversations.map(conv => conv.id);
    
    // Get all message IDs for these conversations
    const messages = Array.from(this.messages.values())
      .filter(msg => conversationIds.includes(msg.conversationId));
    
    const messageIds = messages.map(msg => msg.id);
    
    // Get all feedback for these messages
    const feedbacks = Array.from(this.messageFeedbacks.values())
      .filter(feedback => messageIds.includes(feedback.messageId));
    
    // Calculate stats
    const positiveCount = feedbacks.filter(f => f.rating === 'positive').length;
    const negativeCount = feedbacks.filter(f => f.rating === 'negative').length;
    const totalCount = feedbacks.length;
    
    // Calculate percentage (avoid division by zero)
    const positivePercentage = totalCount === 0 
      ? 0 
      : Math.round((positiveCount / totalCount) * 100);
    
    return {
      positiveCount,
      negativeCount,
      totalCount,
      positivePercentage
    };
  }
  
  // FAQ Category management
  async getFaqCategory(id: number): Promise<FaqCategory | undefined> {
    return this.faqCategories.get(id);
  }

  async getFaqCategoriesByStoreId(storeId: number): Promise<FaqCategory[]> {
    return Array.from(this.faqCategories.values())
      .filter(category => category.storeId === storeId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory> {
    const id = this.currentFaqCategoryId++;
    const now = new Date();
    const newCategory: FaqCategory = {
      ...category,
      id,
      createdAt: now
    };
    this.faqCategories.set(id, newCategory);
    return newCategory;
  }

  async updateFaqCategory(id: number, data: Partial<FaqCategory>): Promise<FaqCategory | undefined> {
    const category = this.faqCategories.get(id);
    if (!category) return undefined;

    const updatedCategory = {
      ...category,
      ...data
    };
    this.faqCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteFaqCategory(id: number): Promise<boolean> {
    return this.faqCategories.delete(id);
  }

  // FAQ management
  async getFaq(id: number): Promise<Faq | undefined> {
    return this.faqs.get(id);
  }

  async getFaqsByStoreId(storeId: number): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(faq => faq.storeId === storeId)
      .sort((a, b) => {
        // First sort by category ID
        const categoryComparison = (a.categoryId || 0) - (b.categoryId || 0);
        if (categoryComparison !== 0) return categoryComparison;
        
        // If same category, sort by sortOrder
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }

  async getFaqsByCategoryId(categoryId: number): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(faq => faq.categoryId === categoryId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const id = this.currentFaqId++;
    const now = new Date();
    const newFaq: Faq = { 
      ...faq, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.faqs.set(id, newFaq);
    return newFaq;
  }

  async updateFaq(id: number, data: Partial<Faq>): Promise<Faq | undefined> {
    const faq = this.faqs.get(id);
    if (!faq) return undefined;

    const now = new Date();
    const updatedFaq = { 
      ...faq, 
      ...data,
      updatedAt: now
    };
    this.faqs.set(id, updatedFaq);
    return updatedFaq;
  }

  async updateFaqSortOrder(id: number, sortOrder: number): Promise<Faq | undefined> {
    const faq = this.faqs.get(id);
    if (!faq) return undefined;

    const now = new Date();
    const updatedFaq = {
      ...faq,
      sortOrder,
      updatedAt: now
    };
    this.faqs.set(id, updatedFaq);
    return updatedFaq;
  }

  async deleteFaq(id: number): Promise<boolean> {
    return this.faqs.delete(id);
  }

  // Settings management
  async getSettings(id: number): Promise<Settings | undefined> {
    return this.settingsMap.get(id);
  }

  async getSettingsByStoreId(storeId: number): Promise<Settings | undefined> {
    return Array.from(this.settingsMap.values()).find(
      (settings) => settings.storeId === storeId,
    );
  }

  async createSettings(settings: InsertSettings): Promise<Settings> {
    const id = this.currentSettingsId++;
    const newSettings: Settings = { ...settings, id };
    this.settingsMap.set(id, newSettings);
    return newSettings;
  }

  async updateSettings(id: number, data: Partial<Settings>): Promise<Settings | undefined> {
    const settings = this.settingsMap.get(id);
    if (!settings) return undefined;

    const updatedSettings = { ...settings, ...data };
    this.settingsMap.set(id, updatedSettings);
    return updatedSettings;
  }

  // Customer Profile management
  async getCustomerProfile(id: number): Promise<CustomerProfile | undefined> {
    return this.customerProfiles.get(id);
  }

  async getCustomerProfileByIdentifier(storeId: number, identifier: string): Promise<CustomerProfile | undefined> {
    return Array.from(this.customerProfiles.values()).find(
      profile => profile.storeId === storeId && profile.identifier === identifier
    );
  }

  async getCustomerProfileByVisitorId(storeId: number, visitorId: string): Promise<CustomerProfile | undefined> {
    return Array.from(this.customerProfiles.values()).find(
      profile => profile.storeId === storeId && profile.visitorId === visitorId
    );
  }

  async getCustomerProfilesByStoreId(storeId: number): Promise<CustomerProfile[]> {
    return Array.from(this.customerProfiles.values()).filter(
      profile => profile.storeId === storeId
    );
  }

  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    const id = this.currentCustomerProfileId++;
    const now = new Date();
    const newProfile: CustomerProfile = {
      ...profile,
      id,
      firstSeen: now,
      lastSeen: now,
      conversationCount: profile.conversationCount || 1
    };
    this.customerProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateCustomerProfile(id: number, data: Partial<CustomerProfile>): Promise<CustomerProfile | undefined> {
    const profile = this.customerProfiles.get(id);
    if (!profile) return undefined;

    const updatedProfile = { ...profile, ...data };
    this.customerProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  // Cart Recovery management
  async getAbandonedCart(id: number): Promise<AbandonedCart | undefined> {
    return this.abandonedCarts.get(id);
  }
  
  async getAbandonedCartsByCustomerEmail(storeId: number, email: string): Promise<AbandonedCart[]> {
    return Array.from(this.abandonedCarts.values())
      .filter(cart => 
        cart.storeId === storeId && 
        cart.customerEmail === email
      )
      .sort((a, b) => {
        // Sort by most recent first
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getAbandonedCartsByCustomerProfile(profileId: number): Promise<AbandonedCart[]> {
    return Array.from(this.abandonedCarts.values())
      .filter(cart => cart.customerProfileId === profileId)
      .sort((a, b) => {
        // Sort by most recent first
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async getRecentAbandonedCarts(storeId: number, hours: number = 24): Promise<AbandonedCart[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return Array.from(this.abandonedCarts.values())
      .filter(cart => 
        cart.storeId === storeId && 
        cart.createdAt && 
        cart.createdAt > cutoffTime
      );
  }

  async saveAbandonedCart(cart: InsertAbandonedCart): Promise<AbandonedCart> {
    const id = this.currentCartId++;
    const now = new Date();
    
    // Check if this cart already exists
    const existingCart = Array.from(this.abandonedCarts.values()).find(
      c => c.storeId === cart.storeId && c.shopifyCheckoutId === cart.shopifyCheckoutId
    );
    
    if (existingCart) {
      // Update existing cart
      const updatedCart: AbandonedCart = {
        ...existingCart,
        ...cart,
        id: existingCart.id,
        updatedAt: now
      };
      this.abandonedCarts.set(existingCart.id, updatedCart);
      return updatedCart;
    }
    
    // Create new cart
    const newCart: AbandonedCart = {
      ...cart,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.abandonedCarts.set(id, newCart);
    return newCart;
  }

  async syncAbandonedCarts(store: Store): Promise<AbandonedCart[]> {
    // This would connect to Shopify API in the real implementation
    // For now, just return existing carts for this store
    return Array.from(this.abandonedCarts.values())
      .filter(cart => cart.storeId === store.id);
  }

  async recordCartRecoveryAttempt(cartId: number, messageData: any): Promise<CartRecoveryAttempt> {
    const id = this.currentCartRecoveryAttemptId++;
    const now = new Date();
    
    const cart = this.abandonedCarts.get(cartId);
    if (!cart) {
      throw new Error(`Cart with ID ${cartId} not found`);
    }
    
    const attempt: CartRecoveryAttempt = {
      id,
      cartId,
      conversationId: messageData.conversationId || null,
      messageId: messageData.messageId || null,
      messageContent: messageData.messageContent || null,
      discountCodeOffered: messageData.discountCode || null,
      discountAmount: messageData.discountAmount || null,
      status: 'sent',
      sentAt: now,
      convertedAt: null,
      createdAt: now
    };
    
    this.cartRecoveryAttempts.set(id, attempt);
    return attempt;
  }

  async getCartRecoveryAttempts(storeId: number, cartId?: number, status?: string): Promise<CartRecoveryAttempt[]> {
    // First, get all carts for this store
    const storeCarts = Array.from(this.abandonedCarts.values())
      .filter(cart => cart.storeId === storeId)
      .map(cart => cart.id);
    
    // Then get attempts for these carts
    let attempts = Array.from(this.cartRecoveryAttempts.values())
      .filter(attempt => storeCarts.includes(attempt.cartId));
    
    if (cartId) {
      attempts = attempts.filter(attempt => attempt.cartId === cartId);
    }
    
    if (status) {
      attempts = attempts.filter(attempt => attempt.status === status);
    }
    
    return attempts.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime(); // newest first
    });
  }

  async updateCartRecoveryStatus(attemptId: number, status: string): Promise<CartRecoveryAttempt | null> {
    const attempt = this.cartRecoveryAttempts.get(attemptId);
    if (!attempt) return null;
    
    const now = new Date();
    const updatedAttempt: CartRecoveryAttempt = {
      ...attempt,
      status,
      convertedAt: status === 'converted' ? now : attempt.convertedAt
    };
    
    this.cartRecoveryAttempts.set(attemptId, updatedAttempt);
    return updatedAttempt;
  }

  generateCartRecoveryMessage(cart: AbandonedCart, customerName?: string, includeDiscount: boolean = false): any {
    const greeting = customerName ? `Hi ${customerName},` : 'Hi there,';
    
    // Make sure cartItems is properly handled as an array
    let cartItemsArray: any[] = [];
    
    if (Array.isArray(cart.cartItems)) {
      cartItemsArray = cart.cartItems;
    } else if (cart.cartItems && typeof cart.cartItems === 'object') {
      // Try to convert from JSON if it's a string or object
      try {
        if (typeof cart.cartItems === 'string') {
          cartItemsArray = JSON.parse(cart.cartItems);
        } else {
          // It's an object but not an array, try to handle it
          cartItemsArray = [cart.cartItems];
        }
      } catch (error) {
        console.error("Error parsing cart items:", error);
        cartItemsArray = [];
      }
    }
    
    const itemCount = cartItemsArray.length;
    const itemText = itemCount === 1 ? 'item' : 'items';
    
    // Create a detailed message showing cart contents
    let itemsList = "";
    if (itemCount > 0) {
      itemsList = "\n\nYour cart contains:\n";
      cartItemsArray.forEach((item, index) => {
        itemsList += `${index + 1}. ${item.title} - Quantity: ${item.quantity} - Price: $${item.price}\n`;
      });
    }
    
    let message = `${greeting} I found your shopping cart with ${itemCount} ${itemText}.${itemsList}\nWould you like to complete your purchase?`;
    
    let discountCode;
    let discountAmount;
    
    if (includeDiscount) {
      // Generate a unique discount code
      discountCode = `RECOVER${Math.floor(Math.random() * 10000)}`;
      discountAmount = '10%';
      
      message += `\n\nAs a special offer, I'd like to give you ${discountAmount} off your purchase with code ${discountCode}.`;
    }
    
    if (cart.checkoutUrl) {
      message += `\n\nYou can complete your purchase here: ${cart.checkoutUrl}`;
    }
    
    message += "\n\nCan I help with any questions about the products in your cart?";
    
    return {
      message,
      discountCode,
      discountAmount
    };
  }

  // Missing conversation management methods
  async getConversationsByCustomerProfileId(profileId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      conversation => conversation.customerProfileId === profileId
    );
  }

  async updateConversationMemoryContext(id: number, memoryContext: any): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const now = new Date();
    const updatedConversation = {
      ...conversation,
      memoryContext,
      updatedAt: now
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  // Message Feedback management
  async getMessageFeedback(id: number): Promise<MessageFeedback | undefined> {
    return this.messageFeedbacks.get(id);
  }

  async getFeedbackByMessageId(messageId: number): Promise<MessageFeedback | undefined> {
    return Array.from(this.messageFeedbacks.values()).find(
      (feedback) => feedback.messageId === messageId
    );
  }

  async createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback> {
    const id = this.currentMessageFeedbackId++;
    const now = new Date();
    const newFeedback: MessageFeedback = {
      ...feedback,
      id,
      createdAt: now
    };
    this.messageFeedbacks.set(id, newFeedback);
    return newFeedback;
  }

  async getFeedbackStats(storeId: number): Promise<{
    positiveCount: number;
    negativeCount: number;
    totalCount: number;
    positivePercentage: number;
  }> {
    // First, get all messages for the store's conversations
    const conversations = await this.getConversationsByStoreId(storeId);
    const conversationIds = conversations.map(conv => conv.id);
    
    // Get all message IDs for these conversations
    const messages = Array.from(this.messages.values())
      .filter(msg => conversationIds.includes(msg.conversationId));
    
    const messageIds = messages.map(msg => msg.id);
    
    // Get all feedback for these messages
    const feedbacks = Array.from(this.messageFeedbacks.values())
      .filter(feedback => messageIds.includes(feedback.messageId));
    
    // Calculate stats
    const positiveCount = feedbacks.filter(f => f.rating === 'positive').length;
    const negativeCount = feedbacks.filter(f => f.rating === 'negative').length;
    const totalCount = feedbacks.length;
    
    // Calculate percentage (avoid division by zero)
    const positivePercentage = totalCount === 0 
      ? 0 
      : Math.round((positiveCount / totalCount) * 100);
    
    return {
      positiveCount,
      negativeCount,
      totalCount,
      positivePercentage
    };
  }

  // Cart Recovery Automation management
  async getAutomationSettings(storeId: number): Promise<AutomationSettings | null> {
    const settings = Array.from(this.automationSettings.values()).find(
      setting => setting.storeId === storeId
    );
    return settings || null;
  }
  
  async createAutomationSettings(settings: InsertAutomationSettings): Promise<AutomationSettings> {
    const id = this.currentAutomationSettingsId++;
    const now = new Date().toISOString();
    
    const newSettings: AutomationSettings = {
      ...settings,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.automationSettings.set(id, newSettings);
    return newSettings;
  }
  
  async updateAutomationSettings(id: number, data: Partial<AutomationSettings>): Promise<AutomationSettings | null> {
    const settings = this.automationSettings.get(id);
    if (!settings) return null;
    
    const updatedSettings: AutomationSettings = {
      ...settings,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.automationSettings.set(id, updatedSettings);
    return updatedSettings;
  }
  
  async getStoresWithAutomation(): Promise<Store[]> {
    // Get all store IDs that have automation settings enabled
    const storeIds = Array.from(this.automationSettings.values())
      .filter(settings => settings.isEnabled)
      .map(settings => settings.storeId);
    
    // Get the store objects for those IDs
    return Array.from(this.stores.values()).filter(
      store => storeIds.includes(store.id)
    );
  }
  
  async getCartsForAutomation(storeId: number): Promise<AbandonedCart[]> {
    // Get abandoned carts from the last 72 hours (maximum potential automation window)
    const carts = await this.getRecentAbandonedCarts(storeId, 72);
    
    // Filter to only include carts with customer email (required for sending messages)
    return carts.filter(cart => cart.customerEmail);
  }
  
  async getRecoveryAttemptsByCart(cartId: number): Promise<CartRecoveryAttempt[]> {
    return Array.from(this.cartRecoveryAttempts.values())
      .filter(attempt => attempt.cartId === cartId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
  }
  
  // Helper method to generate cart recovery message with placeholders filled in
  generateCartRecoveryMessage(
    cart: AbandonedCart, 
    customerName?: string,
    includeDiscount: boolean = false
  ): { message: string; discountCode: string | null; discountAmount: string | null } {
    // Get store info
    const store = this.stores.get(cart.storeId);
    const storeName = store ? store.name : 'Our Store';
    
    // Format cart items
    let cartItems = "No items";
    let totalAmount = 0;
    
    try {
      if (cart.cartItems && typeof cart.cartItems === 'object') {
        const items = Array.isArray(cart.cartItems) ? cart.cartItems : JSON.parse(JSON.stringify(cart.cartItems));
        
        if (items.length > 0) {
          // Calculate total
          items.forEach(item => {
            const quantity = item.quantity || 1;
            const price = parseFloat(item.price?.toString() || "0");
            totalAmount += quantity * price;
          });
          
          // Format items with more details
          cartItems = items.map(item => {
            const quantity = item.quantity || 1;
            const price = parseFloat(item.price?.toString() || "0");
            const subtotal = quantity * price;
            
            let itemLine = `- **${item.title || 'Product'}**\n`;
            itemLine += `  • Quantity: ${quantity}\n`;
            
            if (price > 0) {
              itemLine += `  • Price: $${price.toFixed(2)}\n`;
              itemLine += `  • Subtotal: $${subtotal.toFixed(2)}`;
            }
            
            return itemLine;
          }).join('\n\n');
          
          // Add total if we have price information
          if (totalAmount > 0) {
            cartItems += `\n\n**Total: $${totalAmount.toFixed(2)}**`;
          }
        }
      }
    } catch (e) {
      console.error("Error formatting cart items:", e);
    }
    
    // Generate a discount code if needed
    let discountCode = null;
    let discountAmount = null;
    
    if (includeDiscount) {
      // Generate a unique discount code with store prefix + random alphanumeric
      const prefix = storeName.substring(0, 3).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      discountCode = `${prefix}-${randomPart}`;
      
      // Get the discount amount from settings
      const settings = Array.from(this.automationSettings.values())
        .find(s => s.storeId === cart.storeId);
      
      if (settings) {
        discountAmount = settings.discountAmount;
      } else {
        discountAmount = "10%"; // Default discount
      }
    }
    
    // Prepare the message template with placeholders
    let message = `Hello ${customerName || "Valued Customer"},

I've found your shopping cart with the following items:

${cartItems}

**Ready to complete your purchase?** 
[Click here to checkout now](${cart.checkoutUrl || "https://shop.example.com"})

`;

    // Add discount code info if applicable
    if (includeDiscount && discountCode) {
      message += `**SPECIAL OFFER:** 
I've created a discount code just for you! 
Use code: **${discountCode}** at checkout to get ${discountAmount} off your purchase.

`;
    }

    message += `If you have any questions about these products or need help with your order, just let me know!

Thank you,
${storeName} Team`;
    
    return {
      message,
      discountCode,
      discountAmount
    };
  }

  // WordPress Data Cache Management
  async saveWordpressData(data: InsertWordpressDataCache): Promise<WordpressDataCache> {
    // Check if data for this storeId and dataType already exists
    const existing = await this.getWordpressData(data.storeId, data.dataType);
    
    if (existing) {
      // Update existing entry
      existing.data = data.data ?? null;
      existing.lastSynced = new Date();
      this.wordpressCache.set(existing.id, existing);
      return existing;
    } else {
      // Create new entry
      const newCacheEntry: WordpressDataCache = {
        ...data,
        id: this.currentWordpressCacheId++,
        lastSynced: new Date(),
      };
      this.wordpressCache.set(newCacheEntry.id, newCacheEntry);
      return newCacheEntry;
    }
  }

  async getWordpressData(storeId: number, dataType: string): Promise<WordpressDataCache | undefined> {
    return Array.from(this.wordpressCache.values()).find(
      (entry) => entry.storeId === storeId && entry.dataType === dataType,
    );
  }

  async getLatestWordpressDataTimestamp(storeId: number): Promise<Date | null> {
    const entries = Array.from(this.wordpressCache.values())
      .filter(entry => entry.storeId === storeId)
      .sort((a, b) => (b.lastSynced?.getTime() ?? 0) - (a.lastSynced?.getTime() ?? 0));
      
    return entries.length > 0 ? entries[0].lastSynced : null;
  }
}

export const storage = new MemStorage();
