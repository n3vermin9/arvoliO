import React, { useState, useEffect, useRef } from "react";
import {
  listenToMatches,
  listenToChatUpdates,
  markMessagesAsRead,
  getUserData,
} from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";
import { IconBell, IconBellOff } from "@tabler/icons-react";

function MatchesList({ userId, onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

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
    setCurrentPhotoIndex(0);
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

  const fullScreenNext = () => {
    const photos = selectedProfile?.photos || [];
    if (fullScreenIndex < photos.length - 1) {
      setFullScreenIndex(fullScreenIndex + 1);
    }
  };

  const fullScreenPrev = () => {
    if (fullScreenIndex > 0) {
      setFullScreenIndex(fullScreenIndex - 1);
    }
  };

  if (isFullScreen && selectedProfile) {
    const profilePhotos = selectedProfile.photos || [];
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={() => setIsFullScreen(false)}
      >
        <button
          onClick={() => setIsFullScreen(false)}
          className="absolute top-4 left-4 text-white text-2xl z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
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
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={profilePhotos[fullScreenIndex]}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        {profilePhotos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fullScreenPrev();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white text-2xl"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fullScreenNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white text-2xl"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {profilePhotos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === fullScreenIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (showProfile && selectedProfile) {
    const profilePhotos = selectedProfile.photos || [];

    return (
      <div
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={() => setShowProfile(false)}
      >
        <div
          className="bg-white/5 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-4">
            {profilePhotos.length > 0 ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => {
                      setFullScreenIndex(currentPhotoIndex);
                      setIsFullScreen(true);
                    }}
                    className="mx-auto block"
                  >
                    <img
                      src={profilePhotos[currentPhotoIndex]}
                      className="w-32 h-32 rounded-full object-cover mx-auto hover:opacity-80 transition-opacity"
                    />
                  </button>
                  {profilePhotos.length > 1 && (
                    <div className="flex justify-center gap-1 mt-2">
                      {profilePhotos.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 rounded-full transition-all ${
                            idx === currentPhotoIndex
                              ? "w-4 bg-white"
                              : "w-1 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {profilePhotos.length > 1 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
                    <div className="flex gap-2 justify-center">
                      {profilePhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={`flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                            idx === currentPhotoIndex
                              ? "border-blue-500"
                              : "border-white/30"
                          }`}
                        >
                          <img
                            src={photo}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
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

            <button
              onClick={() => setShowProfile(false)}
              className="w-full mt-2 bg-blue-500/20 text-blue-400 font-semibold py-2 rounded-xl hover:bg-blue-500/30 transition-all"
            >
              Close
            </button>
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
        <h1 className="text-xl font-bold text-white pb-4">
          Chats ({matches.length})
        </h1>

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

              <div
                className="flex items-center justify-between flex-1 min-w-0"
                onClick={() => handleSelectMatch(match)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">
                      {match.name}
                    </h3>
                    {match.isMuted && (
                      <IconBellOff
                        size={16}
                        className="text-white/40 flex-shrink-0"
                      />
                    )}
                  </div>
                  {match.lastMessage && (
                    <div className="flex items-center gap-1 mt-1 min-w-0">
                      {getReadReceipt(match) && (
                        <span className="text-blue-400 text-xs flex-shrink-0">
                          {getReadReceipt(match)}
                        </span>
                      )}
                      <p
                        className={`text-xs truncate ${match.unreadCount > 0 && !match.isMuted ? "text-white font-medium" : "text-white/40"}`}
                      >
                        {truncateText(match.lastMessage, 30)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end justify-center gap-0.5">
                  {match.lastMessageTime && (
                    <span className="text-white/40 text-[10px]">
                      {formatTime(match.lastMessageTime)}
                    </span>
                  )}
                  {match.unreadCount > 0 && !match.isMuted && (
                    <div className="min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1">
                      {match.unreadCount > 9 ? "9+" : match.unreadCount}
                    </div>
                  )}
                  {match.unreadCount > 0 && match.isMuted && (
                    <div className="min-w-[18px] h-[18px] bg-white/20 rounded-full flex items-center justify-center text-white/60 text-[9px] font-bold px-1">
                      {match.unreadCount > 9 ? "9+" : match.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MatchesList;
