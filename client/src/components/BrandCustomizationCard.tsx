import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStoreConfig, updateStoreConfig } from "@/lib/api";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BrandCustomizationCard() {
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [logoUrl, setLogoUrl] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [position, setPosition] = useState("bottom-right");
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/store-config'],
    queryFn: getStoreConfig
  });
  
  useEffect(() => {
    if (config) {
      setPrimaryColor(config.primaryColor || "#6366F1");
      setLogoUrl(config.logoUrl || "");
      setWelcomeMessage(config.welcomeMessage || "Hi there! 👋 I'm your assistant. How can I help you today?");
      setPosition(config.widgetPosition || "bottom-right");
    }
  }, [config]);
  
  const updateConfigMutation = useMutation({
    mutationFn: updateStoreConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-config'] });
      toast({
        title: "Success",
        description: "Brand customization saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save customization",
        variant: "destructive",
      });
    }
  });
  
  const handleSaveCustomization = () => {
    updateConfigMutation.mutate({
      primaryColor,
      logoUrl,
      welcomeMessage,
      widgetPosition: position
    });
  };
  
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-100 rounded w-full"></div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-10 bg-gray-200 rounded w-1/4 ml-auto"></div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Customization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Chat Widget Logo URL</Label>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-md border border-gray-300 bg-white flex items-center justify-center overflow-hidden mr-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Brand logo" className="h-10 w-10 object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
          </div>
          
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center">
              <div 
                className="h-8 w-8 rounded-md mr-2" 
                style={{ backgroundColor: primaryColor }}
              ></div>
              <Input
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-grow"
              />
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-9 p-0 ml-2 cursor-pointer"
              />
            </div>
          </div>
          
          {/* Widget Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Widget Position</Label>
            <Select
              value={position}
              onValueChange={setPosition}
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Welcome Message */}
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              rows={2}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSaveCustomization}
          disabled={updateConfigMutation.isPending}
        >
          {updateConfigMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
