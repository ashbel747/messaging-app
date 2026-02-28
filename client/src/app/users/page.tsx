"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Loader2, Search, Send } from "lucide-react";
import ChatModal from "@/components/ChatModal";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeChatUser, setActiveChatUser] = useState<Doc<"users"> | null>(null);
  const [now, setNow] = useState(Date.now());

  const markRead = useMutation(api.messages.markRead);
  const users = useQuery(api.users.getUsers, { searchTerm });
  
  const unreadCounts = useQuery(api.messages.getUnreadCounts) || {};

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectUser = (user: Doc<"users">) => {
    setActiveChatUser(user);
    // Clear unread badge immediately on click
    markRead({ otherUserId: user._id });
  };

  const isError = users === null;

  return (
    <main className="flex h-screen bg-white overflow-hidden">
      <section className={`${activeChatUser ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 border-r`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Discover People</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {users === undefined ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs text-gray-500 font-medium">Loading users...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="text-sm text-red-500 font-medium">Failed to load users</p>
              <button onClick={() => window.location.reload()} className="text-xs text-blue-600 underline">Try again</button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-sm text-gray-400">No users found</div>
          ) : (
            users.map((user) => {
              const isOnline = user.lastSeen && now - user.lastSeen < 2000;
              const isActive = activeChatUser?._id === user._id;
              const unreadCount = unreadCounts[user._id] || 0;

              return (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition cursor-pointer relative ${
                    isActive ? "bg-blue-50 border-blue-100" : "hover:bg-gray-50 border-transparent"
                  } border`}
                >
                  <div className="relative shrink-0">
                    <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full border" />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="overflow-hidden flex-1">
                    <h3 className="font-medium text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
                  </div>

                  {unreadCount > 0 && !isActive && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className={`${!activeChatUser ? "hidden md:flex" : "flex"} flex-1 flex-col bg-gray-50 relative`}>
        {activeChatUser ? (
          <ChatModal user={activeChatUser} onClose={() => setActiveChatUser(null)} />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 opacity-20" />
            </div>
            <p>Select a person to start chatting</p>
          </div>
        )}
      </section>
    </main>
  );
}