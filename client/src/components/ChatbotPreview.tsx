import { useQuery } from "@tanstack/react-query";
import { getStoreConfig } from "@/lib/api";
import { useState } from "react";
import { Link } from "wouter";

export default function ChatbotPreview() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/store-config'],
    queryFn: getStoreConfig
  });
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: config?.welcomeMessage || "Hi there! 👋 I'm your assistant. How can I help you today?" },
    { role: 'user', content: "Do you have the Floral Summer Dress in size M?" },
    { role: 'assistant', content: "Let me check that for you! Yes, the Floral Summer Dress is available in size M. Would you like me to add it to your cart?" }
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
        <div className="h-8 bg-gray-200 rounded m-4"></div>
        <div className="h-96 bg-gray-100 p-4">
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
            <div className="h-12 bg-gray-200 rounded w-2/3 ml-auto"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="h-12 bg-gray-200 rounded m-4"></div>
      </div>
    );
  }
  
  // Use default values if config is not available
  const primaryColor = config?.primaryColor || "#6366F1";
  const logoUrl = config?.logoUrl;
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Chatbot Preview</h3>
      </div>
      <div className="p-4 bg-gray-50 h-96 flex flex-col">
        <div className="flex-grow overflow-y-auto mb-4 space-y-3">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`rounded-lg p-3 shadow max-w-xs ${
                  message.role === 'user' 
                    ? `bg-primary text-white` 
                    : 'bg-white text-gray-700'
                }`}
                style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex border rounded-lg bg-white overflow-hidden">
          <input 
            type="text" 
            className="flex-grow px-4 py-2 focus:outline-none text-sm" 
            placeholder="Type a message..." 
            disabled
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button 
            className="px-4 text-primary disabled:text-gray-400"
            disabled
            style={{ color: primaryColor }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="px-4 py-5 flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium text-gray-900">Current Theme:</span>
            <span className="text-gray-600 ml-1">Brand Colors</span>
          </div>
          <Link href="/customize">
            <a className="text-sm font-medium text-primary hover:text-secondary">
              Customize
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
