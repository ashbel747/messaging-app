import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user if info changed
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        image: args.image,
      });
      return existingUser._id;
    }

    // Otherwise, create a new record
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      clerkId: args.clerkId,
      image: args.image,
    });
  },
});

export const getUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
       console.log("No identity found");
       return [];
    }

    const currentClerkId = identity.subject;

    const users = await ctx.db.query("users").collect();

    return users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(args.searchTerm.toLowerCase());
      const isNotMe = user.clerkId !== currentClerkId ; 
      return matchesSearch && isNotMe;
    });
  },
});