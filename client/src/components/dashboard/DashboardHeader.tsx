import { useState } from 'react';
import { 
  Bell, 
  Menu, 
  MessageSquare, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  user: { 
    username: string;
    email: string;
  } | null;
  onChatOpen?: () => void;
}

export function DashboardHeader({ title, user, onChatOpen }: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-100">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="px-4 text-gray-500 md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar user={user} />
        </SheetContent>
      </Sheet>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>

        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {/* Test Chat Button */}
          {onChatOpen && (
            <Button
              variant="outline"
              onClick={onChatOpen}
              className="flex items-center text-gray-600 hover:text-primary-600 hover:border-primary-200 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="mr-1.5">Test Chatbot</span>
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </Button>
          )}
          
          {/* Help */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                Documentation
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Getting Started Guide
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                API Reference
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                Contact Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700 hover:bg-gray-100/50">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold p-0">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2 border-b">
                <h3 className="font-medium">Notifications</h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary-600">
                  Mark all as read
                </Button>
              </div>
              <div className="py-1 max-h-[280px] overflow-y-auto">
                {/* Notification Items */}
                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-l-2 border-primary-500">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900">New conversation started</p>
                    <span className="text-xs text-gray-500">5m ago</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">A customer has started a new conversation about product recommendations</p>
                </div>
                
                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900">Abandoned cart detected</p>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">An abandoned cart has been detected and is ready for recovery</p>
                </div>
                
                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900">System update completed</p>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">The system has been updated with new features and improvements</p>
                </div>
              </div>
              <div className="p-2 text-center border-t">
                <Button variant="ghost" size="sm" className="text-primary-600 w-full justify-center text-xs">
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Environment dropdown - could be used for production/staging switch */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1 text-sm h-8 bg-green-50 text-green-700 border-green-100 hover:bg-green-100">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="ml-1.5">Production</span>
                <ChevronDown className="h-4 w-4 ml-0.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                Production
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Staging
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Development
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
