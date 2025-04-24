import Stripe from "stripe";
import { db } from "./db";
import { subscriptionPlans, users, subscriptionTransactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Initialize Stripe with a placeholder initially, it'll be replaced when proper keys are available
let stripe: Stripe | null = null;

// Initialize Stripe if API key is available
export function initStripe() {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16",
    });
    return true;
  }
  console.warn("STRIPE_SECRET_KEY not set. Stripe functionality will be limited.");
  return false;
}

// Check if Stripe is initialized and working
export function isStripeAvailable() {
  return !!stripe;
}

// Get Stripe instance (will return null if not initialized)
export function getStripe() {
  return stripe;
}

// Get subscription plan details by name
export async function getSubscriptionPlanByName(planName: string) {
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.name, planName), eq(subscriptionPlans.active, true)));
  
  return plan;
}

// Get all active subscription plans
export async function getAllSubscriptionPlans() {
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.active, true))
    .orderBy(subscriptionPlans.interactions);
  
  return plans;
}

// Update or get customer ID for a user
export async function getOrCreateStripeCustomer(userId: number) {
  // Check if user already has a Stripe customer ID
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // If Stripe is not initialized, return a placeholder
  if (!stripe) {
    return { 
      customerId: user.stripeCustomerId || "not_available",
      isNew: false
    };
  }

  // If user already has a customer ID, return it
  if (user.stripeCustomerId) {
    try {
      // Verify customer exists in Stripe
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer.deleted) {
        return { customerId: user.stripeCustomerId, isNew: false };
      }
    } catch (error) {
      console.error("Error retrieving Stripe customer:", error);
    }
  }

  // Create a new customer in Stripe
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.username,
      metadata: {
        userId: user.id.toString(),
      },
    });

    // Update user record with new Stripe customer ID
    await db
      .update(users)
      .set({ stripeCustomerId: customer.id })
      .where(eq(users.id, userId));

    return { customerId: customer.id, isNew: true };
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw new Error("Failed to create Stripe customer");
  }
}

