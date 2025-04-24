import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ColorPicker } from '@/components/ui/color-picker';
import { 
  PatternPresets, 
  GradientPresets, 
  ImagePresets, 
  BackgroundPreview 
} from '@/components/ui/background-presets';
import { getSettings, updateSettings } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Upload, ExternalLink } from 'lucide-react';

interface CustomizationProps {
  storeId: number;
  onPreview?: (settings: any) => void;
}

export function Customization({ storeId, onPreview }: CustomizationProps) {
  const [settings, setSettings] = useState({
    brandColor: '#4F46E5',
    chatTitle: 'Chat with us',
    welcomeMessage: 'Hello! How can I help you today?',
    logoUrl: '',
    buttonPosition: 'right',
    chatBackgroundType: 'solid',
    chatBackgroundColor: '#f9fafb',
    chatBackgroundGradient: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
    chatBackgroundPattern: '',
    chatBackgroundImage: '',
  });

  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/settings', storeId],
    queryFn: () => getSettings(storeId),
    enabled: !!storeId,
  });
  
  // Update settings when data is loaded
  useEffect(() => {
    if (data) {
      setSettings({
        brandColor: data.brandColor || '#4F46E5',
        chatTitle: data.chatTitle || 'Chat with us',
        welcomeMessage: data.welcomeMessage || 'Hello! How can I help you today?',
        logoUrl: data.logoUrl || '',
        buttonPosition: data.buttonPosition || 'right',
        chatBackgroundType: data.chatBackgroundType || 'solid',
        chatBackgroundColor: data.chatBackgroundColor || '#f9fafb',
        chatBackgroundGradient: data.chatBackgroundGradient || 'linear-gradient(to right, #f9fafb, #f3f4f6)',
        chatBackgroundPattern: data.chatBackgroundPattern || '',
        chatBackgroundImage: data.chatBackgroundImage || '',
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => updateSettings(data?.id, newSettings),
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Your customization settings have been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error saving your settings.',
        variant: 'destructive',
      });
    },
  });

  // Handle previewing the customization settings
  const handlePreview = () => {
    if (onPreview) {
      onPreview(settings);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo image must be less than 1MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSettings({
          ...settings,
          logoUrl: event.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chatbot Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading customization settings. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Chatbot Customization</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customization Options */}
          <div>
            <div className="space-y-6">
              {/* Brand Color */}
              <ColorPicker
                color={settings.brandColor}
                onChange={(color) => setSettings({ ...settings, brandColor: color })}
                label="Brand Color"
                description="This color will be used for the chatbot bubble and header."
              />
              
              {/* Chat Title */}
              <div>
                <Label htmlFor="chat-title">Chat Title</Label>
                <Input
                  id="chat-title"
                  value={settings.chatTitle}
                  onChange={(e) => setSettings({ ...settings, chatTitle: e.target.value })}
                  className="mt-1"
                />
                <p className="mt-2 text-sm text-muted-foreground">This title appears at the top of the chat window.</p>
              </div>
              
              {/* Welcome Message */}
              <div>
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
                <p className="mt-2 text-sm text-muted-foreground">This is the first message users will see when opening the chat.</p>
              </div>
              
              {/* Logo Upload */}
              <div>
                <Label className="block">Logo</Label>
                <div className="mt-1 flex items-center">
                  <Avatar className="h-12 w-12 rounded overflow-hidden bg-gray-100">
                    {settings.logoUrl ? (
                      <AvatarImage src={settings.logoUrl} alt="Brand logo" />
                    ) : (
                      <AvatarFallback className="bg-primary-100 text-primary-600">
                        <MessageSquare className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="ml-5">
                    <Button variant="outline" className="relative" asChild>
                      <label>
                        <Upload className="mr-2 h-4 w-4" />
                        Change
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Recommended size: 512x512px. Max size: 1MB.</p>
              </div>
              
              {/* Button Position */}
              <div>
                <Label>Chat Button Position</Label>
                <RadioGroup
                  value={settings.buttonPosition}
                  onValueChange={(value) => setSettings({ ...settings, buttonPosition: value })}
                  className="mt-2 space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="right" id="right" />
                    <Label htmlFor="right" className="font-normal">Right</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="left" id="left" />
                    <Label htmlFor="left" className="font-normal">Left</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Chat Background */}
              <div className="pt-5 border-t border-gray-200">
                <Label className="text-lg font-medium text-gray-900">Chat Background Theme</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize the background of your chat widget to match your brand.
                </p>
                
                <div className="mt-4">
                  <Label>Background Type</Label>
                  <RadioGroup
                    value={settings.chatBackgroundType}
                    onValueChange={(value) => setSettings({ ...settings, chatBackgroundType: value })}
                    className="mt-2 space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="solid" id="bg-solid" />
                      <Label htmlFor="bg-solid" className="font-normal">Solid Color</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gradient" id="bg-gradient" />
                      <Label htmlFor="bg-gradient" className="font-normal">Gradient</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pattern" id="bg-pattern" />
                      <Label htmlFor="bg-pattern" className="font-normal">Pattern</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="bg-image" />
                      <Label htmlFor="bg-image" className="font-normal">Custom Image</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Solid color settings */}
                {settings.chatBackgroundType === 'solid' && (
                  <div className="space-y-4">
                    <ColorPicker
                      color={settings.chatBackgroundColor}
                      onChange={(color) => setSettings({ ...settings, chatBackgroundColor: color })}
                      label="Background Color"
                      description="Choose a solid color for your chat background."
                    />
                    
                    {/* Preview */}
                    <BackgroundPreview 
                      type="solid"
                      color={settings.chatBackgroundColor}
                      gradient={settings.chatBackgroundGradient}
                      pattern={settings.chatBackgroundPattern}
                      image={settings.chatBackgroundImage}
                    />
                  </div>
                )}
                
                {/* Gradient settings */}
                {settings.chatBackgroundType === 'gradient' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bg-gradient-value">Gradient CSS</Label>
                      <Input
                        id="bg-gradient-value"
                        value={settings.chatBackgroundGradient}
                        onChange={(e) => setSettings({ ...settings, chatBackgroundGradient: e.target.value })}
                        className="mt-1"
                        placeholder="linear-gradient(to right, #f9fafb, #f3f4f6)"
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Enter a CSS gradient value (e.g., linear-gradient(to right, #f9fafb, #f3f4f6))
                      </p>
                    </div>
                    
                    {/* Gradient presets */}
                    <GradientPresets
                      value={settings.chatBackgroundGradient}
                      onChange={(gradient) => setSettings({ ...settings, chatBackgroundGradient: gradient })}
                    />
                    
                    {/* Preview */}
                    <BackgroundPreview 
                      type="gradient"
                      color={settings.chatBackgroundColor}
                      gradient={settings.chatBackgroundGradient}
                      pattern={settings.chatBackgroundPattern}
                      image={settings.chatBackgroundImage}
                    />
                  </div>
                )}
                
                {/* Pattern settings */}
                {settings.chatBackgroundType === 'pattern' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bg-pattern-value">Pattern URL</Label>
                      <Input
                        id="bg-pattern-value"
                        value={settings.chatBackgroundPattern}
                        onChange={(e) => setSettings({ ...settings, chatBackgroundPattern: e.target.value })}
                        className="mt-1"
                        placeholder="https://example.com/pattern.png"
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Enter a URL to a repeating pattern image or select from presets below
                      </p>
                    </div>
                    
                    {/* Pattern presets */}
                    <PatternPresets
                      value={settings.chatBackgroundPattern}
                      onChange={(pattern) => setSettings({ ...settings, chatBackgroundPattern: pattern })}
                    />
                    
                    {/* Preview */}
                    <BackgroundPreview 
                      type="pattern"
                      color={settings.chatBackgroundColor}
                      gradient={settings.chatBackgroundGradient}
                      pattern={settings.chatBackgroundPattern}
                      image={settings.chatBackgroundImage}
                    />
                  </div>
                )}
                
                {/* Image settings */}
                {settings.chatBackgroundType === 'image' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bg-image-value">Background Image URL</Label>
                      <Input
                        id="bg-image-value"
                        value={settings.chatBackgroundImage}
                        onChange={(e) => setSettings({ ...settings, chatBackgroundImage: e.target.value })}
                        className="mt-1"
                        placeholder="https://example.com/background.jpg"
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Enter a URL to an image to use as the chat background or select from presets below
                      </p>
                    </div>
                    
                    {/* Image presets */}
                    <ImagePresets
                      value={settings.chatBackgroundImage}
                      onChange={(image) => setSettings({ ...settings, chatBackgroundImage: image })}
                    />
                    
                    {/* Preview */}
                    <BackgroundPreview 
                      type="image"
                      color={settings.chatBackgroundColor}
                      gradient={settings.chatBackgroundGradient}
                      pattern={settings.chatBackgroundPattern}
                      image={settings.chatBackgroundImage}
                    />
                  </div>
                )}
              </div>
              
              <div className="pt-5 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={updateMutation.isPending || isLoading}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview */}
          <div className="hidden lg:block">
            <div className="bg-gray-100 rounded-lg p-4 h-full">
              <div className="mb-4 flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">Preview</h4>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-primary-100 text-primary-700 font-medium"
                  >
                    Desktop
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-white text-gray-500"
                  >
                    Mobile
                  </Button>
                </div>
              </div>
              
              <div className="relative w-full h-[500px]">
                {/* Browser Frame */}
                <div className="absolute inset-0 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                  {/* Browser Chrome */}
                  <div className="bg-gray-100 py-2 px-4 border-b border-gray-200 flex items-center">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  
                  {/* Website Content */}
                  <div className="flex-1 p-4 flex flex-col justify-end items-end" style={{ alignItems: settings.buttonPosition === 'left' ? 'flex-start' : 'flex-end' }}>
                    {/* Chat Icon Button */}
                    <div
                      className="h-14 w-14 rounded-full text-white flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: settings.brandColor }}
                    >
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    
                    {/* Chat Window */}
                    <div className="mt-4 w-80 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
                      {/* Chat Header */}
                      <div className="px-4 py-3 flex items-center" style={{ backgroundColor: settings.brandColor }}>
                        {settings.logoUrl && (
                          <Avatar className="h-8 w-8 rounded-full mr-3 bg-white p-1">
                            <AvatarImage src={settings.logoUrl} alt="Logo" />
                          </Avatar>
                        )}
                        <span className="text-white font-medium">{settings.chatTitle}</span>
                        <button className="ml-auto text-white">
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto" style={{ 
                        minHeight: '300px', 
                        backgroundColor: settings.chatBackgroundType === 'solid' ? settings.chatBackgroundColor : 'transparent',
                        backgroundImage: settings.chatBackgroundType === 'gradient' 
                          ? settings.chatBackgroundGradient 
                          : settings.chatBackgroundType === 'pattern' 
                            ? `url(${settings.chatBackgroundPattern})`
                            : settings.chatBackgroundType === 'image'
                              ? `url(${settings.chatBackgroundImage})`
                              : 'none',
                        backgroundSize: settings.chatBackgroundType === 'pattern' ? 'auto' : 'cover',
                        backgroundRepeat: settings.chatBackgroundType === 'pattern' ? 'repeat' : 'no-repeat',
                        backgroundPosition: 'center'
                      }}>
                        {/* Bot Message */}
                        <div className="flex mb-4">
                          <Avatar className="h-8 w-8 rounded-full mr-3 bg-white p-1">
                            {settings.logoUrl ? (
                              <AvatarImage src={settings.logoUrl} alt="Bot" />
                            ) : (
                              <AvatarFallback className="bg-primary-100 text-primary-600">
                                <MessageSquare className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="bg-white p-3 rounded-lg shadow-sm max-w-xs">
                            <p className="text-sm text-gray-800">{settings.welcomeMessage}</p>
                          </div>
                        </div>
                        
                        {/* User Message */}
                        <div className="flex mb-4 justify-end">
                          <div className="bg-primary-100 p-3 rounded-lg shadow-sm max-w-xs">
                            <p className="text-sm text-primary-800">Hi there! I'm looking for information about my recent order.</p>
                          </div>
                        </div>
                        
                        {/* Bot Message */}
                        <div className="flex mb-4">
                          <Avatar className="h-8 w-8 rounded-full mr-3 bg-white p-1">
                            {settings.logoUrl ? (
                              <AvatarImage src={settings.logoUrl} alt="Bot" />
                            ) : (
                              <AvatarFallback className="bg-primary-100 text-primary-600">
                                <MessageSquare className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="bg-white p-3 rounded-lg shadow-sm max-w-xs">
                            <p className="text-sm text-gray-800">I'd be happy to help with your order. Could you please provide your order number or the email address used for the purchase?</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat Input */}
                      <div className="p-3 border-t border-gray-200">
                        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                          <input type="text" placeholder="Type your message..." className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm" />
                          <button className="ml-2 text-gray-400 hover:text-gray-600">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
