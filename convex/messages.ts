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
      isMine: m.senderId === currentUser._id
    }));
  },
});