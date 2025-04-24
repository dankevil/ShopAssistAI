import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Clock, 
  Save, 
  Settings2, 
  Mail,
  Plus,
  Trash,
  RefreshCw
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import { AutomationSettings as AutomationSettingsType } from "@shared/schema";

const defaultTemplates = {
  initial: "Hello {{customer_name}},\n\nWe noticed you left some items in your shopping cart. Your cart is saved and ready for you to complete your purchase.\n\n{{cart_items}}\n\nClick here to complete your purchase: {{checkout_url}}\n\nIf you have any questions, feel free to reply to this email.\n\nThank you,\n{{store_name}} Team",
  followUp: "Hello {{customer_name}},\n\nJust a friendly reminder that your shopping cart is still waiting for you.\n\n{{cart_items}}\n\nWe're here to help if you have any questions about your items.\n\nClick here to complete your purchase: {{checkout_url}}\n\nThank you,\n{{store_name}} Team",
  final: "Hello {{customer_name}},\n\nThis is your last chance to complete your purchase. We've saved your cart, but we can't hold the items forever.\n\n{{cart_items}}\n\n{{discount_code}}\n\nClick here to complete your purchase: {{checkout_url}}\n\nThank you,\n{{store_name}} Team"
};

export default function AutomationSettings({ storeId }: { storeId: number }) {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<string | null>(null);

  // Fetch automation settings
  const {
    data: settings,
    isLoading,
    isError,
  } = useQuery<AutomationSettingsType>({
    queryKey: ["/api/cart-recovery/automation-settings", storeId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/cart-recovery/automation-settings/${storeId}`
      );
      
      if (!res.ok && res.status === 404) {
        // Return default settings if none exist yet
        return {
          id: 0,
          storeId,
          isEnabled: false,
          initialDelay: 1, // 1 hour
          followUpDelay: 24, // 24 hours
          finalDelay: 48, // 48 hours
          initialTemplate: defaultTemplates.initial,
          followUpTemplate: defaultTemplates.followUp,
          finalTemplate: defaultTemplates.final,
          includeDiscountInFinal: true,
          discountAmount: "10",
          discountType: "percentage" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      
      return await res.json();
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<AutomationSettingsType>) => {
      const method = settings?.id ? "PATCH" : "POST";
      const url = settings?.id 
        ? `/api/cart-recovery/automation-settings/${settings.id}`
        : `/api/cart-recovery/automation-settings`;
      
      const res = await apiRequest(method, url, {
        ...updatedSettings,
        storeId,
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Settings Saved",
        description: "Cart recovery automation settings have been saved successfully.",
      });
      queryClient.setQueryData(["/api/cart-recovery/automation-settings", storeId], data);
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle enabled status
  const handleToggleEnabled = () => {
    if (!settings) return;
    
    saveSettingsMutation.mutate({
      isEnabled: !settings.isEnabled,
    });
  };

  // Save all settings
  const handleSaveSettings = () => {
    if (!settings) return;
    
    saveSettingsMutation.mutate({
      ...settings,
    });
  };

  // Update a field
  const handleUpdateField = (field: keyof AutomationSettingsType, value: any) => {
    if (!settings) return;
    
    queryClient.setQueryData(["/api/cart-recovery/automation-settings", storeId], {
      ...settings,
      [field]: value,
    });
  };

  // Reset templates to default
  const handleResetTemplates = () => {
    if (!settings) return;
    
    queryClient.setQueryData(["/api/cart-recovery/automation-settings", storeId], {
      ...settings,
      initialTemplate: defaultTemplates.initial,
      followUpTemplate: defaultTemplates.followUp,
      finalTemplate: defaultTemplates.final,
    });
  };

  // Show template preview
  const getTemplatePreview = (template: string) => {
    return template
      .replace(/{{customer_name}}/g, "John Doe")
      .replace(/{{store_name}}/g, "Demo Store")
      .replace(/{{cart_items}}/g, "1x Blue T-Shirt - $29.99\n1x Denim Jeans - $49.99")
      .replace(/{{checkout_url}}/g, "https://store.example.com/checkout")
      .replace(/{{discount_code}}/g, settings?.includeDiscountInFinal 
        ? `Use discount code COMEBACK10 for ${settings.discountAmount}% off your order!` 
        : "");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="text-center text-destructive p-8">
        Failed to load automation settings
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> 
              Automation Settings
            </CardTitle>
            <CardDescription>
              Configure automated cart recovery message sequences
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="automation-enabled"
                checked={settings.isEnabled ?? false}
                onCheckedChange={handleToggleEnabled}
              />
              <Label htmlFor="automation-enabled">Enable Automation</Label>
            </div>
            <Button 
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="initial-delay">Initial Message Delay (hours)</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="initial-delay"
                type="number"
                min="1"
                max="72"
                value={settings.initialDelay}
                onChange={(e) => handleUpdateField("initialDelay", parseInt(e.target.value) || 1)}
              />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Time after cart abandonment before sending first message
            </p>
          </div>
          <div>
            <Label htmlFor="followup-delay">Follow-up Message Delay (hours)</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="followup-delay"
                type="number"
                min="1"
                max="72"
                value={settings.followUpDelay}
                onChange={(e) => handleUpdateField("followUpDelay", parseInt(e.target.value) || 24)}
              />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Time after initial message before sending follow-up
            </p>
          </div>
          <div>
            <Label htmlFor="final-delay">Final Message Delay (hours)</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="final-delay"
                type="number"
                min="1"
                max="72"
                value={settings.finalDelay}
                onChange={(e) => handleUpdateField("finalDelay", parseInt(e.target.value) || 48)}
              />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Time after follow-up message before sending final message
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Message Templates</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetTemplates}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="initial">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Initial Message (After {settings.initialDelay} hour{settings.initialDelay > 1 ? 's' : ''})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Textarea
                    value={settings.initialTemplate}
                    onChange={(e) => handleUpdateField("initialTemplate", e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Available placeholders: {"{{customer_name}}, {{store_name}}, {{cart_items}}, {{checkout_url}}"}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPreviewMode(previewMode === 'initial' ? null : 'initial')}
                    >
                      {previewMode === 'initial' ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>
                  {previewMode === 'initial' && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/30">
                      <h4 className="font-medium mb-2">Preview:</h4>
                      <div className="whitespace-pre-line">
                        {getTemplatePreview(settings.initialTemplate)}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="followup">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Follow-up Message (After {settings.followUpDelay} hour{settings.followUpDelay > 1 ? 's' : ''})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Textarea
                    value={settings.followUpTemplate}
                    onChange={(e) => handleUpdateField("followUpTemplate", e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Available placeholders: {"{{customer_name}}, {{store_name}}, {{cart_items}}, {{checkout_url}}"}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPreviewMode(previewMode === 'followup' ? null : 'followup')}
                    >
                      {previewMode === 'followup' ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>
                  {previewMode === 'followup' && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/30">
                      <h4 className="font-medium mb-2">Preview:</h4>
                      <div className="whitespace-pre-line">
                        {getTemplatePreview(settings.followUpTemplate)}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="final">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Final Message (After {settings.finalDelay} hour{settings.finalDelay > 1 ? 's' : ''})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="include-discount"
                      checked={settings.includeDiscountInFinal ?? true}
                      onCheckedChange={(checked) => handleUpdateField("includeDiscountInFinal", checked)}
                    />
                    <Label htmlFor="include-discount">Include discount code in final message</Label>
                    {settings.includeDiscountInFinal && (
                      <div className="flex items-center ml-6">
                        <Input
                          className="w-20"
                          type="text"
                          value={settings.discountAmount ?? "10"}
                          onChange={(e) => handleUpdateField("discountAmount", e.target.value)}
                        />
                        <Select
                          value={settings.discountType ?? "percentage"}
                          onValueChange={(value) => handleUpdateField("discountType", value)}
                        >
                          <SelectTrigger className="w-32 ml-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">% Percentage</SelectItem>
                            <SelectItem value="fixed">$ Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <Textarea
                    value={settings.finalTemplate}
                    onChange={(e) => handleUpdateField("finalTemplate", e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Available placeholders: {"{{customer_name}}, {{store_name}}, {{cart_items}}, {{checkout_url}}, {{discount_code}}"}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPreviewMode(previewMode === 'final' ? null : 'final')}
                    >
                      {previewMode === 'final' ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>
                  {previewMode === 'final' && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/30">
                      <h4 className="font-medium mb-2">Preview:</h4>
                      <div className="whitespace-pre-line">
                        {getTemplatePreview(settings.finalTemplate)}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 border-t flex justify-between">
        <p className="text-sm text-muted-foreground">
          {settings.isEnabled 
            ? "Automatic recovery messages are enabled"
            : "Automatic recovery messages are disabled"}
        </p>
        <Button 
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
        >
          {saveSettingsMutation.isPending ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}