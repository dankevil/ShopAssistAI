import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'missing-api-key'  
});

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateChatResponse(
  messages: ChatMessage[],
  storeData?: any,
  settings?: any
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    // Include store context if available
    const contextualizedMessages = [...messages];
    
    // Extract settings or use defaults
    const aiCustomization = settings?.aiCustomization || {
      conversationMode: 'balanced',
      tone: 'professional',
      responseLength: 'medium',
      creativity: 50,
      knowledgePriority: 'balanced'
    };
    
    const customTraining = settings?.customTraining || {
      additionalInstructions: '',
      prohibitedTopics: '',
      favoredProducts: '',
      customFAQs: ''
    };
    
    const features = settings?.chatbotFeatures || {
      productSearch: true,
      orderStatus: true,
      recommendations: true,
      inventory: true
    };
    
    // Extract conversation context if available
    const conversationContext = storeData?.conversationContext;

    // Build instructions based on settings
    const toneInstruction = getToneInstruction(aiCustomization.tone);
    const lengthInstruction = getLengthInstruction(aiCustomization.responseLength);
    const modeInstruction = getModeInstruction(aiCustomization.conversationMode);
    
    // Build customized system prompt with conversation context if available
    let systemPrompt = `You are a helpful AI assistant for ${storeData?.name || 'an e-commerce store'}. ${modeInstruction} ${toneInstruction} ${lengthInstruction}`;
    
    // Add conversation context enhancements if available
    if (conversationContext) {
      // Add conversation topics and stage
      if (conversationContext.topics && conversationContext.topics.length > 0) {
        systemPrompt += `\n\nThe conversation has covered these topics: ${conversationContext.topics.join(', ')}.`;
      }
      
      // Add information about the conversation stage for more natural flow
      if (conversationContext.conversationStage) {
        const stageTips = {
          'greeting': 'This conversation is just beginning. Be welcoming and help identify what the customer needs.',
          'information_gathering': 'You are gathering information about the customer\'s needs. Ask relevant follow-up questions.',
          'problem_solving': 'The customer has a problem to solve. Focus on providing clear solutions.',
          'recommendation': 'The customer is looking for product recommendations. Be specific and personalized.',
          'checkout': 'The customer is in the checkout process. Help them complete their purchase smoothly.',
          'closing': 'The conversation is wrapping up. Ensure all the customer\'s needs have been met.'
        };
        
        systemPrompt += `\n\n${stageTips[conversationContext.conversationStage as keyof typeof stageTips] || ''}`;
      }
      
      // Add last mentioned product for continuity
      if (conversationContext.lastMentionedProduct?.name) {
        systemPrompt += `\n\nThe customer recently mentioned the product: ${conversationContext.lastMentionedProduct.name}.`;
      }
      
      // Add sentiment-aware response guidance
      if (conversationContext.sentimentScore < -0.3) {
        systemPrompt += `\n\nThe customer appears frustrated or dissatisfied. Be especially empathetic and solution-focused.`;
      } else if (conversationContext.sentimentScore > 0.3) {
        systemPrompt += `\n\nThe customer appears satisfied. Maintain this positive experience.`;
      }
      
      // Add any unanswered questions that should be addressed
      if (conversationContext.unansweredQuestions && conversationContext.unansweredQuestions.length > 0) {
        systemPrompt += `\n\nThese customer questions have not been fully addressed yet: ${conversationContext.unansweredQuestions.join('; ')}`;
      }
    }
    
    // Add feature availability information
    systemPrompt += `\n\nYou can assist with the following features:${
      features.productSearch ? '\n- Searching for products' : ''
    }${
      features.orderStatus ? '\n- Checking order status' : ''
    }${
      features.recommendations ? '\n- Providing product recommendations' : ''
    }${
      features.inventory ? '\n- Checking inventory status' : ''
    }`;
    
    // Add custom instructions if available
    if (customTraining.additionalInstructions) {
      systemPrompt += `\n\nAdditional instructions: ${customTraining.additionalInstructions}`;
    }
    
    // Add prohibited topics if available
    if (customTraining.prohibitedTopics) {
      systemPrompt += `\n\nDo NOT discuss the following topics: ${customTraining.prohibitedTopics}`;
    }
    
    // Add favored products if available
    if (customTraining.favoredProducts) {
      systemPrompt += `\n\nWhen appropriate, suggest these featured products: ${customTraining.favoredProducts}`;
    }
    
    // Add custom FAQs if available
    if (customTraining.customFAQs) {
      systemPrompt += `\n\nHere are common questions and their answers:
      ${customTraining.customFAQs}`;
    }
    
    // Add store data if available
    if (storeData) {
      systemPrompt += `\n\nUse the following store information to provide accurate responses about products, policies, and general information: 
      ${JSON.stringify(storeData)}`;
    }
    
    systemPrompt += `\n\nInstructions for abandoned cart questions:
    - When users mention anything about their cart, shopping cart, checkout, or completing a purchase, encourage them to complete their purchase
    - Make it easy for them to proceed with checkout if they express interest
    - If they have questions about items in their cart, answer them helpfully`;
    
    // Add fallback instruction
    systemPrompt += `\n\nIf you don't know an answer, suggest contacting customer support.`;
    
    // Add the system prompt to messages
    contextualizedMessages.unshift({
      role: "system",
      content: systemPrompt
    });

    // Set the temperature based on creativity level (0.1-1.5 scale)
    const temperature = Math.max(0.1, Math.min(1.5, aiCustomization.creativity / 50));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: contextualizedMessages,
      temperature: temperature,
    });

    return response.choices[0].message.content || "I'm unable to generate a response at the moment. Please try again.";
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return "I'm experiencing technical difficulties. Please try again later.";
  }
}

