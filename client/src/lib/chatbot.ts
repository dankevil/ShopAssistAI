// This file contains utility functions for the chat widget

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface ChatConfig {
  primaryColor: string;
  logoUrl?: string;
  welcomeMessage: string;
  widgetPosition: string;
}

export interface ChatSession {
  storeId: number;
  shopName: string;
  visitorId: string;
  conversationId?: number;
  messages: ChatMessage[];
  config: ChatConfig;
}

// Generate a unique visitor ID
export function generateVisitorId(): string {
  return 'visitor-' + Math.random().toString(36).substring(2, 15);
}

// Create a new chat session
export function createChatSession(
  storeId: number,
  shopName: string,
  config: ChatConfig
): ChatSession {
  const visitorId = generateVisitorId();
  
  const session: ChatSession = {
    storeId,
    shopName,
    visitorId,
    messages: [
      {
        role: "assistant",
        content: config.welcomeMessage,
        timestamp: new Date()
      }
    ],
    config
  };
  
  return session;
}

// Connect to the WebSocket server
export function connectWebSocket(
  onMessage: (message: any) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
): WebSocket {
  // Determine if we need to use wss:// or ws:// based on the current protocol
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const host = window.location.host;
  const wsUrl = `${protocol}${host}`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    if (onOpen) onOpen();
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = () => {
    if (onClose) onClose();
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };
  
  return socket;
}

// Send a chat message through WebSocket
export function sendChatMessage(
  socket: WebSocket,
  storeId: number,
  visitorId: string,
  message: string,
  conversationId?: number
): void {
  const data = {
    type: 'chat_message',
    storeId,
    visitorId,
    message,
    conversationId
  };
  
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  } else {
    console.error('WebSocket is not connected');
  }
}

// Get styling based on widget position
export function getWidgetPositionStyle(position: string): Record<string, string> {
  switch (position) {
    case 'bottom-right':
      return { bottom: '20px', right: '20px' };
    case 'bottom-left':
      return { bottom: '20px', left: '20px' };
    case 'top-right':
      return { top: '20px', right: '20px' };
    case 'top-left':
      return { top: '20px', left: '20px' };
    default:
      return { bottom: '20px', right: '20px' };
  }
}

// Apply theme colors to elements
export function applyThemeColor(color: string): void {
  const root = document.documentElement;
  
  // Convert hex to RGB for opacity variants
  const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgb = hexToRgb(color);
  
  if (rgb) {
    // Set CSS variables for the theme
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--primary-hover-color', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
    root.style.setProperty('--primary-light-color', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
  }
}
