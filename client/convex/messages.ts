import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: { 
    content: v.string(), 
    receiverId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("User not found");

    // 1. Find the existing conversation
    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) => 
        q.or(
          q.and(q.eq(q.field("participantOne"), currentUser._id), q.eq(q.field("participantTwo"), args.receiverId)),
          q.and(q.eq(q.field("participantOne"), args.receiverId), q.eq(q.field("participantTwo"), currentUser._id))
        )
      ).first();

    // 2. Determine the conversation ID (use existing or create new)
    const conversationId = existingConversation 
      ? existingConversation._id 
      : await ctx.db.insert("conversations", {
          participantOne: currentUser._id,
          participantTwo: args.receiverId,
        });

    // 3. Insert message using the conversationId we just got
    await ctx.db.insert("messages", {
      conversationId,
      senderId: currentUser._id,
      content: args.content,
    });
  },
});

export const getMessages = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) return [];

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => 
        q.or(
          q.and(q.eq(q.field("participantOne"), currentUser._id), q.eq(q.field("participantTwo"), args.otherUserId)),
          q.and(q.eq(q.field("participantOne"), args.otherUserId), q.eq(q.field("participantTwo"), currentUser._id))
        )
      ).first();

    if (!conversation) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
      .order("asc")
      .collect();

    return messages.map(m => ({
      ...m,
      isMine: m.senderId === currentUser._id,
      isDeleted: m.isDeleted ?? false,
    }));
  },
});

export const softDeleteMessages = mutation({
  args: {
    messageIds: v.array(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("User not found");

    for (const id of args.messageIds) {
      const message = await ctx.db.get(id);
      if (!message) continue;

      // SECURITY: only sender can delete
      if (message.senderId !== currentUser._id) continue;

      await ctx.db.patch(id, {
        isDeleted: true,
        deletedAt: Date.now(),
        /* content: "", // optional: wipe content */
      });
    }
  },
});

export const markRead = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) return;

    // Find the conversation
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => 
        q.or(
          q.and(q.eq(q.field("participantOne"), currentUser._id), q.eq(q.field("participantTwo"), args.otherUserId)),
          q.and(q.eq(q.field("participantOne"), args.otherUserId), q.eq(q.field("participantTwo"), currentUser._id))
        )
      ).first();

    if (conversation) {
      const lastRead = conversation.lastRead || {};
      await ctx.db.patch(conversation._id, {
        lastRead: { ...lastRead, [currentUser._id]: Date.now() }
      });
    }
  },
});

export const getUnreadCounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return {};

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) return {};

    // Get all conversations for current user
    const conversations = await ctx.db
      .query("conversations")
      .filter(q => q.or(
        q.eq(q.field("participantOne"), currentUser._id),
        q.eq(q.field("participantTwo"), currentUser._id)
      ))
      .collect();

    const results: Record<string, number> = {};

    for (const conv of conversations) {
      const otherUserId = conv.participantOne === currentUser._id ? conv.participantTwo : conv.participantOne;
      const myLastRead = conv.lastRead?.[currentUser._id] || 0;

      // Count messages in this conversation sent by the OTHER person after MY last read
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", q => q.eq("conversationId", conv._id))
        .filter(q => q.and(
          q.gt(q.field("_creationTime"), myLastRead),
          q.neq(q.field("senderId"), currentUser._id),
          q.neq(q.field("isDeleted"), true)
        ))
        .collect();

      results[otherUserId] = unreadMessages.length;
    }

    return results;
  },
});

export const toggleReaction = mutation({
  args: { messageId: v.id("messages"), emoji: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return;

    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const reactions = message.reactions || [];
    const existingIndex = reactions.findIndex(
      (r: any) => r.userId === user._id && r.emoji === args.emoji
    );

    if (existingIndex > -1) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ userId: user._id, emoji: args.emoji });
    }

    await ctx.db.patch(args.messageId, { reactions });
  },
});