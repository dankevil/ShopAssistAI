import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Input 
} from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getConversations } from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Eye, 
  MessageSquare, 
  MoreVertical, 
  Search, 
  Filter, 
  Archive, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationsTableProps {
  storeId: number;
  onViewConversation?: (conversationId: number) => void;
}

export function ConversationsTable({ storeId, onViewConversation }: ConversationsTableProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const pageSize = 5;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/conversations', storeId],
    queryFn: () => getConversations(storeId),
    enabled: !!storeId,
  });

  if (error) {
    return (
      <Card className="shadow-sm border-red-100">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-500 gap-2 justify-center py-8">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading conversations. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const conversations = data?.conversations || [];
  
  // Define conversation interface
  interface Conversation {
    id: number;
    customerName?: string;
    customerEmail?: string;
    status: string;
    updatedAt: string;
  }
  
  // Filter conversations
  const filteredConversations = conversations.filter((conv: Conversation) => {
    const matchesSearch = !searchTerm || 
      (conv.customerName && conv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (conv.customerEmail && conv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredConversations.length / pageSize);
  
  const paginatedConversations = filteredConversations
    .sort((a: Conversation, b: Conversation) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice((page - 1) * pageSize, page * pageSize);

  const statusColors: Record<string, { className: string, icon: React.ReactNode }> = {
    open: { 
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
      icon: <Clock className="h-3 w-3 mr-1" />
    },
    resolved: { 
      className: 'bg-green-50 text-green-700 border-green-200', 
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />
    },
    pending: { 
      className: 'bg-blue-50 text-blue-700 border-blue-200', 
      icon: <Clock className="h-3 w-3 mr-1" />
    },
    closed: { 
      className: 'bg-gray-50 text-gray-700 border-gray-200', 
      icon: <Archive className="h-3 w-3 mr-1" />
    },
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
            <MessageSquare className="h-5 w-5 text-primary-500" />
            Recent Conversations
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
            See all conversations
            <ChevronDown className="h-3.5 w-3.5 ml-1 text-gray-500" />
          </Button>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-9 h-9 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "gap-1.5 h-9 text-sm", 
                statusFilter ? "bg-primary-50 text-primary-700 border-primary-200" : ""
              )}
              onClick={() => setStatusFilter(statusFilter ? null : 'open')}
            >
              <Filter className="h-3.5 w-3.5" />
              {statusFilter || 'Filter by status'}
              {statusFilter && <span className="sr-only">: {statusFilter}</span>}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50 border-y border-gray-100">
                <TableHead className="text-xs font-semibold text-gray-500">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Topic / First Message</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Last Activity</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-100">
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-4">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedConversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40">
                    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                      <div className="bg-gray-50 rounded-full p-3 mb-3">
                        <MessageSquare className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations yet</h3>
                      <p className="text-sm text-gray-500 max-w-sm">
                        When customers start chatting with your AI assistant, their conversations will appear here.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedConversations.map((conversation: Conversation) => (
                  <TableRow 
                    key={conversation.id} 
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => onViewConversation?.(conversation.id)}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={`https://avatar.vercel.sh/${conversation.customerEmail || 'anonymous'}.png`} />
                          <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 font-medium">
                            {(conversation.customerName?.[0] || conversation.customerEmail?.[0] || 'A').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {conversation.customerName || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {conversation.customerEmail || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {/* Note: In a real implementation, we would fetch the first message or a summary */}
                        {conversation.id ? `Conversation #${conversation.id}` : 'New conversation'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        How can I track my recent order? I need to know when it will arrive.
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {conversation.updatedAt ? getRelativeTime(conversation.updatedAt) : 'Just now'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {conversation.updatedAt ? format(new Date(conversation.updatedAt), 'MMM d, h:mm a') : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "flex items-center gap-0.5 h-6 border px-2 rounded-full text-xs",
                          statusColors[conversation.status]?.className || 'bg-gray-50 text-gray-700 border-gray-200'
                        )}
                      >
                        {statusColors[conversation.status]?.icon}
                        {conversation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewConversation?.(conversation.id);
                          }}
                          className="text-primary-600 hover:text-primary-800 hover:bg-primary-50 mr-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {!isLoading && totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between">
            <div className="text-xs text-gray-600">
              Showing <span className="font-medium">{Math.min((page - 1) * pageSize + 1, filteredConversations.length)}</span> to <span className="font-medium">{Math.min(page * pageSize, filteredConversations.length)}</span> of <span className="font-medium">{filteredConversations.length}</span> conversations
            </div>
            <Pagination>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="h-8 px-3 text-xs"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(i + 1)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="h-8 px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
