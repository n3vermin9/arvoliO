import React, { useState, useEffect } from "react";
import { listenToNewLikes, respondToLike, getUserData } from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";

function LikedYou({ userId, onMatch }) {
  const [likedByUsers, setLikedByUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToNewLikes(userId, (likes) => {
      setLikedByUsers(likes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleResponse = async (likedUserId, accept) => {
    setResponding(likedUserId);
    try {
      await respondToLike(userId, likedUserId, accept);
      if (accept) {
        onMatch();
      }
    } catch (error) {
      console.error("Failed to respond to like:", error);
    } finally {
      setResponding(null);
    }
  };

  const viewProfile = async (user) => {
    const profile = await getUserData(user.userId);
    setSelectedProfile(profile);
    setShowProfile(true);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (showProfile && selectedProfile) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowProfile(false)}
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
            <span className="text-sm">Back</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <h2 className="text-white font-semibold">Profile</h2>
            <p className="text-white/40 text-xs">
              Viewing {selectedProfile.name}'s profile
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 rounded-2xl p-6 space-y-4">
              {selectedProfile.photos && selectedProfile.photos[0] ? (
                <img
                  src={selectedProfile.photos[0]}
                  className="w-32 h-32 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-5xl mx-auto">
                  👤
                </div>
              )}

              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {selectedProfile.name}, {selectedProfile.age}
                </h2>
                <p className="text-white/60 text-sm capitalize mt-1">
                  {selectedProfile.gender}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="text-white/40 text-xs uppercase tracking-wider">
                  Bio
                </label>
                <p className="text-white/80 mt-1 leading-relaxed">
                  {selectedProfile.bio || "No bio yet"}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="text-white/40 text-xs uppercase tracking-wider">
                  Member Since
                </label>
                <p className="text-white/60 text-sm mt-1">
                  {selectedProfile.createdAt
                    ? new Date(selectedProfile.createdAt).toLocaleDateString()
                    : "Just joined"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={starLogo} className="w-24 h-24 mx-auto animate-spin" />
          <p className="text-white/60 mt-4">Loading likes...</p>
        </div>
      </div>
    );
  }

  if (likedByUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={sadLogo} className="w-24 h-24 mx-auto mb-4 grayscale" />
          <h3 className="text-xl font-bold text-white mb-2">No likes yet</h3>
          <p className="text-white/60 text-sm">
            Keep swiping to find people who like you
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-white">
        Liked You ({likedByUsers.length})
      </h1>
      {likedByUsers.map((user) => (
        <div key={user.userId} className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => viewProfile(user)} className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                {user.photos && user.photos[0] ? (
                  <img
                    src={user.photos[0]}
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
              </div>
            </button>

            <div className="flex-1">
              <button onClick={() => viewProfile(user)} className="text-left">
                <h3 className="font-semibold text-white hover:text-blue-400 transition-all">
                  {user.name}, {user.age}
                </h3>
                <p className="text-white/40 text-xs">
                  {formatTime(user.timestamp)}
                </p>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(user.userId, false)}
                disabled={responding === user.userId}
                className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleResponse(user.userId, true)}
                disabled={responding === user.userId}
                className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          </div>

          {user.message && (
            <div className="mt-3 flex justify-start">
              <div className="max-w-[85%] min-w-[100px] bg-blue-500/20 rounded-2xl px-4 py-2 break-words">
                <p className="text-blue-300 text-sm">
                  {truncateMessage(user.message, 40)}
                </p>
                <p className="text-blue-400/50 text-[10px] mt-1">
                  Sent with like
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default LikedYou;
