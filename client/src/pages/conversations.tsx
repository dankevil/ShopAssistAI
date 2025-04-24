import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUser, getStores, getConversations, getMessages, sendMessage } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Search, RefreshCw, X, Send, MessageSquare, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Conversations() {
  const [activeStore, setActiveStore] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  
  // Define ref to track if this is the first render
  const isFirstRender = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check for conversation ID in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('id');
    if (conversationId) {
      setSelectedConversation(parseInt(conversationId, 10));
    }
  }, []);

  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getUser,
  });

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['/api/shopify/stores'],
    queryFn: getStores,
  });
  
  // Set active store from stores data when it loads
  useEffect(() => {
    if (storesData?.stores?.length > 0 && activeStore === null) {
      console.log('Setting active store to:', storesData.stores[0].id);
      setActiveStore(storesData.stores[0].id);
    }
  }, [storesData, activeStore]);

  const { 
    data: conversationsData, 
    isLoading: conversationsLoading,
    refetch: refetchConversations,
    error: conversationsError
  } = useQuery({
    queryKey: ['/api/conversations', activeStore],
    queryFn: () => activeStore ? getConversations(activeStore) : Promise.resolve({ conversations: [] }),
    enabled: !!activeStore,
  });

  const { 
    data: messagesData, 
    isLoading: messagesLoading,
    refetch: refetchMessages,
    error: messagesError
  } = useQuery({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    queryFn: () => selectedConversation ? getMessages(selectedConversation) : Promise.resolve({ messages: [] }),
    enabled: !!selectedConversation,
  });

  // Create a mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, storeId, content }: { 
      conversationId: number, 
      storeId: number, 
      content: string 
    }) => sendMessage(conversationId, storeId, content, 'user'),
    onSuccess: () => {
      // Reset input and refetch messages
      setMessageInput('');
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: String(error),
        variant: "destructive"
      });
    }
  });

  const conversations = conversationsData?.conversations || [];
  const messages = messagesData?.messages || [];
  
  // Add console logs for debugging
  useEffect(() => {
    console.log('Conversations data:', conversations);
    console.log('Selected conversation:', selectedConversation);
    console.log('Active store:', activeStore);
    
    if (conversationsError) {
      console.error('Conversations error:', conversationsError);
    }
    
    if (messagesError && selectedConversation) {
      console.error('Messages error:', messagesError);
    }
  }, [conversations, selectedConversation, activeStore, conversationsError, messagesError]);
  
  // Effect to refetch conversations when activeStore changes
  useEffect(() => {
    if (activeStore && !isFirstRender.current) {
      console.log('Refetching conversations for store:', activeStore);
      refetchConversations();
    }
    isFirstRender.current = false;
  }, [activeStore, refetchConversations]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter conversations by search term and status
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = searchTerm 
      ? (conversation.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         conversation.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : conversation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || !activeStore) return;
    
    // Show loading state
    toast({
      title: "Sending message...",
      duration: 2000,
    });
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      storeId: activeStore,
      content: messageInput
    });
  };

  const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    pending: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar user={userData} />
      </div>
      
      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <DashboardHeader
          title="Conversations"
          user={userData}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
                {/* Conversations List */}
                <div className="w-full lg:w-1/3">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">Conversations</CardTitle>
                        {storesData?.stores?.length > 1 && (
                          <Select
                            value={activeStore?.toString() || ''}
                            onValueChange={(value) => setActiveStore(parseInt(value))}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select store" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Stores</SelectLabel>
                                {storesData?.stores?.map(store => (
                                  <SelectItem key={store.id} value={store.id.toString()}>
                                    {store.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search conversations..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {searchTerm && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-7 w-7"
                              onClick={() => setSearchTerm('')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="w-[130px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                      {conversationsLoading ? (
                        <div className="p-4 space-y-4">
                          {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-start space-x-3 p-3 animate-pulse">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="flex-1">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-3 w-40 mb-1" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                              <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                          ))}
                        </div>
                      ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          {searchTerm || statusFilter !== 'all' ? 
                            "No conversations match your filters." : 
                            "No conversations yet."}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredConversations.map((conversation) => (
                            <div
                              key={conversation.id}
                              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedConversation === conversation.id ? 'bg-primary-50' : ''
                              }`}
                              onClick={() => setSelectedConversation(conversation.id)}
                            >
                              <div className="flex items-start">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage src={`https://avatar.vercel.sh/${conversation.customerEmail || 'anonymous'}.png`} />
                                  <AvatarFallback>
                                    {(conversation.customerName?.[0] || conversation.customerEmail?.[0] || 'A').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {conversation.customerName || 'Anonymous User'}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {conversation.customerEmail || 'No email provided'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {conversation.updatedAt ? format(new Date(conversation.updatedAt), 'MMM d, yyyy h:mm a') : 'Unknown'}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={statusColors[conversation.status] || 'bg-gray-100 text-gray-800'}
                                >
                                  {conversation.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </Card>
                </div>
                
                {/* Conversation Details */}
                <div className="w-full lg:w-2/3">
                  <Card className="h-full flex flex-col">
                    {!selectedConversation ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                          <p className="mt-2">Select a conversation to view details</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage 
                                  src={`https://avatar.vercel.sh/${
                                    conversations.find(c => c.id === selectedConversation)?.customerEmail || 'anonymous'
                                  }.png`} 
                                />
                                <AvatarFallback>
                                  {(conversations.find(c => c.id === selectedConversation)?.customerName?.[0] || 
                                    conversations.find(c => c.id === selectedConversation)?.customerEmail?.[0] || 
                                    'A').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg font-medium">
                                  {conversations.find(c => c.id === selectedConversation)?.customerName || 'Anonymous User'}
                                </CardTitle>
                                <p className="text-sm text-gray-500">
                                  {conversations.find(c => c.id === selectedConversation)?.customerEmail || 'No email provided'}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={statusColors[
                                conversations.find(c => c.id === selectedConversation)?.status || 'open'
                              ]}
                            >
                              {conversations.find(c => c.id === selectedConversation)?.status || 'open'}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <ScrollArea className="flex-1 p-6 bg-gray-50">
                          {messagesLoading ? (
                            <div className="space-y-4">
                              {Array(5).fill(0).map((_, i) => (
                                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                  {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                                  <Skeleton className={`h-20 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'} rounded-lg`} />
                                </div>
                              ))}
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                              No messages in this conversation.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  {message.sender === 'bot' && (
                                    <Avatar className="h-8 w-8 mr-2">
                                      <AvatarFallback className="bg-primary-100 text-primary-600">
                                        <MessageSquare className="h-4 w-4" />
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div
                                    className={`p-3 rounded-lg max-w-[70%] ${
                                      message.sender === 'user'
                                        ? 'bg-primary-100 text-primary-800'
                                        : 'bg-white shadow-sm'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs text-gray-400 text-right mt-1">
                                      {message.createdAt && format(new Date(message.createdAt), 'h:mm a')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </ScrollArea>
                        
                        <CardContent className="p-4 border-t border-gray-200 bg-white">
                          <form onSubmit={handleSendMessage} className="flex space-x-2">
                            <Input
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              placeholder="Type your reply..."
                              className="flex-1"
                            />
                            <Button type="submit" disabled={!messageInput.trim() || sendMessageMutation.isPending}>
                              {sendMessageMutation.isPending ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send
                                </>
                              )}
                            </Button>
                          </form>
                        </CardContent>
                      </>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
