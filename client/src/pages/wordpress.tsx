import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { WordPressIntegration } from '@/components/dashboard/WordPressIntegration';
import { getUser } from '@/lib/api';

export default function WordPress() {
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);

  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getUser,
  });

  const handleStoreAction = (storeId: number) => {
    setActiveStoreId(storeId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar user={userData} />
      </div>
      
      <div className="md:pl-64 flex flex-col flex-1">
        <DashboardHeader
          title="WordPress Integration"
          user={userData}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <WordPressIntegration
                userId={userData?.id || 0}
                onStoreConnected={handleStoreAction}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 