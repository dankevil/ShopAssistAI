import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getConversations, getConversation, updateConversation } from "@/lib/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: number;
  visitorId: string;
  lastMessage: string;
  status: string;
  createdAt: string;
}

export default function ChatLogs() {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: getConversations
  });
  
  const { data: conversationDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/api/conversations', selectedConversation],
    queryFn: () => selectedConversation ? getConversation(selectedConversation) : null,
    enabled: !!selectedConversation
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      updateConversation(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation] });
      }
      toast({
        title: "Status updated",
        description: "Conversation status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update conversation status",
        variant: "destructive",
      });
    }
  });
  
  const handleUpdateStatus = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Active</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Resolved</Badge>;
      case "escalated":
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">Escalated</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const filteredConversations = conversations?.filter((conversation) => {
    if (statusFilter === "all") return true;
    return conversation.status === statusFilter;
  }) || [];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Chat Logs</h1>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Conversations</h3>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="escalated">Escalated</TabsTrigger>
              </TabsList>
            </div>
            
            {isLoading ? (
              <div className="p-4 animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-10 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">No conversations found</p>
              </div>
            ) : (
              <div className="overflow-hidden overflow-y-auto max-h-[600px]">
                <ul role="list" className="divide-y divide-gray-200">
                  {filteredConversations.map((conversation) => (
                    <li 
                      key={conversation.id} 
                      className="py-4 px-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.visitorId}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(conversation.status)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(conversation.createdAt)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Tabs>
        
        <Dialog open={!!selectedConversation} onOpenChange={(open) => !open && setSelectedConversation(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Conversation Details</DialogTitle>
              <DialogDescription>
                {conversationDetails?.conversation && (
                  <div className="flex items-center justify-between">
                    <span>Visitor: {conversationDetails.conversation.visitorId}</span>
                    <span>{formatDate(conversationDetails.conversation.createdAt)}</span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingDetails ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-gray-100 rounded w-3/4"></div>
                <div className="h-10 bg-gray-100 rounded w-1/2 ml-auto"></div>
                <div className="h-10 bg-gray-100 rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
                  {conversationDetails?.messages?.map((message: Message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`rounded-lg p-3 shadow max-w-md ${
                          message.role === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {conversationDetails?.conversation && (
                  <div className="flex justify-between pt-4 border-t">
                    <div className="flex items-center">
                      <span className="mr-2">Status:</span>
                      {getStatusBadge(conversationDetails.conversation.status)}
                    </div>
                    <div className="space-x-2">
                      {conversationDetails.conversation.status !== 'resolved' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleUpdateStatus(conversationDetails.conversation.id, 'resolved')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Mark as Resolved
                        </Button>
                      )}
                      
                      {conversationDetails.conversation.status !== 'escalated' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleUpdateStatus(conversationDetails.conversation.id, 'escalated')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Escalate
                        </Button>
                      )}
                      
                      {conversationDetails.conversation.status !== 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateStatus(conversationDetails.conversation.id, 'active')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
