import OpenAI from "openai";
import { type Message, type Conversation, conversations } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'missing-api-key'  
});

interface ConversationContext {
  topics: string[];
  keyEntities: string[];
  customerIntent: string;
  unansweredQuestions: string[];
  conversationStage: 'greeting' | 'information_gathering' | 'problem_solving' | 'recommendation' | 'checkout' | 'closing';
  sentimentScore: number; // -1 to 1
  satisfactionStatus: 'unknown' | 'dissatisfied' | 'neutral' | 'satisfied';
  lastMentionedProduct?: {
    id?: number;
    name: string;
  };
}

/**
 * Analyzes conversation and maintains context for more natural interactions
 */
export async function manageConversationContext(
  conversation: Conversation,
  messages: Message[],
  includeSystemMessage: boolean = false
): Promise<{ 
  updatedMessages: any[];
  contextSummary: ConversationContext;
}> {
  try {
    // Get or initialize context
    let memoryContext: any = conversation.memoryContext || {};
    let contextData: ConversationContext = memoryContext.contextData || {
      topics: [],
      keyEntities: [],
      customerIntent: 'general_inquiry',
      unansweredQuestions: [],
      conversationStage: 'greeting',
      sentimentScore: 0,
      satisfactionStatus: 'unknown'
    };
    
    // Only analyze if we have at least one message in the conversation
    if (messages.length > 0) {
      // Process recent messages to update context
      contextData = await analyzeConversationContext(messages, contextData);
      
      // Update the conversation's memory context
      memoryContext.contextData = contextData;
      await db.update(conversations)
        .set({ memoryContext })
        .where(eq(conversations.id, conversation.id));
    }
    
    // Format messages for OpenAI with context
    const formattedMessages = formatMessagesWithContext(messages, contextData, includeSystemMessage);
    
    return {
      updatedMessages: formattedMessages,
      contextSummary: contextData
    };
  } catch (error) {
    console.error("Error managing conversation context:", error);
    return {
      updatedMessages: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
      contextSummary: {
        topics: [],
        keyEntities: [],
        customerIntent: 'general_inquiry',
        unansweredQuestions: [],
        conversationStage: 'greeting',
        sentimentScore: 0,
        satisfactionStatus: 'unknown'
      }
    };
  }
}

/**
 * Analyzes conversation to determine context
 */
