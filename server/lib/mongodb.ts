import { MongoClient, Collection, Db } from "mongodb";

export interface ChatLog {
  storeId: number;
  visitorId: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    url?: string;
    startTime: Date;
    endTime?: Date;
    resolved: boolean;
    orderLookup?: boolean;
  };
}

export class MongoDBClient {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private chatLogsCollection: Collection<ChatLog> | null = null;
  
  constructor(private uri: string) {}
  
  async connect(): Promise<void> {
    if (!this.client) {
      try {
        this.client = new MongoClient(this.uri);
        await this.client.connect();
        this.db = this.client.db("shopify_chatbot");
        this.chatLogsCollection = this.db.collection<ChatLog>("chat_logs");
        
        console.log("Connected to MongoDB");
      } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
      }
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.chatLogsCollection = null;
      console.log("Disconnected from MongoDB");
    }
  }
  
  async saveChatLog(chatLog: ChatLog): Promise<string> {
    try {
      if (!this.chatLogsCollection) {
        await this.connect();
      }
      
      const result = await this.chatLogsCollection!.insertOne(chatLog);
      return result.insertedId.toString();
    } catch (error) {
      console.error("Error saving chat log:", error);
      throw error;
    }
  }
  
  async getChatLogs(storeId: number, limit: number = 50, skip: number = 0): Promise<ChatLog[]> {
    try {
      if (!this.chatLogsCollection) {
        await this.connect();
      }
      
      return await this.chatLogsCollection!
        .find({ storeId })
        .sort({ "metadata.startTime": -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error("Error getting chat logs:", error);
      throw error;
    }
  }
  
  async getChatLogById(id: string): Promise<ChatLog | null> {
    try {
      if (!this.chatLogsCollection) {
        await this.connect();
      }
      
      return await this.chatLogsCollection!.findOne({ _id: id });
    } catch (error) {
      console.error("Error getting chat log by ID:", error);
      throw error;
    }
  }
  
  async updateChatLog(id: string, update: Partial<ChatLog>): Promise<boolean> {
    try {
      if (!this.chatLogsCollection) {
        await this.connect();
      }
      
      const result = await this.chatLogsCollection!.updateOne(
        { _id: id },
        { $set: update }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating chat log:", error);
      throw error;
    }
  }
  
  async getAnalytics(storeId: number): Promise<any> {
    try {
      if (!this.chatLogsCollection) {
        await this.connect();
      }
      
      const totalConversations = await this.chatLogsCollection!.countDocuments({ storeId });
      
      const resolvedConversations = await this.chatLogsCollection!.countDocuments({ 
        storeId, 
        "metadata.resolved": true 
      });
      
      const orderLookups = await this.chatLogsCollection!.countDocuments({
        storeId,
        "metadata.orderLookup": true
      });
      
      return {
        totalConversations,
        resolvedConversations,
        orderLookups,
        resolutionRate: totalConversations > 0 
          ? Math.round((resolvedConversations / totalConversations) * 100) 
          : 0
      };
    } catch (error) {
      console.error("Error getting analytics:", error);
      throw error;
    }
  }
}
