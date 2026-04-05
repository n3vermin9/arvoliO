import React, { useState, useEffect, useRef } from "react";
import {
  listenToMatches,
  listenToChatUpdates,
  markMessagesAsRead,
  getUserData,
} from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";

function MatchesList({ userId, onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const truncateText = (text, maxLength = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  useEffect(() => {
    const unsubscribeMatches = listenToMatches(userId, (updatedMatches) => {
      setMatches(updatedMatches);
      setLoading(false);
    });

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => unsubscribeMatches();
  }, [userId]);

  useEffect(() => {
    const unsubscribes = [];

    matches.forEach((match) => {
      const unsubscribeChat = listenToChatUpdates(match.id, (chatUpdate) => {
        setMatches((prevMatches) =>
          prevMatches.map((m) =>
            m.id === match.id
              ? {
                  ...m,
                  lastMessage: chatUpdate.lastMessage,
                  lastMessageTime: chatUpdate.lastMessageTime,
                }
              : m,
          ),
        );
      });

      unsubscribes.push(unsubscribeChat);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [matches.map((m) => m.id).join(",")]);

  const handleSelectMatch = async (match) => {
    localStorage.setItem(`last_seen_${match.id}`, new Date().toISOString());

    if (match.unreadCount > 0) {
      await markMessagesAsRead(match.id, userId);
      setMatches((prevMatches) =>
        prevMatches.map((m) =>
          m.id === match.id ? { ...m, unreadCount: 0 } : m,
        ),
      );
    }

    onSelectMatch(match);
  };

  const viewProfile = async (match, e) => {
    e.stopPropagation();
    const profile = await getUserData(match.userId);
    setSelectedProfile(profile);
    setShowProfile(true);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp) {
      date = new Date(timestamp);
    } else {
      return "";
    }
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getReadReceipt = (match) => {
    if (!match.lastMessage) return "";
    if (match.lastSenderId === userId) {
      if (match.lastMessageRead) {
        return "✓✓";
      }
      return "✓";
    }
    return "";
  };

  if (showProfile && selectedProfile) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowProfile(false)}
            className="text-white text-2xl"
          >
            ←
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
          <p className="text-white/60 mt-4">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={sadLogo} className="w-24 h-24 mx-auto mb-4 grayscale" />
          <h3 className="text-xl font-bold text-white mb-2">No chats yet</h3>
          <p className="text-white/60 text-sm">
            When you match with someone, they'll appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto">
      <div className="overflow-x-hidden pb-4">
        <h2 className="text-xl font-bold text-white mb-4 sticky top-0 bg-black py-2">
          Chats ({matches.length})
        </h2>

        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
            >
              <button
                onClick={(e) => viewProfile(match, e)}
                className="flex-shrink-0"
              >
                {match.photos && match.photos[0] ? (
                  <img
                    src={match.photos[0]}
                    className="w-14 h-14 rounded-full object-cover hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl hover:opacity-80 transition-opacity">
                    👤
                  </div>
                )}
              </button>

              {match.unreadCount > 0 && (
                <div className="absolute top-2 left-12 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {match.unreadCount > 9 ? "9+" : match.unreadCount}
                </div>
              )}

              <div
                className="flex-1 min-w-0"
                onClick={() => handleSelectMatch(match)}
              >
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-white truncate">
                    {match.name}
                  </h3>
                  {match.lastMessageTime && (
                    <span className="text-white/40 text-xs flex-shrink-0 ml-2">
                      {formatTime(match.lastMessageTime)}
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-sm">{match.age} years old</p>
                {match.lastMessage && (
                  <div className="flex items-center gap-1 mt-1 min-w-0">
                    {getReadReceipt(match) && (
                      <span className="text-blue-400 text-xs flex-shrink-0">
                        {getReadReceipt(match)}
                      </span>
                    )}
                    <p
                      className={`text-xs truncate ${match.unreadCount > 0 ? "text-white font-medium" : "text-white/40"}`}
                    >
                      {truncateText(match.lastMessage, 30)}
                    </p>
                  </div>
                )}
              </div>

              <div
                className="text-white/40 text-sm cursor-pointer hover:text-white transition-colors flex-shrink-0"
                onClick={() => handleSelectMatch(match)}
              >
                →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MatchesList;
