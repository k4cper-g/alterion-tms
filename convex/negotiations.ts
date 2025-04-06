import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { MutationCtx } from "./_generated/server";
import { sendNegotiationUpdateEmail } from "./email";

// Create a new negotiation
export const createNegotiation = mutation({
  args: {
    offerId: v.string(),
    initialRequest: v.object({
      origin: v.string(),
      destination: v.string(),
      price: v.string(),
      loadType: v.optional(v.string()),
      weight: v.optional(v.string()),
      dimensions: v.optional(v.string()),
      carrier: v.optional(v.string()),
      notes: v.optional(v.string()),
      offerContactEmail: v.optional(v.string()),
    })
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Create the negotiation using the provided initialRequest
    const negotiationId = await ctx.db.insert("negotiations", {
      userId: user._id,
      offerId: args.offerId,
      status: "pending", // initial status
      initialRequest: args.initialRequest, // Use the object directly from args
      messages: [],
      counterOffers: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { negotiationId };
  },
});

// Get all negotiations for the current user
export const getUserNegotiations = query({
  args: {},
  handler: async (ctx) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all negotiations for this user
    const negotiations = await ctx.db
      .query("negotiations")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    return negotiations;
  },
});

// Get a specific negotiation by ID
export const getNegotiationById = query({
  args: { negotiationId: v.id("negotiations") },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id) {
      throw new Error("Unauthorized access to negotiation");
    }

    return negotiation;
  },
});

// Add a message to a negotiation
export const addMessage = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    message: v.string(),
    sender: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Add message
    const newMessage = {
      sender: args.sender,
      content: args.message,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.negotiationId, {
      messages: [...negotiation.messages, newMessage],
      updatedAt: Date.now(),
    });

    // --- Schedule Email Sending Action --- 
    if (args.sender === "user" && negotiation.initialRequest.offerContactEmail) {
        console.log(`Scheduling email notification for negotiation ${args.negotiationId}`);
        await ctx.scheduler.runAfter(0, (internal.email as any).sendNegotiationUpdateEmail, {
            negotiationId: args.negotiationId,
            messageContent: args.message,
            senderUserId: user._id,
        });
    } else {
        if (args.sender !== "user") {
            console.log(`Skipping email notification: Sender is not 'user' (${args.sender}).`);
        } else if (!negotiation.initialRequest.offerContactEmail) {
            console.log(`Skipping email notification: No offerContactEmail set for negotiation ${args.negotiationId}.`);
        }
    }
    // -------------------------------------

    return { success: true };
  },
});

