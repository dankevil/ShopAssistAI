import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Stats } from '@/components/dashboard/Stats';
import { ConversationsTable } from '@/components/dashboard/ConversationsTable';
import { AiPerformance } from '@/components/dashboard/AiPerformance';
import { FeedbackStats } from '@/components/dashboard/FeedbackStats';
import { ChatWidget, ChatButton } from '@/components/ui/chat-widget';
import { getUser } from '@/lib/api';
import { getStores } from '@/lib/api';

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [activeStore, setActiveStore] = useState<number | null>(null);
  
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getUser,
  });

  const { data: storesData } = useQuery({
    queryKey: ['/api/shopify/stores'],
    queryFn: getStores,
  });

  // Set the first store as active if available
  useEffect(() => {
    if (storesData?.stores?.length > 0 && !activeStore) {
      setActiveStore(storesData.stores[0].id);
    }
  }, [storesData, activeStore]);

  const handleToggleChat = () => {
    setChatOpen(prev => !prev);
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
          title="Dashboard"
          user={userData}
          onChatOpen={handleToggleChat}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Dashboard Overview */}
              <Stats
                conversationsCount={1482}
                resolutionRate={92}
                avgResponseTime="1.8s"
              />
              
              {/* Recent Conversations */}
              <div className="mt-8">
                <ConversationsTable 
                  storeId={activeStore || 0}
                  onViewConversation={(id) => {
                    // Navigate to the conversations page with the selected conversation
                    window.location.href = `/conversations?id=${id}`;
                  }}
                />
              </div>
              
              {/* AI Performance and Feedback */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <AiPerformance />
                {activeStore && <FeedbackStats storeId={activeStore} />}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Chat Widget */}
      {activeStore && (
        <>
          <ChatWidget
            storeId={activeStore}
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
          />
          
          <ChatButton
            onClick={handleToggleChat}
            isOpen={chatOpen}
          />
        </>
      )}
    </div>
  );
}
