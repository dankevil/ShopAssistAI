import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: number;
  visitorId: string;
  lastMessage: string;
  status: string;
  createdAt: string;
}

interface ConversationsListProps {
  conversations: Conversation[];
  isLoading: boolean;
}

export default function ConversationsList({ conversations, isLoading }: ConversationsListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>;
      case 'escalated':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Escalated</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Conversations</h3>
      </div>
      
      <div className="flow-root">
        {isLoading ? (
          <ul role="list" className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <li key={index} className="py-4 px-4">
                <div className="flex items-center space-x-4 animate-pulse">
                  <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-10"></div>
                </div>
              </li>
            ))}
          </ul>
        ) : conversations.length === 0 ? (
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="mt-2 text-gray-500">No conversations yet</p>
          </div>
        ) : (
          <ul role="list" className="-my-5 divide-y divide-gray-200 overflow-hidden">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="py-4 px-4 hover:bg-gray-50 cursor-pointer">
                <Link href={`/chat-logs?id=${conversation.id}`}>
                  <a className="flex items-center space-x-4">
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
                      {formatTime(conversation.createdAt)}
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="bg-gray-50 px-4 py-4 sm:px-6 rounded-b-lg">
        <div className="text-sm">
          <Link href="/chat-logs">
            <a className="font-medium text-primary hover:text-secondary">
              View all conversations
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
