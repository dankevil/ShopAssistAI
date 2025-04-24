import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getUser, getStores, getSettings, updateSettings } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Key, Save, RefreshCw, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGES } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

const apiSettingsSchema = z.object({
  shopifyApiKey: z.string().optional(),
  shopifyApiSecret: z.string().optional(),
  enableDebugMode: z.boolean().default(false)
});

const languageSettingsSchema = z.object({
  defaultLanguage: z.string().default('en'),
  supportedLanguages: z.array(z.string()).default(['en']),
});

type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;
type LanguageSettingsFormValues = z.infer<typeof languageSettingsSchema>;

export default function Settings() {
  const [activeStore, setActiveStore] = useState<number | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getUser,
  });

  const { data: storesData } = useQuery({
    queryKey: ['/api/shopify/stores'],
    queryFn: getStores,
  });
  
  // Handle active store selection when data is loaded
  useEffect(() => {
    if (storesData?.stores?.length > 0 && !activeStore) {
      setActiveStore(storesData.stores[0].id);
    }
  }, [storesData, activeStore]);

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/settings', activeStore],
    queryFn: () => activeStore ? getSettings(activeStore) : Promise.resolve(null),
    enabled: !!activeStore,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Sending settings update:", data);
      return updateSettings(settingsData?.id, data);
    },
    onSuccess: (response) => {
      console.log("Settings saved successfully:", response);
      toast({
        title: "Settings saved",
        description: "Your API settings have been updated successfully."
      });
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your settings.",
        variant: "destructive"
      });
    }
  });

  const form = useForm<ApiSettingsFormValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      shopifyApiKey: '',
      shopifyApiSecret: '',
      enableDebugMode: false
    }
  });

  // API form
  useEffect(() => {
    if (settingsData && settingsData.apiKeys) {
      const apiKeys = settingsData.apiKeys as any;
      form.reset({
        shopifyApiKey: apiKeys.shopifyApiKey || '',
        shopifyApiSecret: apiKeys.shopifyApiSecret || '',
        enableDebugMode: apiKeys.enableDebugMode || false
      });
    }
  }, [settingsData, form]);
  
  // Language Settings Form
  const langForm = useForm<LanguageSettingsFormValues>({
    resolver: zodResolver(languageSettingsSchema),
    defaultValues: {
      defaultLanguage: 'en',
      supportedLanguages: ['en']
    }
  });
  
  // Update language form when settings are loaded
  useEffect(() => {
    if (settingsData) {
      langForm.reset({
        defaultLanguage: settingsData.defaultLanguage || 'en',
        supportedLanguages: settingsData.supportedLanguages ? 
          (typeof settingsData.supportedLanguages === 'string' 
            ? JSON.parse(settingsData.supportedLanguages) 
            : settingsData.supportedLanguages) 
          : ['en']
      });
    }
  }, [settingsData, langForm]);

  const onSubmit = (data: ApiSettingsFormValues) => {
    if (!settingsData?.id) return;
    
    updateSettingsMutation.mutate({
      apiKeys: {
        shopifyApiKey: data.shopifyApiKey,
        shopifyApiSecret: data.shopifyApiSecret,
        enableDebugMode: data.enableDebugMode
      }
    });
  };
  
  const onLanguageSubmit = (data: LanguageSettingsFormValues) => {
    if (!settingsData?.id) return;
    
    // Change the current language if needed
    if (data.defaultLanguage !== i18n.language) {
      i18n.changeLanguage(data.defaultLanguage);
    }
    
    updateSettingsMutation.mutate({
      defaultLanguage: data.defaultLanguage,
      supportedLanguages: JSON.stringify(data.supportedLanguages),
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar user={userData} />
      </div>
      
      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <DashboardHeader
          title="Settings"
          user={userData}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="grid grid-cols-1 gap-6">
                {/* API Keys Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Settings</CardTitle>
                    <CardDescription>
                      Configure your Shopify integration. AI functionality is already included in your service.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-blue-50 rounded-md p-4 border border-blue-200 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">AI Functionality Included</h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>OpenAI API access is already configured and included in your service. No additional API key is required.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="shopifyApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shopify API Key</FormLabel>
                                <FormControl>
                                  <Input placeholder="Optional" {...field} />
                                </FormControl>
                                <FormDescription>
                                  For advanced Shopify integrations
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="shopifyApiSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shopify API Secret</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Optional" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Keep this secret secure
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <FormField
                          control={form.control}
                          name="enableDebugMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Debug Mode</FormLabel>
                                <FormDescription>
                                  Enable detailed logging for troubleshooting
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updateSettingsMutation.isPending || settingsLoading}
                          >
                            {updateSettingsMutation.isPending ? (
                              <>
                                <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Settings
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                {/* Language Settings Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <div className="flex items-center">
                        <Globe className="mr-2 h-5 w-5" />
                        {t('settings.language.title', 'Language Settings')}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {t('settings.language.description', 'Configure language preferences for your chatbot')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...langForm}>
                      <form onSubmit={langForm.handleSubmit(onLanguageSubmit)} className="space-y-6">
                        <FormField
                          control={langForm.control}
                          name="defaultLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('settings.language.defaultLanguage', 'Default Language')}</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(LANGUAGES).map(([code, language]) => (
                                    <SelectItem key={code} value={code}>
                                      {language.nativeName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                {t('settings.language.defaultDescription', 'This language will be used as the default for all chatbot conversations')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-medium">{t('settings.language.currentLanguage', 'Current UI Language')}</h4>
                            <p className="text-sm text-gray-500 mt-1">{LANGUAGES[i18n.language as keyof typeof LANGUAGES]?.nativeName || 'English'}</p>
                          </div>
                          <LanguageSwitcher />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updateSettingsMutation.isPending || settingsLoading}
                          >
                            {updateSettingsMutation.isPending ? (
                              <>
                                <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                                {t('settings.saving', 'Saving...')}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {t('settings.saveSettings', 'Save Settings')}
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                {/* Account Settings Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.account.title', 'Account Settings')}</CardTitle>
                    <CardDescription>
                      {t('settings.account.description', 'Manage your account preferences')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1">
                        <h3 className="text-sm font-medium">{t('settings.account.email', 'Email')}</h3>
                        <p className="text-sm text-gray-500">{userData?.email || 'Loading...'}</p>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <h3 className="text-sm font-medium">{t('settings.account.username', 'Username')}</h3>
                        <p className="text-sm text-gray-500">{userData?.username || 'Loading...'}</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="pt-2">
                        <Button variant="outline" disabled>
                          {t('settings.account.changePassword', 'Change Password')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}