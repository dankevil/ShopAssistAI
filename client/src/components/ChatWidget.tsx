import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ChatMessage, 
  ChatConfig, 
  createChatSession, 
  connectWebSocket, 
  sendChatMessage, 
  getWidgetPositionStyle,
  applyThemeColor
} from "@/lib/chatbot";

interface ChatWidgetProps {
  storeId: number;
  shopName: string;
  config: ChatConfig;
  className?: string;
}

const ChatWidget = ({ storeId, shopName, config, className }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: config.welcomeMessage, timestamp: new Date() }
  ]);
  const [visitorId, setVisitorId] = useState("");
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Initialize widget
  useEffect(() => {
    // Generate a visitor ID and store it
    const session = createChatSession(storeId, shopName, config);
    setVisitorId(session.visitorId);
    
    // Apply theme color
    applyThemeColor(config.primaryColor);
    
    // Connect to WebSocket
    const socket = connectWebSocket(
      (data) => {
        // Handle incoming messages
        if (data.type === "connection_established") {
          setIsConnected(true);
        } else if (data.type === "chat_response") {
          setConversationId(data.conversationId);
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: data.message, timestamp: new Date() }
          ]);
          setIsLoading(false);
        } else if (data.type === "error") {
          console.error("Error from server:", data.message);
          setIsLoading(false);
        }
      },
      () => {
        setIsConnected(true);
        socketRef.current = socket;
      },
      () => {
        setIsConnected(false);
        socketRef.current = null;
      },
      () => {
        setIsConnected(false);
        socketRef.current = null;
      }
    );
    
    socketRef.current = socket;
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [storeId, shopName, config]);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!message.trim() || !isConnected || isLoading) return;
    
    // Add user message to chat
    setMessages(prev => [
      ...prev,
      { role: "user", content: message, timestamp: new Date() }
    ]);
    
    // Send message to server
    if (socketRef.current) {
      setIsLoading(true);
      sendChatMessage(
        socketRef.current,
        storeId,
        visitorId,
        message,
        conversationId
      );
    }
    
    // Clear input
    setMessage("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Widget position styling
  const positionStyle = getWidgetPositionStyle(config.widgetPosition);
  
  return (
    <div 
      className={`fixed z-50 ${className}`}
      style={positionStyle}
    >
      {/* Chat toggle button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full shadow-lg"
          style={{ backgroundColor: config.primaryColor }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </Button>
      )}
      
      {/* Chat widget */}
      {isOpen && (
        <Card className="w-80 md:w-96 shadow-xl rounded-lg overflow-hidden">
          {/* Chat header */}
          <div 
            className="flex items-center p-4 border-b"
            style={{ backgroundColor: config.primaryColor, color: "white" }}
          >
            <div className="flex items-center flex-1">
              {config.logoUrl && (
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden mr-2">
                  <img src={config.logoUrl} alt={`${shopName} logo`} className="h-7 w-7 object-contain" />
                </div>
              )}
              <h3 className="font-semibold">{shopName}</h3>
            </div>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Chat messages */}
          <div 
            ref={chatContainerRef}
            className="p-4 bg-gray-50 h-80 overflow-y-auto flex flex-col space-y-3"
          >
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`rounded-lg p-3 shadow max-w-xs ${
                    msg.role === "user" 
                      ? "bg-primary text-white" 
                      : "bg-white text-gray-700"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: config.primaryColor } : {}}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-3 shadow max-w-xs">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Chat input */}
          <CardContent className="p-2 border-t">
            <div className="flex">
              <Input 
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isConnected || isLoading}
                className="flex-1 rounded-r-none"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!isConnected || !message.trim() || isLoading}
                style={{ backgroundColor: config.primaryColor }}
                className="rounded-l-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            
            {!isConnected && (
              <p className="text-xs text-red-500 mt-1">
                Connection lost. Please refresh the page.
              </p>
            )}
            
            <p className="text-xs text-center text-gray-500 mt-1">
              Powered by ShopGPT
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChatWidget;
