import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  HelpCircle,
  Paintbrush,
  Code,
  Settings,
  ShoppingCart
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

function NavItem({ href, label, icon, active }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
          active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Thinkstore Assist</h1>
          </div>
          <nav className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">Welcome, Admin</p>
          </nav>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <nav className="h-full py-6 pr-6 lg:py-8">
            <div className="space-y-1">
              <NavItem
                href="/dashboard"
                label="Dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                active={location === "/" || location === "/dashboard"}
              />
              <NavItem
                href="/conversations"
                label="Conversations"
                icon={<MessageSquare className="h-4 w-4" />}
                active={location === "/conversations"}
              />
              <NavItem
                href="/shopify"
                label="Shopify Integration"
                icon={<ShoppingBag className="h-4 w-4" />}
                active={location === "/shopify"}
              />
              <NavItem
                href="/product-recommendations"
                label="Product Recommendations"
                icon={<ShoppingCart className="h-4 w-4" />}
                active={location === "/product-recommendations"}
              />
              <NavItem
                href="/faqs"
                label="FAQs"
                icon={<HelpCircle className="h-4 w-4" />}
                active={location === "/faqs"}
              />
              <NavItem
                href="/customization"
                label="Customize"
                icon={<Paintbrush className="h-4 w-4" />}
                active={location === "/customization"}
              />
              <NavItem
                href="/embed"
                label="Embed Code"
                icon={<Code className="h-4 w-4" />}
                active={location === "/embed"}
              />
              <NavItem
                href="/settings"
                label="Settings"
                icon={<Settings className="h-4 w-4" />}
                active={location === "/settings"}
              />
            </div>
          </nav>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6">
          {children}
        </main>
      </div>
    </div>
  );
}