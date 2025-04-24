import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { sendConversation, ProductInfo } from '@/lib/openai';
import { 
  X, 
  Send, 
  MessageSquare, 
  Info, 
  ShoppingCart, 
  Minus, 
  AlertTriangle 
} from 'lucide-react';
import { MessageFeedback } from '@/components/ui/message-feedback';
import { useTranslation } from 'react-i18next';
import { ProductDisplay, ProductList, ProductCarousel } from '@/components/ui/product-display';
import { ImageDisplay } from '@/components/ui/image-display';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Helper function to generate the appropriate background style based on the selected theme type
 */
function getBackgroundStyles(
  type: string, 
  color: string,
  gradient: string,
  pattern: string,
  image: string
): React.CSSProperties {
  switch (type) {
    case 'solid':
      return {
        backgroundColor: color
      };
      
    case 'gradient':
      return {
        backgroundImage: gradient
      };
      
    case 'pattern':
      return {
        backgroundImage: pattern ? `url(${pattern})` : 'none',
        backgroundRepeat: 'repeat',
        backgroundColor: '#f9fafb' // Fallback color
      };
      
    case 'image':
      return {
        backgroundImage: image ? `url(${image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f9fafb' // Fallback color
      };
      
    default:
      return {
        backgroundColor: '#f9fafb'
      };
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: number; // Database message ID for feedback
  products?: ProductInfo[]; // Product information for display
  intent?: {
    type: string;
    confidence: number;
    productQuery?: string;
  };
}

interface ChatWidgetProps {
  storeId: number;
  isOpen: boolean;
  onClose: () => void;
  brandColor?: string;
  chatTitle?: string;
  welcomeMessage?: string;
  logoUrl?: string;
  chatBackgroundType?: 'solid' | 'gradient' | 'pattern' | 'image';
  chatBackgroundColor?: string;
  chatBackgroundGradient?: string;
  chatBackgroundPattern?: string;
  chatBackgroundImage?: string;
}

export function ChatWidget({
  storeId,
  isOpen,
  onClose,
  brandColor = '#4F46E5',
  chatTitle = 'Chat with us',
  welcomeMessage = 'Hello! How can I help you today?',
  logoUrl,
  chatBackgroundType = 'solid',
  chatBackgroundColor = '#f9fafb',
  chatBackgroundGradient = 'linear-gradient(to right, #f9fafb, #f3f4f6)',
  chatBackgroundPattern = '',
  chatBackgroundImage = ''
}: ChatWidgetProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | 'new'>('new');
  const [isTyping, setIsTyping] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Add welcome message when component mounts
    if (messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }
      ]);
    }
  }, [welcomeMessage, messages.length]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus input when chat is opened
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle minimize chat (just close without alert)
  const handleMinimize = () => {
    onClose();
  };

  // Handle X button click - show alert
  const handleClose = () => {
    setIsAlertOpen(true);
  };

  // Handle ending the conversation after confirmation
  const handleEndConversation = () => {
    // Add a closing message
    const endMessage: Message = {
      id: `end-${Date.now()}`,
      role: 'assistant',
      content: 'This conversation has been closed. Thank you for chatting with us!',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, endMessage]);
    
    // Reset conversation state
    setConversationId('new');
    
    // Close the alert
    setIsAlertOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Send message to backend
      const response = await sendConversation(conversationId, storeId, input);
      
      // Update conversation ID if it's new
      if (conversationId === 'new' && response.conversationId) {
        setConversationId(response.conversationId);
      }
      
      // Add bot response
      if (response.botResponse) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: response.botResponse,
          timestamp: new Date(),
          // Store message ID for feedback
          messageId: response.botMessageId,
          // Include any returned products
          products: response.products,
          // Include intent information
          intent: response.intent
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Card className="fixed bottom-20 right-5 w-[350px] md:w-[380px] h-[500px] shadow-lg z-50 flex flex-col">
        <CardHeader
          className="flex flex-row items-center justify-between p-4"
          style={{ backgroundColor: brandColor, color: 'white' }}
        >
          <div className="flex items-center">
            {logoUrl ? (
              <Avatar className="h-8 w-8 mr-2 bg-white p-1">
                <img src={logoUrl} alt="Store logo" />
              </Avatar>
            ) : (
              <MessageSquare className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">{chatTitle}</span>
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleMinimize}
              className="text-white hover:bg-white/20"
              title="Minimize"
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="text-white hover:bg-white/20"
              title="Close conversation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <ScrollArea 
          className="flex-1 p-4"
          style={{
            ...getBackgroundStyles(
              chatBackgroundType,
              chatBackgroundColor,
              chatBackgroundGradient,
              chatBackgroundPattern,
              chatBackgroundImage
            )
          }}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                    style={{ backgroundColor: `${brandColor}30` }}
                  >
                    {logoUrl ? (
                      <Avatar className="h-full w-full">
                        <img src={logoUrl} alt="Bot" />
                      </Avatar>
                    ) : (
                      <MessageSquare 
                        className="h-4 w-4"
                        style={{ color: brandColor }}
                      />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-100 text-primary-800 ml-auto'
                      : 'bg-white shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Display products in carousel if available */}
                  {message.role === 'assistant' && message.products && message.products.length > 0 && (
                    <div className="mt-4 w-full">
                      <ProductCarousel 
                        products={message.products}
                        brandColor={brandColor}
                      />
                    </div>
                  )}
                  
                  {message.role === 'assistant' && message.messageId && (
                    <MessageFeedback messageId={message.messageId} />
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                  style={{ backgroundColor: `${brandColor}30` }}
                >
                  {logoUrl ? (
                    <Avatar className="h-full w-full">
                      <img src={logoUrl} alt="Bot" />
                    </Avatar>
                  ) : (
                    <MessageSquare 
                      className="h-4 w-4"
                      style={{ color: brandColor }}
                    />
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex space-x-1 items-center h-5">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <CardFooter className="p-3 border-t">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              style={{ backgroundColor: brandColor }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
      
      {/* Alert Dialog for confirmation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this conversation? This will reset the chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndConversation}>
              Close the Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ChatButton({
  onClick,
  brandColor = '#4F46E5',
  isOpen = false
}: {
  onClick: () => void;
  brandColor?: string;
  isOpen?: boolean;
}) {
  return (
    <Button
      className="fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-lg z-40"
      style={{ backgroundColor: brandColor }}
      onClick={onClick}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <MessageSquare className="h-6 w-6" />
      )}
    </Button>
  );
}