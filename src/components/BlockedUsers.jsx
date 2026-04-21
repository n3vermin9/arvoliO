import React, { useState, useEffect } from "react";
import { getBlockedUsers, unblockUser } from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";
import toast from "react-hot-toast";

function BlockedUsers({ userId, onBack, onUnblock }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, [userId]);

  const loadBlockedUsers = async () => {
    setLoading(true);
    try {
      const users = await getBlockedUsers(userId);
      setBlockedUsers(users);
    } catch (error) {
      console.error("Failed to load blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedUserId) => {
    try {
      await unblockUser(userId, blockedUserId);
      toast.success("User unblocked");
      loadBlockedUsers();
      onUnblock();
    } catch (error) {
      console.error("Failed to unblock user:", error);
      toast.error("Failed to unblock");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={starLogo} className="w-24 h-24 mx-auto animate-spin" />
          <p className="text-white/60 mt-4">Loading blocked users...</p>
        </div>
      </div>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-white text-2xl flex items-center gap-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Blocked Users</h1>
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
          <div className="text-center">
            <img src={sadLogo} className="w-24 h-24 mx-auto mb-4 grayscale" />
            <h3 className="text-xl font-bold text-white mb-2">
              No blocked users
            </h3>
            <p className="text-white/60 text-sm">
              People you block will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-white text-2xl flex items-center gap-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">
            Blocked Users ({blockedUsers.length})
          </h1>
        </div>

        <div className="space-y-3">
          {blockedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
            >
              {user.photos && user.photos[0] ? (
                <img
                  src={user.photos[0]}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-semibold text-white">{user.name}</h3>
                <p className="text-white/60 text-sm">{user.age} years old</p>
                <p className="text-white/40 text-xs mt-1">
                  Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => handleUnblock(user.id)}
                className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm hover:bg-blue-500/30 transition-all"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BlockedUsers;
