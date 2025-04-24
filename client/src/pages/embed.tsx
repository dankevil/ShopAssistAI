import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EmbedCode } from '@/components/dashboard/EmbedCode';
import { getUser } from '@/lib/api';
import { getStores } from '@/lib/api';

export default function Embed() {
  const [activeStore, setActiveStore] = useState<number | null>(null);
  
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getUser,
  });

  const { data: storesData } = useQuery({
    queryKey: ['/api/shopify/stores'],
    queryFn: getStores,
    onSuccess: (data) => {
      if (data?.stores?.length > 0 && !activeStore) {
        setActiveStore(data.stores[0].id);
      }
    },
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar user={userData} />
      </div>
      
      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <DashboardHeader
          title="Embed Code"
          user={userData}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {activeStore ? (
                <EmbedCode storeId={activeStore} />
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
    </div>
  );
}