async function analyzeConversationContext(
  messages: Message[],
  previousContext: ConversationContext
): Promise<ConversationContext> {
  try {
    // Only analyze if we have messages
    if (messages.length === 0) {
      return previousContext;
    }
    
    // Get all message content formatted for analysis
    const conversationHistory = messages
      .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n');
      
    // Include previous context in the prompt
    const previousTopics = previousContext.topics.join(', ');
    const previousEntities = previousContext.keyEntities.join(', ');
    const previousUnanswered = previousContext.unansweredQuestions.join(', ');
    
    const prompt = `
    Analyze this e-commerce customer service conversation and extract key context:
    
    ${conversationHistory}
    
    PREVIOUS CONTEXT:
    - Topics: ${previousTopics || 'None'}
    - Key entities: ${previousEntities || 'None'}
    - Customer intent: ${previousContext.customerIntent}
    - Conversation stage: ${previousContext.conversationStage}
    - Unanswered questions: ${previousUnanswered || 'None'}
    
    Based on the ENTIRE conversation including the previous context, provide:
    
    1. A list of conversation topics (general subject areas)
    2. Key entities mentioned (specific products, categories, brands)
    3. The primary customer intent (use these categories: general_inquiry, product_question, order_status, technical_support, complaint, checkout_help)
    4. The current conversation stage (greeting, information_gathering, problem_solving, recommendation, checkout, closing)
    5. Any questions from the customer that remain unanswered
    6. A sentiment score from -1 (very negative) to 1 (very positive)
    7. The customer satisfaction status (dissatisfied, neutral, satisfied, unknown)
    8. The last product mentioned by name (if any)
    
    Return only a JSON object with these fields:
    {
      "topics": ["topic1", "topic2"],
      "keyEntities": ["entity1", "entity2"],
      "customerIntent": "one_of_the_categories_above",
      "conversationStage": "one_of_the_stages_above",
      "unansweredQuestions": ["question1", "question2"],
      "sentimentScore": number_between_negative_1_and_1,
      "satisfactionStatus": "one_of_the_statuses_above",
      "lastMentionedProduct": {
        "name": "product_name" or null
      }
    }
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Combine previous context with new insights
    return {
      topics: Array.from(new Set([...previousContext.topics, ...(result.topics || [])])),
      keyEntities: Array.from(new Set([...previousContext.keyEntities, ...(result.keyEntities || [])])),
      customerIntent: result.customerIntent || previousContext.customerIntent,
      conversationStage: result.conversationStage || previousContext.conversationStage,
      unansweredQuestions: result.unansweredQuestions || previousContext.unansweredQuestions,
      sentimentScore: typeof result.sentimentScore === 'number' 
        ? result.sentimentScore 
        : previousContext.sentimentScore,
      satisfactionStatus: result.satisfactionStatus || previousContext.satisfactionStatus,
      lastMentionedProduct: result.lastMentionedProduct?.name 
        ? { name: result.lastMentionedProduct.name } 
        : previousContext.lastMentionedProduct
    };
  } catch (error) {
    console.error("Error analyzing conversation context:", error);
    return previousContext;
  }
}

/**
 * Formats messages with appropriate context for OpenAI
 */
function formatMessagesWithContext(
  messages: Message[], 
  context: ConversationContext,
  includeSystemMessage: boolean
): any[] {
  const formattedMessages = messages.map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.content
  }));
  
  // If we should include a system message with context
  if (includeSystemMessage) {
    // Build a context-aware system prompt to help the AI maintain a natural conversation
    let contextPrompt = `You are a helpful AI assistant for an e-commerce store.`;
    
    // Add conversation context
    if (context.topics.length > 0) {
      contextPrompt += ` The conversation so far has covered: ${context.topics.join(', ')}.`;
    }
    
    // Add info about last mentioned product
    if (context.lastMentionedProduct?.name) {
      contextPrompt += ` The customer was recently discussing the product: ${context.lastMentionedProduct.name}.`;
    }
    
    // Add appropriate response guidance based on conversation stage
    switch (context.conversationStage) {
      case 'greeting':
        contextPrompt += ` This conversation is just beginning. Be welcoming and ask how you can assist.`;
        break;
        
      case 'information_gathering':
        contextPrompt += ` You're in the information gathering phase. Ask clarifying questions and help the customer articulate their needs.`;
        break;
        
      case 'problem_solving':
        contextPrompt += ` You're helping solve a problem. Be thorough and empathetic while providing solutions.`;
        break;
        
      case 'recommendation':
        contextPrompt += ` You're recommending products. Make specific, personalized recommendations based on customer preferences.`;
        break;
        
      case 'checkout':
        contextPrompt += ` The customer is in the checkout process. Help them complete their purchase efficiently and address any concerns.`;
        break;
        
      case 'closing':
        contextPrompt += ` The conversation is winding down. Ensure all questions are answered and thank the customer for their time.`;
        break;
    }
    
    // Handle unanswered questions
    if (context.unansweredQuestions.length > 0) {
      contextPrompt += ` Remember that these questions have not been fully answered yet: ${context.unansweredQuestions.join(', ')}`;
    }
    
    // Add sentiment-aware response guidance
    if (context.sentimentScore < -0.3) {
      contextPrompt += ` The customer seems frustrated or dissatisfied. Be especially empathetic and solution-focused.`;
    } else if (context.sentimentScore > 0.3) {
      contextPrompt += ` The customer seems satisfied and positive. Maintain that positive experience.`;
    }
    
    // Insert the system message at the beginning
    formattedMessages.unshift({
      role: 'system',
      content: contextPrompt
    });
  }
  
  return formattedMessages;
}

/**
 * Updates conversation with a record of a product interaction
 */
export async function trackProductInteraction(
  conversation: Conversation,
  productId: number,
  productName: string,
  action: 'viewed' | 'purchased' | 'addedToCart'
): Promise<boolean> {
  try {
    // Get existing memory context or create new one
    let memoryContext: any = conversation.memoryContext || {};
    
    // Initialize product interactions if not present
    if (!memoryContext.productInteractions) {
      memoryContext.productInteractions = [];
    }
    
    // Add the new interaction
    memoryContext.productInteractions.push({
      productId,
      productName,
      action,
      timestamp: new Date().toISOString()
    });
    
    // Update last mentioned product in context data
    if (!memoryContext.contextData) {
      memoryContext.contextData = {};
    }
    
    memoryContext.contextData.lastMentionedProduct = {
      id: productId,
      name: productName
    };
    
    // Update the conversation in the database
    await db.update(conversations)
      .set({ memoryContext })
      .where(eq(conversations.id, conversation.id));
      
    return true;
  } catch (error) {
    console.error("Error tracking product interaction:", error);
    return false;
  }
}