// Submit a counter offer
export const submitCounterOffer = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    price: v.string(),
    proposedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Add counter offer
    const newCounterOffer = {
      price: args.price,
      proposedBy: args.proposedBy,
      timestamp: Date.now(),
      status: "pending",
      notes: args.notes,
    };

    await ctx.db.patch(args.negotiationId, {
      counterOffers: [...negotiation.counterOffers, newCounterOffer],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update negotiation status
export const updateNegotiationStatus = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Update status
    await ctx.db.patch(args.negotiationId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update counter offer status
export const updateCounterOfferStatus = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    offerIndex: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Check if the counter offer exists
    if (args.offerIndex < 0 || args.offerIndex >= negotiation.counterOffers.length) {
      throw new Error("Counter offer not found");
    }

    // Update the counter offer status
    const updatedCounterOffers = [...negotiation.counterOffers];
    updatedCounterOffers[args.offerIndex] = {
      ...updatedCounterOffers[args.offerIndex],
      status: args.status,
    };

    // If accepting an offer, update the negotiation status as well
    let negotiationStatus = negotiation.status;
    if (args.status === "accepted") {
      negotiationStatus = "accepted";
    }

    await ctx.db.patch(args.negotiationId, {
      counterOffers: updatedCounterOffers,
      status: negotiationStatus,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a negotiation by ID
export const deleteNegotiation = mutation({
  args: {
    negotiationId: v.id("negotiations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Check if the negotiation exists
    const negotiation = await ctx.db.get(args.negotiationId);
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }
    
    // Delete the negotiation
    await ctx.db.delete(args.negotiationId);
    
    return { success: true };
  },
});

// --- Internal Query to Fetch Negotiation Details ---
// Needed by actions that cannot query db directly (like email sending)
export const getNegotiationByIdInternal = internalQuery({
  args: { negotiationId: v.id("negotiations") },
  handler: async (ctx: QueryCtx, args): Promise<Doc<"negotiations"> | null> => {
    const negotiation = await ctx.db.get(args.negotiationId);
    return negotiation;
  },
});

// --- Internal Mutation to Add Email Reply to Chat ---
export const addReplyFromEmail = internalMutation({
  args: {
    negotiationId: v.id("negotiations"),
    senderEmail: v.string(),
    content: v.string(),
    incomingMessageId: v.string(), // This raw ID might contain <>
  },
  handler: async (ctx, args) => {
    const negotiation = await ctx.db.get(args.negotiationId);
    if (!negotiation) {
      console.error(`Negotiation ${args.negotiationId} not found. Cannot add email reply.`);
      return; 
    }

    // --- Strip angle brackets from incoming Message-ID ---
    const cleanMessageId = args.incomingMessageId.replace(/^<|>$/g, "");
    // ---------------------------------------------------

    // Avoid adding duplicate messages if webhook fires multiple times (based on clean ID)
    const existingMessage = negotiation.messages.find(
      (msg) => msg.emailMessageId === cleanMessageId 
    );
    if (existingMessage) {
      console.warn(`Duplicate email message ID ${cleanMessageId} detected for negotiation ${args.negotiationId}. Skipping.`);
      return;
    }

    // Add the new message
    const newMessage = {
      sender: `Email: ${args.senderEmail}`,
      content: args.content,
      timestamp: Date.now(),
      emailMessageId: cleanMessageId, // Store the clean Message-ID
    };

    await ctx.db.patch(args.negotiationId, {
      messages: [...negotiation.messages, newMessage],
      updatedAt: Date.now(),
      lastEmailMessageId: cleanMessageId, // Update with the clean ID
    });

    console.log(`Added email reply from ${args.senderEmail} to negotiation ${args.negotiationId}`);

    // --- Trigger Agent if Active --- 
    if (negotiation.isAgentActive) {
        console.log(`[addReplyFromEmail] Scheduling agent run for negotiation ${args.negotiationId} due to new email reply.`);
        await ctx.scheduler.runAfter(0, internal.agent.runAgentNegotiation, {
            negotiationId: args.negotiationId,
        });
    } else {
        console.log(`[addReplyFromEmail] Agent not active for negotiation ${args.negotiationId}. Not scheduling run.`);
    }
    // -------------------------------

  },
});

// --- Mutation to Update Email Settings for a Negotiation ---
export const updateEmailSettings = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    subject: v.optional(v.string()),
    ccRecipients: v.optional(v.array(v.string())), // Expecting an array of email strings
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const negotiation = await ctx.db.get(args.negotiationId);
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Add authorization check: Ensure the user owns this negotiation
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || negotiation.userId !== user._id) {
      throw new Error("Unauthorized to update this negotiation's settings");
    }

    // Prepare updates, only including fields that were actually provided
    const updates: Partial<Doc<"negotiations">> = {};
    if (args.subject !== undefined) {
      updates.emailSubject = args.subject; // Store null or empty string if provided
    }
    if (args.ccRecipients !== undefined) {
      // Basic validation/cleaning of CC emails (can be enhanced)
      const cleanedCc = args.ccRecipients
        .map(email => email.trim())
        .filter(email => email.length > 0 && email.includes('@')); // Simple validation
      updates.emailCcRecipients = cleanedCc.length > 0 ? cleanedCc : undefined; // Store undefined if empty after cleaning
    }

    await ctx.db.patch(args.negotiationId, updates);

    console.log(`Updated email settings for negotiation ${args.negotiationId}`);
    return { success: true };
  },
});

// --- Mutation to Update AI Agent Settings --- 
export const configureAgent = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    isActive: v.boolean(),
    targetPricePerKm: v.optional(v.number()), // Required if activating, optional otherwise
    agentSettings: v.optional(v.object({
      style: v.union(
        v.literal("conservative"),
        v.literal("balanced"),
        v.literal("aggressive")
      ),
      notifyOnPriceIncrease: v.boolean(),
      notifyOnNewTerms: v.boolean(),
      maxAutoReplies: v.number(),
      notifyAfterRounds: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const negotiation = await ctx.db.get(args.negotiationId);
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Authorization check
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || negotiation.userId !== user._id) {
      throw new Error("Unauthorized to configure agent for this negotiation");
    }

    // Validation
    if (args.isActive && typeof args.targetPricePerKm !== 'number') {
      throw new Error("Target price per km must be provided to activate the agent.");
    }
    
    // Define default settings
    const defaults = {
      style: "balanced" as const,
      notifyOnPriceIncrease: true,
      notifyOnNewTerms: true,
      maxAutoReplies: 3,
      notifyAfterRounds: 5,
    };

    // Update negotiation table (basic status)
    const negotiationUpdates: Partial<Doc<"negotiations">> = {
        isAgentActive: args.isActive,
        agentTargetPricePerKm: args.isActive ? args.targetPricePerKm : undefined,
        agentStatus: args.isActive ? 'negotiating' : undefined,
        agentReplyCount: args.isActive ? 0 : undefined, // Reset or clear reply count
        updatedAt: Date.now(),
    };
    await ctx.db.patch(args.negotiationId, negotiationUpdates);

    // Upsert agent configuration table
    if (args.isActive) {
      const currentConfig = await ctx.db
        .query("agentConfigurations")
        .withIndex("by_negotiationId", q => q.eq("negotiationId", args.negotiationId))
        .first();
        
      const settingsToSave = { ...defaults, ...(args.agentSettings || {}) };
      
      if (currentConfig) {
        // Update existing config
        await ctx.db.patch(currentConfig._id, settingsToSave);
        console.log(`Agent configuration updated for negotiation ${args.negotiationId}`);
      } else {
        // Insert new config
        await ctx.db.insert("agentConfigurations", {
          negotiationId: args.negotiationId,
          userId: user._id,
          ...settingsToSave,
        });
        console.log(`Agent configuration inserted for negotiation ${args.negotiationId}`);
      }
    } else {
      // Optional: Could delete the config row when deactivated
      // const currentConfig = await ctx.db.query("agentConfigurations")...first();
      // if (currentConfig) await ctx.db.delete(currentConfig._id);
       console.log(`Agent deactivated for negotiation ${args.negotiationId}. Settings retained.`);
    }

    console.log(`Agent state updated for negotiation ${args.negotiationId}: Active=${args.isActive}`);

    // --- Trigger agent immediately ONLY if activating AND it's not our turn ---
    if (args.isActive) {
      const lastMessage = negotiation.messages.length > 0 
                          ? negotiation.messages[negotiation.messages.length - 1] 
                          : null;
      
      // Run immediately in two cases:
      // 1. If there is a last message AND it wasn't from us (user or agent)
      // 2. If there are no messages at all (start the conversation)
      if ((lastMessage && lastMessage.sender !== 'user' && lastMessage.sender !== 'agent') || 
          negotiation.messages.length === 0) {
        console.log(`[configureAgent] Scheduling immediate run for activated agent on ${args.negotiationId} (${negotiation.messages.length === 0 ? 'no messages yet' : 'last message from other party'}).`);
        await ctx.scheduler.runAfter(0, internal.agent.runAgentNegotiation, {
            negotiationId: args.negotiationId,
        });
      } else {
        // If last message was from us/agent, just activate and wait.
        console.log(`[configureAgent] Agent activated for ${args.negotiationId}, but waiting for other party's reply.`);
      }
    }
    // ------------------------------------------------------------------------

    return { success: true };
  }
});

