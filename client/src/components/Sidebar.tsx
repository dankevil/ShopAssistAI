import { Link, useLocation } from "wouter";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  user: {
    id: number;
    username: string;
    storeId?: number;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
      <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-800">ShopGPT</h1>
          <span className="ml-2 bg-accent text-white text-xs px-2 py-1 rounded-full">Beta</span>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          <Link href="/dashboard">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive("/dashboard") || isActive("/") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${isActive("/dashboard") || isActive("/") ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
          </Link>

          <Link href="/configuration">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive("/configuration") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${isActive("/configuration") ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuration
            </a>
          </Link>

          <Link href="/customize">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive("/customize") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${isActive("/customize") ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Customize
            </a>
          </Link>

          <Link href="/chat-logs">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive("/chat-logs") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${isActive("/chat-logs") ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Chat Logs
            </a>
          </Link>

          <Link href="/faq-manager">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive("/faq-manager") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${isActive("/faq-manager") ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              FAQ Manager
            </a>
          </Link>

          <Link href="/analytics">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive("/analytics") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${isActive("/analytics") ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </a>
          </Link>
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <span className="inline-block h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex flex-col">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user.username}
              </p>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-gray-500 group-hover:text-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
