import { storage } from "../storage";
import { Request, Response } from "express";
import type { ShopifyOrder } from "../shopify";

/**
 * Cart Recovery System
 * 
 * This module handles automated recovery of abandoned shopping carts through a series of
 * timed messages that aim to bring customers back to complete their purchase.
 * 
 * The system follows this workflow:
 * 1. Find all stores with automation enabled
 * 2. For each store, find abandoned carts eligible for messaging
 * 3. Determine what type of message to send (initial, follow-up, or final with discount)
 * 4. Generate appropriate message with personalization
 * 5. Record the recovery attempt
 * 6. Send notification (via email, SMS, etc.)
 * 
 * Message types and timing:
 * - Initial: Sent shortly after cart abandonment (1-4 hours typically)
 * - Follow-up: Sent 24-48 hours after abandonment if initial message didn't convert
 * - Final: Sent 3-7 days after abandonment, often includes discount incentive
 * 
 * Personalization variables:
 * - {{customer_name}} - The customer's name
 * - {{store_name}} - The store's name
 * - {{cart_items}} - List of items in the cart
 * - {{checkout_url}} - URL to resume checkout
 * - {{discount_code}} - Discount code (final reminder only)
 */

// Types for cart recovery
export type AbandonedCart = {
  id: number;
  storeId: number;
  shopifyCheckoutId: string;
  customerEmail: string | null;
  customerName: string | null;
  totalPrice: number | null;
  currency: string | null;
  cartItems: Array<{
    id: number;
    title: string;
    price: string;
    quantity: number;
    image?: string;
  }>;
  checkoutUrl: string | null;
  abandonedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RecoveryAttempt = {
  id: number;
  cartId: number;
  status: string;
  messageContent: string | null;
  discountCodeOffered: string | null;
  discountAmount: string | null;
  sentAt: string | null;
  convertedAt: string | null;
  createdAt: string | null;
};

export type AutomationSettings = {
  id: number;
  storeId: number;
  isEnabled: boolean;
  initialDelay: number;
  followUpDelay: number;
  finalDelay: number;
  initialTemplate: string;
  followUpTemplate: string;
  finalTemplate: string;
  includeDiscountInFinal: boolean;
  discountAmount: string;
  discountType: 'percentage' | 'fixed';
  createdAt: string;
  updatedAt: string;
};

// Default template messages
const defaultTemplates = {
  initial: "Hello {{customer_name}},\n\nWe noticed you left some items in your shopping cart. Your cart is saved and ready for you to complete your purchase.\n\n{{cart_items}}\n\nClick here to complete your purchase: {{checkout_url}}\n\nIf you have any questions, feel free to reply to this email.\n\nThank you,\n{{store_name}} Team",
  followUp: "Hello {{customer_name}},\n\nJust a friendly reminder that your shopping cart is still waiting for you.\n\n{{cart_items}}\n\nWe're here to help if you have any questions about your items.\n\nClick here to complete your purchase: {{checkout_url}}\n\nThank you,\n{{store_name}} Team",
  final: "Hello {{customer_name}},\n\nThis is your last chance to complete your purchase. We've saved your cart, but we can't hold the items forever.\n\n{{cart_items}}\n\n{{discount_code}}\n\nClick here to complete your purchase: {{checkout_url}}\n\nThank you,\n{{store_name}} Team"
};

// Generate a random discount code
export function generateDiscountCode(): string {
  const prefix = "COMEBACK";
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding similar looking chars
  let result = prefix;
  
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

// Format cart items for email
export function formatCartItems(cart: AbandonedCart): string {
  if (!cart.cartItems || cart.cartItems.length === 0) {
    return "No items in cart";
  }
  
  return cart.cartItems.map(item => {
    return `${item.quantity}x ${item.title} - ${item.price}`;
  }).join("\n");
}

// Prepare a message with placeholders replaced
export function prepareMessage(
  template: string, 
  cart: AbandonedCart, 
  storeName: string,
  discountCode?: string,
  discountAmount?: string,
  discountType?: string
): string {
  let message = template
    .replace(/{{customer_name}}/g, cart.customerName || "Customer")
    .replace(/{{store_name}}/g, storeName || "Store")
    .replace(/{{cart_items}}/g, formatCartItems(cart))
    .replace(/{{checkout_url}}/g, cart.checkoutUrl || "#");
  
  // Add discount code if provided
  if (discountCode && discountAmount && discountType) {
    const discountText = discountType === 'percentage' 
      ? `Use discount code ${discountCode} for ${discountAmount}% off your order!`
      : `Use discount code ${discountCode} for $${discountAmount} off your order!`;
    
    message = message.replace(/{{discount_code}}/g, discountText);
  } else {
    message = message.replace(/{{discount_code}}/g, "");
  }
  
  return message;
}

// Process automation for cart recovery
export async function processAutomatedRecovery() {
  try {
    // 1. Get all stores with active automation
    const stores = await storage.getStoresWithAutomation();
    
    for (const store of stores) {
      const automationSettings = await storage.getAutomationSettings(store.id);
      
      if (!automationSettings || !automationSettings.isEnabled) {
        continue;
      }
      
      // 2. Get abandoned carts that need processing
      const abandonedCarts = await storage.getCartsForAutomation(store.id);
      
      for (const cart of abandonedCarts) {
        // 3. Calculate which message to send based on cart status and times
        const existingAttempts = await storage.getRecoveryAttemptsByCart(cart.id);
        let messageType: 'initial' | 'followUp' | 'final' | null = null;
        let includeDiscount = false;
        
        // No attempts yet - check if it's time for initial message
        if (existingAttempts.length === 0) {
          const abandonedTime = new Date(cart.abandonedAt || cart.createdAt || new Date()).getTime();
          const hoursElapsed = (Date.now() - abandonedTime) / (1000 * 60 * 60);
          
          if (hoursElapsed >= automationSettings.initialDelay) {
            messageType = 'initial';
          }
        } 
        // Has initial but no follow-up - check if it's time for follow-up
        else if (existingAttempts.length === 1 && 
                existingAttempts[0].status !== 'converted') {
          const lastAttemptTime = new Date(existingAttempts[0].sentAt || existingAttempts[0].createdAt || new Date()).getTime();
          const hoursElapsed = (Date.now() - lastAttemptTime) / (1000 * 60 * 60);
          
          if (hoursElapsed >= automationSettings.followUpDelay) {
            messageType = 'followUp';
          }
        }
        // Has follow-up but no final - check if it's time for final
        else if (existingAttempts.length === 2 && 
                !existingAttempts.some(a => a.status === 'converted')) {
          const lastAttemptTime = new Date(existingAttempts[1].sentAt || existingAttempts[1].createdAt || new Date()).getTime();
          const hoursElapsed = (Date.now() - lastAttemptTime) / (1000 * 60 * 60);
          
          if (hoursElapsed >= automationSettings.finalDelay) {
            messageType = 'final';
            
            // Include discount for final reminder if enabled
            if (automationSettings.includeDiscountInFinal) {
              includeDiscount = true;
            }
          }
        }
        
        // 4. Send the message if needed
        if (messageType) {
          // Generate message content using the utility function in storage
          const messageData = storage.generateCartRecoveryMessage(
            cart,
            cart.customerName || undefined,
            includeDiscount
          );
          
          // 5. Create recovery attempt
          await storage.recordCartRecoveryAttempt(cart.id, {
            messageContent: messageData.message,
            discountCode: messageData.discountCode,
            discountAmount: messageData.discountAmount
          });
          
          // 6. Send the actual email (implementation would depend on email provider)
          if (cart.customerEmail) {
            // Here we would integrate with SendGrid or another email provider
            console.log(`[Automation] Sending ${messageType} recovery email to ${cart.customerEmail} for cart ${cart.id}`);
            
            // Example implementation:
            // await sendEmail({
            //   to: cart.customerEmail,
            //   from: `${store.name} <noreply@${store.domain}>`,
            //   subject: messageType === 'final' 
            //     ? `Last chance to complete your purchase!` 
            //     : `Your cart is waiting for you at ${store.name}`,
            //   html: messageData.message.replace(/\n/g, '<br>'),
            //   text: messageData.message,
            // });
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in processAutomatedRecovery:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Unknown error in processAutomatedRecovery");
      return { success: false, error: "Unknown error occurred" };
    }
  }
}

// API handler for automation settings
export async function getAutomationSettings(req: Request, res: Response) {
  try {
    const { storeId } = req.params;
    const settings = await storage.getAutomationSettings(Number(storeId));
    
    if (!settings) {
      return res.status(404).json({ message: "Automation settings not found" });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Error in getAutomationSettings:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Server error", error: error.message });
    } else {
      res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
    }
  }
}

export async function createAutomationSettings(req: Request, res: Response) {
  try {
    const settings = req.body;
    const newSettings = await storage.createAutomationSettings(settings);
    
    res.status(201).json(newSettings);
  } catch (error) {
    console.error("Error in createAutomationSettings:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Server error", error: error.message });
    } else {
      res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
    }
  }
}

export async function updateAutomationSettings(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const settings = req.body;
    const updatedSettings = await storage.updateAutomationSettings(Number(id), settings);
    
    if (!updatedSettings) {
      return res.status(404).json({ message: "Automation settings not found" });
    }
    
    res.json(updatedSettings);
  } catch (error) {
    console.error("Error in updateAutomationSettings:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Server error", error: error.message });
    } else {
      res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
    }
  }
}