// --- Internal Mutation for Agent to Add Message ---
export const addAgentMessage = internalMutation({
  args: {
    negotiationId: v.id("negotiations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const negotiation = await ctx.db.get(args.negotiationId);
    if (!negotiation) {
      console.error(`[Agent] Negotiation ${args.negotiationId} not found when trying to add agent message.`);
      return; 
    }

    const newMessage = {
      sender: "agent", // Special sender type for AI
      content: args.content,
      timestamp: Date.now(),
      // emailMessageId is not applicable here as it didn't come via email
    };

    await ctx.db.patch(args.negotiationId, {
      messages: [...negotiation.messages, newMessage],
      updatedAt: Date.now(),
      // Don't update lastEmailMessageId here, only when emails are sent/received
    });
  }
});

// --- Internal Mutation to Update Agent Status --- 
// (Moved from agent.ts)
export const updateAgentStatus = internalMutation({
    args: {
        negotiationId: v.id("negotiations"),
        status: v.optional(v.string()),
        reason: v.optional(v.string()), // Optional reason for status
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.negotiationId, {
            agentStatus: args.status,
            // agentErrorReason: args.reason, // Store reason if schema allows
            updatedAt: Date.now(),
        });
    }
});

// --- Internal Mutation to Increment Agent Reply Count ---
export const incrementAgentReplyCount = internalMutation({
    args: {
        negotiationId: v.id("negotiations"),
    },
    handler: async (ctx, args) => {
        const negotiation = await ctx.db.get(args.negotiationId);
        if (!negotiation) {
            console.error(`[incrementAgentReplyCount] Negotiation ${args.negotiationId} not found.`);
            return;
        }
        
        const currentCount = negotiation.agentReplyCount || 0;
        await ctx.db.patch(args.negotiationId, {
            agentReplyCount: currentCount + 1,
            // updatedAt: Date.now(), // Optionally update timestamp
        });
        // Return the new count for potential use in the calling action
        return currentCount + 1; 
    }
});

// NOTE: Ensure that any existing getNegotiationById query handles authentication/authorization checks,
// as this internal query bypasses those by default. 