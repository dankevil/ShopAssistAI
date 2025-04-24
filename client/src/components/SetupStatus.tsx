import { useQuery } from "@tanstack/react-query";
import { getStore, getStoreConfig } from "@/lib/api";
import { Link } from "wouter";

export default function SetupStatus() {
  const { data: store, isLoading: isStoreLoading } = useQuery({
    queryKey: ['/api/stores'],
    queryFn: getStore
  });
  
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['/api/store-config'],
    queryFn: getStoreConfig,
    enabled: !!store
  });
  
  const { data: faqs, isLoading: isFaqsLoading } = useQuery({
    queryKey: ['/api/faqs'],
    queryFn: async () => {
      const faqs = await fetch('/api/faqs').then(res => res.json());
      return faqs.faqs || [];
    },
    enabled: !!store
  });
  
  const isLoading = isStoreLoading || isConfigLoading || isFaqsLoading;
  
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg mb-6 animate-pulse">
        <div className="px-4 py-5 sm:p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Determine status of each connection
  const shopifyConnected = !!store;
  const openaiConfigured = !!(config && config.openaiApiKey);
  const widgetDeployed = shopifyConnected;
  const faqsAdded = faqs ? faqs.length : 0;
  
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Setup Status</h3>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Shopify Connection Status */}
          <div className={`${shopifyConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full ${shopifyConnected ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${shopifyConnected ? 'text-green-500' : 'text-yellow-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Shopify Connection</h4>
                <p className="text-sm text-gray-600">
                  {shopifyConnected ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="mr-1 h-3 w-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <Link href="/configuration">
                      <a className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="mr-1 h-3 w-3 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                        </svg>
                        Setup Required
                      </a>
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* OpenAI API Status */}
          <div className={`${openaiConfigured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full ${openaiConfigured ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${openaiConfigured ? 'text-green-500' : 'text-yellow-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">OpenAI API</h4>
                <p className="text-sm text-gray-600">
                  {openaiConfigured ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="mr-1 h-3 w-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Configured
                    </span>
                  ) : (
                    <Link href="/configuration">
                      <a className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="mr-1 h-3 w-3 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                        </svg>
                        API Key Needed
                      </a>
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Widget Status */}
          <div className={`${widgetDeployed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full ${widgetDeployed ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${widgetDeployed ? 'text-green-500' : 'text-yellow-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Chat Widget</h4>
                <p className="text-sm text-gray-600">
                  {widgetDeployed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="mr-1 h-3 w-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Deployed
                    </span>
                  ) : (
                    <Link href="/configuration">
                      <a className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="mr-1 h-3 w-3 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                        </svg>
                        Setup Required
                      </a>
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* FAQ Status */}
          <div className={`${faqsAdded >= 5 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full ${faqsAdded >= 5 ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${faqsAdded >= 5 ? 'text-green-500' : 'text-yellow-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">FAQ Setup</h4>
                <p className="text-sm text-gray-600">
                  <Link href="/faq-manager">
                    <a className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <svg className="mr-1 h-3 w-3 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                      </svg>
                      {faqsAdded} of 10 added
                    </a>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
