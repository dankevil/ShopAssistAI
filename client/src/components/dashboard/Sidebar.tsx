import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  HelpCircle,
  Palette,
  Code,
  Settings,
  LogOut,
  ShoppingCart,
  ChevronRight,
  CreditCard,
  Bot,
  User,
  LifeBuoy,
  BarChart2,
  Users,
  Zap,
  Filter,
  Layers,
  BookOpen,
  Brain,
  ExternalLink,
  Workflow,
  Server,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logout } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePathname } from 'next/navigation';
import { useLogout } from '@/hooks/useLogout';

interface UserData {
  id: number;
  username: string;
  email: string;
  // Add other user fields as necessary
}

interface SidebarProps {
  user?: UserData | null;
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const pathname = usePathname();
  const logout = useLogout();
  
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Group routes by category
  const mainRoutes = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: location === '/dashboard' || location === '/',
    },
    {
      name: 'Conversations',
      href: '/conversations',
      icon: MessageSquare,
      active: location === '/conversations',
    },
  ];

  const integrationRoutes = [
    {
      name: 'Shopify Integration',
      href: '/shopify',
      icon: ShoppingBag,
      active: location === '/shopify',
    },
    {
      name: 'WordPress Integration',
      href: '/wordpress',
      icon: Server,
      active: location === '/wordpress',
    },
    {
      name: 'Cart Recovery',
      href: '/cart-recovery',
      icon: ShoppingCart,
      active: location === '/cart-recovery',
    },
  ];

  const customizationRoutes = [
    {
      name: 'FAQ Management',
      href: '/faqs',
      icon: HelpCircle,
      active: location === '/faqs',
    },
    {
      name: 'Customization',
      href: '/customization',
      icon: Palette,
      active: location === '/customization',
    },
    {
      name: 'Embed Code',
      href: '/embed',
      icon: Code,
      active: location === '/embed',
    },
  ];

  const settingsRoutes = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      active: location === '/settings',
    },
    {
      name: 'Pricing & Plans',
      href: '/pricing',
      icon: CreditCard,
      active: location === '/pricing',
    },
  ];

  // Function to render a nav item
  const renderNavItem = (route: any) => (
    <Link key={route.href} href={route.href}>
      <div
        className={cn(
          "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer mb-1 transition-all duration-200",
          route.active
            ? "bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border-l-2 border-primary-500"
            : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-800"
        )}
      >
        <route.icon
          className={cn(
            "mr-3 h-5 w-5",
            route.active ? "text-primary-600" : "text-gray-400 group-hover:text-gray-500"
          )}
        />
        <span className="flex-1">{route.name}</span>
        {route.active && <ChevronRight className="h-4 w-4 text-primary-600" />}
      </div>
    </Link>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-white shadow-sm">
        {/* Logo and title */}
        <div className="flex items-center px-5 h-16 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Thinkstore Assist</h1>
              <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                Enterprise
              </span>
            </div>
          </div>
        </div>
        
        {/* Main navigation */}
        <div className="flex-1 px-3 py-4 overflow-y-auto bg-white">
          <div className="space-y-6">
            {/* Analytics section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Analytics
              </h3>
              <div className="mt-2 space-y-1">
                {mainRoutes.map(renderNavItem)}
              </div>
            </div>
            
            {/* Integrations section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Integrations
              </h3>
              <div className="mt-2 space-y-1">
                {integrationRoutes.map(renderNavItem)}
              </div>
            </div>
            
            {/* Customization section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Customization
              </h3>
              <div className="mt-2 space-y-1">
                {customizationRoutes.map(renderNavItem)}
              </div>
            </div>
            
            {/* Settings section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
              <div className="mt-2 space-y-1">
                {settingsRoutes.map(renderNavItem)}
              </div>
            </div>
          </div>
        </div>
        
        {/* User profile and logout */}
        <div className="px-3 py-3 mt-auto border-t border-gray-100 bg-gray-50">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 ring-2 ring-white">
              <AvatarImage src={`https://avatar.vercel.sh/${user?.username || 'user'}.png`} />
              <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-white">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-500 truncate max-w-[140px]">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