// Create a checkout session for subscription
export async function createSubscriptionCheckout(
  userId: number,
  planName: string,
  isYearly: boolean = false
) {
  if (!stripe) {
    throw new Error("Stripe is not initialized");
  }

  const plan = await getSubscriptionPlanByName(planName);
  if (!plan || !plan.stripePriceId) {
    throw new Error(`Subscription plan ${planName} not found or has no Stripe price ID`);
  }

  const { customerId } = await getOrCreateStripeCustomer(userId);

  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.PUBLIC_URL || "https://app.thinkstore.com"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_URL || "https://app.thinkstore.com"}/subscription/cancel`,
    metadata: {
      userId: userId.toString(),
      planName,
      isYearly: isYearly.toString(),
    },
  });

  return session;
}

// Update user subscription information
export async function updateUserSubscription(
  userId: number,
  planName: string,
  stripeSubscriptionId: string,
  status: string
) {
  const plan = await getSubscriptionPlanByName(planName);
  if (!plan) {
    throw new Error(`Subscription plan ${planName} not found`);
  }

  const currentDate = new Date();
  const endDate = new Date(currentDate);
  endDate.setMonth(currentDate.getMonth() + 1); // Default to one month

  // Update user with subscription information
  await db
    .update(users)
    .set({
      subscriptionTier: planName,
      stripeSubscriptionId: stripeSubscriptionId,
      subscriptionStatus: status,
      interactionsCount: 0, // Reset interactions count
      interactionsReset: endDate, // Set next reset date
      subscriptionStartDate: currentDate,
      subscriptionEndDate: endDate,
    })
    .where(eq(users.id, userId));

  // Record the transaction
  await db.insert(subscriptionTransactions).values({
    userId,
    planId: plan.id,
    type: "new", // or "renewal", "upgrade", etc.
    status: "succeeded",
    amount: plan.monthlyPrice, // Use appropriate price based on period
    currency: "usd",
    metadata: {
      subscriptionId: stripeSubscriptionId,
      planName: planName,
    },
  });
}

// Handle webhook events from Stripe
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.userId && session.metadata?.planName) {
        await updateUserSubscription(
          parseInt(session.metadata.userId),
          session.metadata.planName,
          session.subscription as string,
          "active"
        );
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any; // Use any to handle different Stripe API versions
      if (invoice.subscription && invoice.customer) {
        // Update subscription status
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, invoice.customer as string));
        
        if (user) {
          // Update the subscription end date
          const currentDate = new Date();
          const endDate = new Date(currentDate);
          endDate.setMonth(currentDate.getMonth() + 1); // Default to one month

          await db
            .update(users)
            .set({
              subscriptionStatus: "active",
              interactionsCount: 0, // Reset interactions count
              interactionsReset: endDate,
              subscriptionEndDate: endDate,
            })
            .where(eq(users.id, user.id));

          // Record the transaction
          await db.insert(subscriptionTransactions).values({
            userId: user.id,
            planId: null, // Will be updated when we have the plan info
            type: "renewal",
            status: "succeeded",
            amount: invoice.amount_paid ? invoice.amount_paid / 100 : null, // Convert from cents
            currency: invoice.currency,
            stripeInvoiceId: invoice.id,
            metadata: {
              subscriptionId: invoice.subscription,
              invoiceId: invoice.id,
            },
          });
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as any; // Use any to handle different Stripe API versions
      if (invoice.subscription && invoice.customer) {
        // Update subscription status
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, invoice.customer as string));
        
        if (user) {
          await db
            .update(users)
            .set({
              subscriptionStatus: "past_due",
            })
            .where(eq(users.id, user.id));

          // Record the failed payment
          await db.insert(subscriptionTransactions).values({
            userId: user.id,
            planId: null, // Will be updated when we have the plan info
            type: "payment_failed",
            status: "failed",
            amount: invoice.amount_due ? invoice.amount_due / 100 : null, // Convert from cents
            currency: invoice.currency,
            stripeInvoiceId: invoice.id,
            metadata: {
              subscriptionId: invoice.subscription,
              invoiceId: invoice.id,
              failureMessage: invoice.last_payment_error?.message || "Payment failed",
            },
          });
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any; // Use any to handle different Stripe API versions
      if (subscription.customer) {
        // Update user subscription status
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, subscription.customer as string));
        
        if (user) {
          await db
            .update(users)
            .set({
              subscriptionStatus: "canceled",
              subscriptionTier: "free", // Downgrade to free tier
            })
            .where(eq(users.id, user.id));

          // Record the cancellation
          await db.insert(subscriptionTransactions).values({
            userId: user.id,
            planId: null, // No plan ID for cancellation
            type: "cancellation",
            status: "succeeded",
            metadata: {
              subscriptionId: subscription.id,
              canceledAt: new Date().toISOString(),
            },
          });
        }
      }
      break;
    }
  }
}

// Cancel a subscription
export async function cancelSubscription(userId: number) {
  if (!stripe) {
    throw new Error("Stripe is not initialized");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user || !user.stripeSubscriptionId) {
    throw new Error("User has no active subscription");
  }

  try {
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    
    // Update user record
    await db
      .update(users)
      .set({
        subscriptionStatus: "canceled",
        subscriptionTier: "free", // Downgrade to free tier
      })
      .where(eq(users.id, userId));

    // Record the cancellation
    await db.insert(subscriptionTransactions).values({
      userId,
      planId: null, // No plan ID for cancellation
      type: "cancellation",
      status: "succeeded",
      metadata: {
        subscriptionId: user.stripeSubscriptionId,
        canceledAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

// Track message interaction and update counter
export async function trackInteraction(userId: number): Promise<boolean> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error("User not found");
  }

  // Get subscription plan limit
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, user.subscriptionTier || "free"));

  const interactionLimit = plan?.interactions || 500; // Default to free tier limit

  // Check if we need to reset the counter (monthly reset)
  const now = new Date();
  if (!user.interactionsReset || now > user.interactionsReset) {
    // Reset counter and set new reset date
    const resetDate = new Date(now);
    resetDate.setMonth(resetDate.getMonth() + 1);
    
    await db
      .update(users)
      .set({
        interactionsCount: 1, // Start with this interaction
        interactionsReset: resetDate,
      })
      .where(eq(users.id, userId));
    
    return true; // Interaction is allowed
  }

  // Check if user has reached their limit
  if (user.interactionsCount >= interactionLimit) {
    return false; // Limit reached
  }

  // Increment the counter
  await db
    .update(users)
    .set({
      interactionsCount: (user.interactionsCount || 0) + 1,
    })
    .where(eq(users.id, userId));

  return true; // Interaction is allowed
}

// Get usage statistics for a user
export async function getUserUsageStats(userId: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error("User not found");
  }

  // Get subscription plan limit
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, user.subscriptionTier || "free"));

  const interactionLimit = plan?.interactions || 500; // Default to free tier limit
  const interactionsUsed = user.interactionsCount || 0;

  return {
    subscription: {
      tier: user.subscriptionTier || "free",
      status: user.subscriptionStatus || "active",
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
    },
    usage: {
      limit: interactionLimit,
      used: interactionsUsed,
      remaining: Math.max(0, interactionLimit - interactionsUsed),
      percentUsed: Math.min(100, Math.round((interactionsUsed / interactionLimit) * 100)),
      resetDate: user.interactionsReset,
    },
  };
}

// Initialize Stripe when the module loads
initStripe();