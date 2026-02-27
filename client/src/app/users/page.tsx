"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Search, User } from "lucide-react";
import ChatModal from "@/components/ChatModal";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeChatUser, setActiveChatUser] = useState<Doc<"users"> | null>(null);
  
  // This hook automatically re-runs whenever searchTerm changes
  const users = useQuery(api.users.getUsers, { searchTerm });

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Discover People</h1>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search users by name..."
          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* User List */}
      <div className="space-y-4">
        {users === undefined ? (
          <p className="text-gray-500 italic">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          users.map((user: Doc<"users">) => (
            <div 
              key={user._id} 
              onClick={() => setActiveChatUser(user)}
              className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              <img 
                src={user.image} 
                alt={user.name} 
                className="w-12 h-12 rounded-full border"
              />
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {activeChatUser && (
        <ChatModal 
          user={activeChatUser} 
          onClose={() => setActiveChatUser(null)} 
        />
      )}
    </main>
  );
}