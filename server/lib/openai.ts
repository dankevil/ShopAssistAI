import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

export class OpenAIService {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async generateChatResponse(
    messages: Array<{ role: string; content: string }>,
    context?: { 
      storeInfo?: any; 
      products?: any[]; 
      faqs?: any[];
    }
  ): Promise<string> {
    try {
      // Create system message with context
      let systemContent = "You are a helpful AI assistant for an e-commerce store. ";
      
      if (context?.storeInfo) {
        systemContent += `You are representing ${context.storeInfo.name}. `;
      }
      
      if (context?.faqs && context.faqs.length > 0) {
        systemContent += "\n\nHere are some frequently asked questions you can reference:\n";
        context.faqs.forEach((faq, index) => {
          systemContent += `${index + 1}. Q: ${faq.question}\nA: ${faq.answer}\n\n`;
        });
      }
      
      if (context?.products && context.products.length > 0) {
        systemContent += "\n\nHere are some products you can reference:\n";
        context.products.forEach((product, index) => {
          systemContent += `${index + 1}. Product: ${product.title}\n`;
          systemContent += `   Price: ${product.price}\n`;
          systemContent += `   Description: ${product.description}\n\n`;
        });
      }
      
      systemContent += "\nProvide helpful, accurate, and concise responses. If you don't know the answer to a question, suggest that the customer contact support.";
      
      const allMessages = [
        { role: "system", content: systemContent },
        ...messages
      ];
      
      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: allMessages as any,
      });
      
      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Error generating OpenAI response:", error);
      throw new Error("Failed to generate AI response");
    }
  }
  
  async findProductRecommendations(query: string, products: any[]): Promise<any[]> {
    try {
      const productDescriptions = products.map((p, i) => 
        `${i + 1}. ${p.title}: ${p.description} (Price: ${p.price})`
      ).join("\n");
      
      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a product recommendation assistant. Based on the customer query, recommend the most relevant products from the list. Respond with a JSON array of product indices (starting from 0)."
          },
          {
            role: "user",
            content: `Customer query: "${query}"\n\nAvailable products:\n${productDescriptions}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message.content;
      if (!content) return [];
      
      const parsed = JSON.parse(content);
      const recommendedIndices = parsed.recommendations || [];
      
      // Return the actual product objects
      return recommendedIndices
        .filter((index: number) => index >= 0 && index < products.length)
        .map((index: number) => products[index]);
    } catch (error) {
      console.error("Error finding product recommendations:", error);
      return [];
    }
  }
  
  async detectOrderLookupIntent(message: string): Promise<{
    isOrderLookup: boolean;
    orderId?: string;
    email?: string;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You analyze if a customer message is attempting to look up an order. Extract any order IDs (usually numbers or alphanumeric codes) and email addresses. Respond with JSON in this format: { 'isOrderLookup': boolean, 'orderId': string or null, 'email': string or null }"
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        return { isOrderLookup: false };
      }
      
      const result = JSON.parse(content);
      return {
        isOrderLookup: result.isOrderLookup || false,
        orderId: result.orderId || undefined,
        email: result.email || undefined
      };
    } catch (error) {
      console.error("Error detecting order lookup intent:", error);
      return { isOrderLookup: false };
    }
  }
}
