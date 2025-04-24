import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Conversations from "@/pages/conversations";
import Shopify from "@/pages/shopify";
import FAQs from "@/pages/faqs";
import Customization from "@/pages/customization";
import Embed from "@/pages/embed";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ProductRecommendations from "@/pages/ProductRecommendations";
import CartRecovery from "@/pages/cart-recovery";
import ProductCarouselTest from "@/pages/product-carousel-test";
import Pricing from "@/pages/pricing";
import { useState, useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { z } from 'zod';
import "./lib/i18n"; // Import i18n initialization

// Define language settings schema for form validation
export const languageSettingsSchema = z.object({
  defaultLanguage: z.string().min(2).max(5),
  supportedLanguages: z.array(z.string().min(2).max(5))
});

// Redirect components to avoid Hook issues
const RedirectToDashboard = () => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);
  
  return null;
};

const RedirectToLogin = () => {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Don't redirect if already on login or signup
    if (location !== "/login" && location !== "/signup") {
      setLocation("/login");
    }
  }, [location, setLocation]);
  
  return null;
};

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // First useEffect for auth check
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // If not at login or signup page, redirect to login
          if (location !== "/login" && location !== "/signup") {
            setLocation("/login");
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        // If not at login or signup page, redirect to login
        if (location !== "/login" && location !== "/signup") {
          setLocation("/login");
        }
      }
    };

    checkAuthStatus();
  }, [location, setLocation]);

  // Second useEffect for login hint - always declare all hooks, even if conditionally rendered
  useEffect(() => {
    if (isAuthenticated === false && location === "/login") {
      toast({
        title: "Development Login",
        description: "Use username: admin and password: admin123 to login",
        duration: 5000,
      });
    }
  }, [isAuthenticated, location, toast]);

  // Show basic loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="space-y-4 text-center">
          <div className="text-lg font-medium">{t('app.loading')}</div>
          <div className="mx-auto h-4 w-16 animate-pulse rounded-full bg-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes accessible without authentication */}
      <Route path="/test-carousel" component={ProductCarouselTest} />
      
      {isAuthenticated ? (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/conversations" component={Conversations} />
          <Route path="/shopify" component={Shopify} />
          <Route path="/faqs" component={FAQs} />
          <Route path="/customization" component={Customization} />
          <Route path="/embed" component={Embed} />
          <Route path="/settings" component={Settings} />
          <Route path="/product-recommendations" component={ProductRecommendations} />
          <Route path="/cart-recovery" component={CartRecovery} />
          <Route path="/product-carousel-test" component={ProductCarouselTest} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/login" component={RedirectToDashboard} />
        </>
      ) : (
        <>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/:rest*" component={RedirectToLogin} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
