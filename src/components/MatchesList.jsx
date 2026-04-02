import React, { useState, useEffect } from "react";
import {
  listenToMatches,
  listenToChatUpdates,
  markMessagesAsRead,
} from "../firebase";

function MatchesList({ userId, onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const truncateText = (text, maxLength = 30) => {
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

        if (chatUpdate.lastMessage && chatUpdate.lastMessageTime) {
          let lastMessageTime;
          if (chatUpdate.lastMessageTime?.toDate) {
            lastMessageTime = chatUpdate.lastMessageTime.toDate();
          } else if (chatUpdate.lastMessageTime) {
            lastMessageTime = new Date(chatUpdate.lastMessageTime);
          }

          const storedTime = localStorage.getItem(`last_seen_${match.id}`);

          if (
            lastMessageTime &&
            (!storedTime || new Date(storedTime) < lastMessageTime)
          ) {
            if (Notification.permission === "granted" && document.hidden) {
              const notification = new Notification(
                `New message from ${match.name}`,
                {
                  body: truncateText(chatUpdate.lastMessage, 50),
                  icon: match.photos?.[0] || null,
                },
              );

              notification.onclick = () => {
                window.focus();
                handleSelectMatch(match);
              };
            }
          }
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-3xl animate-spin mb-2">💕</div>
          <p className="text-white/60">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😢</div>
        <h3 className="text-xl font-bold text-white mb-2">No matches yet</h3>
        <p className="text-white/60 text-sm">
          Keep swiping to find your perfect match
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">
        Matches ({matches.length})
      </h2>

      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={match.id}
            onClick={() => handleSelectMatch(match)}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/10 transition-all cursor-pointer relative"
          >
            {match.photos && match.photos[0] ? (
              <img
                src={match.photos[0]}
                alt={match.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                👤
              </div>
            )}

            {match.unreadCount > 0 && (
              <div className="absolute top-2 left-12 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {match.unreadCount > 9 ? "9+" : match.unreadCount}
              </div>
            )}

            <div className="flex-1">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-white">{match.name}</h3>
                {match.lastMessageTime && (
                  <span className="text-white/40 text-xs">
                    {formatTime(match.lastMessageTime)}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">{match.age} years old</p>
              {match.lastMessage && (
                <div className="flex items-center gap-1 mt-1">
                  {getReadReceipt(match) && (
                    <span className="text-blue-400 text-xs">
                      {getReadReceipt(match)}
                    </span>
                  )}
                  <p
                    className={`text-xs truncate ${match.unreadCount > 0 ? "text-white font-medium" : "text-white/40"}`}
                  >
                    {truncateText(match.lastMessage, 35)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchesList;
