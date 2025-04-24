import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EnhancedFAQManager } from '@/components/dashboard/EnhancedFAQManager';
import { ChatWidget, ChatButton } from '@/components/ui/chat-widget';
import { getUser } from '@/lib/api';
import { getStores } from '@/lib/api';

export default function FAQs() {
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
          title="FAQ Management"
          user={userData}
          onChatOpen={handleToggleChat}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {activeStore ? (
                <EnhancedFAQManager storeId={activeStore} />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">
                    You need to connect a Shopify store first. Please go to the Shopify Integration page.
                  </p>
                </div>
              )}
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
