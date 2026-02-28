import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    clerkId: v.string(),
    lastSeen: v.optional(v.number()),
    isTypingId: v.optional(v.id("users")),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    participantOne: v.id("users"),
    participantTwo: v.id("users"),
    lastRead: v.optional(v.any()),
  }).index("by_participants", ["participantOne", "participantTwo"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    reactions: v.optional(
      v.array(
        v.object({
          userId: v.id("users"),
          emoji: v.string(),
        })
      )
    ),
  }).index("by_conversation", ["conversationId"]),
});