// Simulation for testing
export async function simulateCartAbandonment(req: Request, res: Response) {
  try {
    const { storeId } = req.params;
    const { count = 1 } = req.body;
    
    const simulatedCarts = [];
    
    for (let i = 0; i < count; i++) {
      const cart = {
        storeId: Number(storeId),
        shopifyCheckoutId: `sim_${Date.now()}_${i}`,
        customerEmail: `customer${i}@example.com`,
        customerName: `Test Customer ${i}`,
        totalPrice: (Math.floor(Math.random() * 200) + 20).toString(),
        currency: "USD",
        cartItems: [
          {
            id: 1000 + i,
            title: `Product ${i+1}`,
            price: `$${Math.floor(Math.random() * 100) + 10}.99`,
            quantity: Math.floor(Math.random() * 3) + 1,
          }
        ],
        checkoutUrl: `https://teststore.com/checkout/${Date.now()}${i}`,
        abandonedAt: new Date(),
      };
      
      const savedCart = await storage.saveAbandonedCart(cart);
      simulatedCarts.push(savedCart);
    }
    
    res.status(201).json({ 
      message: `Created ${count} simulated abandoned cart(s)`,
      carts: simulatedCarts
    });
  } catch (error) {
    console.error("Error in simulateCartAbandonment:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Server error", error: error.message });
    } else {
      res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
    }
  }
}

// Run automation immediately (manual trigger)
export async function runAutomationNow(req: Request, res: Response) {
  try {
    const result = await processAutomatedRecovery();
    
    if (result.success) {
      res.json({ message: "Automation processed successfully" });
    } else {
      res.status(500).json({ message: "Error processing automation", error: result.error });
    }
  } catch (error) {
    console.error("Error in runAutomationNow:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Server error", error: error.message });
    } else {
      res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
    }
  }
}