// Helper functions to generate instructions based on settings
function getToneInstruction(tone: string): string {
  switch (tone) {
    case 'professional':
      return 'Maintain a professional and respectful tone.';
    case 'friendly':
      return 'Use a warm, friendly, and conversational tone.';
    case 'enthusiastic':
      return 'Be enthusiastic and upbeat in your responses.';
    case 'empathetic':
      return 'Show empathy and understanding in your responses.';
    case 'direct':
      return 'Be direct and straightforward in your responses.';
    default:
      return 'Maintain a professional and respectful tone.';
  }
}

function getLengthInstruction(length: string): string {
  switch (length) {
    case 'concise':
      return 'Keep your responses brief and to the point.';
    case 'medium':
      return 'Provide detailed responses but avoid unnecessary information.';
    case 'detailed':
      return 'Provide comprehensive and thorough responses when appropriate.';
    default:
      return 'Provide detailed responses but avoid unnecessary information.';
  }
}

function getModeInstruction(mode: string): string {
  switch (mode) {
    case 'basic':
      return 'Focus on answering questions directly without adding additional context.';
    case 'balanced':
      return 'Balance providing answers with offering relevant additional information when helpful.';
    case 'expert':
      return 'Act as a knowledgeable sales assistant who deeply understands products and can offer expert recommendations.';
    default:
      return 'Balance providing answers with offering relevant additional information when helpful.';
  }
}

export async function matchFAQIntent(
  userQuery: string,
  faqs: Array<{ question: string; answer: string }>
): Promise<{ matched: boolean; faqIndex?: number; confidence?: number }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    if (!faqs || faqs.length === 0) {
      return { matched: false };
    }

    const prompt = `
    User Query: "${userQuery}"
    
    FAQs:
    ${faqs.map((faq, index) => `${index + 1}. ${faq.question}`).join('\n')}
    
    Analyze the user's query and determine if it matches any of the FAQs above.
    If there's a match, provide the FAQ number and a confidence score (0-1).
    If there's no good match, indicate that.
    
    Respond with JSON in this format:
    {
      "matched": boolean,
      "faqIndex": number or null,
      "confidence": number between 0 and 1 or null
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (result.matched && typeof result.faqIndex === 'number' && result.faqIndex > 0) {
      // Adjust index to be 0-based
      return { 
        matched: true, 
        faqIndex: result.faqIndex - 1, 
        confidence: result.confidence 
      };
    }
    
    return { matched: false };
  } catch (error) {
    console.error("OpenAI FAQ matching error:", error);
    return { matched: false };
  }
}

export async function analyzeConversationIntent(messages: ChatMessage[]): Promise<{
  intent: string;
  orderNumber?: string;
  productQuery?: string;
  customerEmail?: string;
  completePurchase?: boolean;
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    // Extract only user messages
    const userMessages = messages
      .filter(msg => msg.role === "user")
      .map(msg => msg.content)
      .join('\n');

    const prompt = `
    Analyze the following customer messages and determine the primary intent:
    
    ${userMessages}
    
    Possible intents include:
    - order_status (customer wants to know about an order)
    - product_info (customer is asking about products)
    - abandoned_cart (customer is asking about items in their cart, wants to complete a purchase, or mentions checkout)
    - general_question (general inquiry)
    - support_request (customer needs help)
    
    IMPORTANT: When a customer asks about "my cart", "my shopping cart", "items in my cart", "complete my purchase",
    "checkout", "proceed to checkout", or anything related to their shopping cart or completing a purchase, 
    ALWAYS classify this as "abandoned_cart" intent.
    
    Extract the following if present:
    - Order number (if the customer mentions one)
    - Product query (what product they're asking about)
    - Customer email (if they provide it)
    - "completePurchase": true (if they specifically want to complete their purchase)
    - Whether the customer explicitly wants to complete their purchase (true/false)
    
    Respond with JSON in this format:
    {
      "intent": "one of the intents listed above",
      "orderNumber": "the order number if mentioned, otherwise null",
      "productQuery": "what product they're asking about if applicable, otherwise null",
      "customerEmail": "customer email if provided, otherwise null",
      "completePurchase": boolean indicating if they want to complete a purchase
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      intent: result.intent || "general_question",
      orderNumber: result.orderNumber || undefined,
      productQuery: result.productQuery || undefined,
      customerEmail: result.customerEmail || undefined,
      completePurchase: result.completePurchase || false
    };
  } catch (error) {
    console.error("OpenAI conversation analysis error:", error);
    return { intent: "general_question" };
  }
}
