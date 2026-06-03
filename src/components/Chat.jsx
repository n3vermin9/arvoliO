import React, { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  listenToMessages,
  markMessagesAsRead,
  removeMatch,
  getUserData,
  blockUser,
  updateTypingStatus,
  listenToTypingStatus,
  listenToUserStatus,
  muteChat,
  isChatMuted,
  deleteMessage,
} from "../firebase";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-hot-toast";
import {
  IconBell,
  IconBellOff,
  IconDots,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react";

function Chat({ match, userId, onBack, onMatchRemoved }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedMessageRect, setSelectedMessageRect] = useState(null);
  const [userStatus, setUserStatus] = useState({
    isOnline: false,
    lastSeen: null,
  });
  const [showMenu, setShowMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const menuRef = useRef(null);
  const messageMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToMessages(match.id, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);

      const hasUnread = newMessages.some(
        (msg) => msg.senderId !== userId && !msg.read,
      );
      if (hasUnread) {
        markMessagesAsRead(match.id, userId);
      }
    });

    return () => unsubscribe();
  }, [match.id, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkMuteStatus = async () => {
      const muted = await isChatMuted(match.id, userId);
      setIsMuted(muted);
    };
    checkMuteStatus();
  }, [match.id, userId]);

  useEffect(() => {
    const unsubscribeTyping = listenToTypingStatus(
      match.id,
      userId,
      (typing) => {
        setIsOtherTyping(typing);
      },
    );
    return () => unsubscribeTyping();
  }, [match.id, userId]);

  useEffect(() => {
    const unsubscribeStatus = listenToUserStatus(match.userId, (status) => {
      setUserStatus(status);
    });
    return () => unsubscribeStatus();
  }, [match.userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (
        messageMenuRef.current &&
        !messageMenuRef.current.contains(event.target)
      ) {
        setShowMessageMenu(false);
        setSelectedMessage(null);
        setSelectedMessageRect(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showMessageMenu) {
      document.body.style.overflow = "hidden";
      if (messagesContainerRef.current) {
        messagesContainerRef.current.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "";
      if (messagesContainerRef.current) {
        messagesContainerRef.current.style.overflow = "auto";
      }
    }

    return () => {
      document.body.style.overflow = "";
      if (messagesContainerRef.current) {
        messagesContainerRef.current.style.overflow = "auto";
      }
    };
  }, [showMessageMenu]);

  useEffect(() => {
    if (showProfile && messagesContainerRef.current) {
      setSavedScrollPosition(messagesContainerRef.current.scrollTop);
    }
  }, [showProfile]);

  useEffect(() => {
    if (
      !showProfile &&
      messagesContainerRef.current &&
      savedScrollPosition > 0
    ) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = savedScrollPosition;
        }
      }, 100);
    }
  }, [showProfile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      await sendMessage(match.id, userId, messageText);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleMute = async () => {
    const newMuteState = !isMuted;
    await muteChat(match.id, userId, newMuteState);
    setIsMuted(newMuteState);
    toast.success(newMuteState ? "Chat muted" : "Chat unmuted");
    setShowMenu(false);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  const handleTyping = () => {
    updateTypingStatus(match.id, userId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(match.id, userId, false);
    }, 1000);
  };

  const handleRemoveMatch = async () => {
    setRemoving(true);
    try {
      await removeMatch(match.id, userId, match.userId);
      onMatchRemoved();
    } catch (error) {
      console.error("Failed to remove match:", error);
      setRemoving(false);
      setShowRemoveConfirm(false);
    }
  };

  const handleBlockUser = async () => {
    setBlocking(true);
    try {
      await blockUser(userId, match.userId, match.id);
      onMatchRemoved();
    } catch (error) {
      console.error("Failed to block user:", error);
      setBlocking(false);
      setShowBlockConfirm(false);
    }
  };

  const handleDeleteChat = () => {
    setShowRemoveConfirm(true);
    setShowMenu(false);
  };

  const viewProfile = async () => {
    const profile = await getUserData(match.userId);
    setOtherUserProfile(profile);
    setCurrentPhotoIndex(0);
    setShowProfile(true);
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  const handleCopyMessage = async () => {
    if (!selectedMessage) return;

    try {
      await navigator.clipboard.writeText(selectedMessage.message);
      toast.success("Message copied to clipboard");
      setShowMessageMenu(false);
      setSelectedMessage(null);
      setSelectedMessageRect(null);
    } catch (error) {
      console.error("Failed to copy message:", error);
      toast.error("Failed to copy message");
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    setShowMessageMenu(false);
    setSelectedMessage(null);
    setSelectedMessageRect(null);

    try {
      await deleteMessage(match.id, selectedMessage.id);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== selectedMessage.id),
      );
      toast.success("Message deleted");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleMessageContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedMessage(msg);
    setSelectedMessageRect(rect);

    if (msg.senderId === userId) {
      setMenuPosition({ x: rect.right - 200, y: rect.top - 50 });
    } else {
      setMenuPosition({ x: rect.left + 30, y: rect.top - 50 });
    }
    setShowMessageMenu(true);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "offline";
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "online";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getReadStatus = (msg, index) => {
    if (msg.senderId !== userId) return null;
    const nextMessage = messages[index + 1];
    if (nextMessage && nextMessage.senderId === userId) return null;
    if (msg.read) return "✓✓";
    return "✓";
  };

  const fullScreenNext = () => {
    const photos = otherUserProfile?.photos || [];
    if (fullScreenIndex < photos.length - 1) {
      setFullScreenIndex(fullScreenIndex + 1);
    }
  };

  const fullScreenPrev = () => {
    if (fullScreenIndex > 0) {
      setFullScreenIndex(fullScreenIndex - 1);
    }
  };

  const getStatusText = () => {
    if (isOtherTyping) {
      return "typing...";
    }
    if (userStatus.isOnline) {
      return "online";
    }
    return `last seen ${formatLastSeen(userStatus.lastSeen)}`;
  };

  const getStatusColor = () => {
    if (isOtherTyping) return "text-white/80";
    if (userStatus.isOnline) return "text-green-500";
    return "text-white/40";
  };

  const messageHeight = selectedMessageRect?.height;
  const isOwnMessage = selectedMessage?.senderId === userId;

  if (isFullScreen && otherUserProfile) {
    const profilePhotos = otherUserProfile.photos || [];
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

if (showProfile && otherUserProfile) {
  const profilePhotos = otherUserProfile.photos || [];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={handleCloseProfile}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleCloseProfile}
      >
        <div
          className="relative bg-[#1c1c1e] rounded-[40px] max-w-sm w-full overflow-y-auto max-h-[80vh] shadow-xl animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5">
            <div className="text-center">
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
                        className="w-24 h-24 rounded-full object-cover mx-auto hover:opacity-80 transition-opacity"
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
                    <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 mt-3">
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl mx-auto">
                  👤
                </div>
              )}

              <h2 className="text-white text-xl font-semibold mt-4">
                {otherUserProfile.name}, {otherUserProfile.age}
              </h2>
              <p className="text-white/60 text-sm capitalize mt-1">
                {otherUserProfile.gender}
              </p>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/80 text-sm leading-relaxed">
                  {otherUserProfile.bio || "No bio yet"}
                </p>
              </div>

              <div className="mt-3 pt-2">
                <p className="text-white/40 text-xs">
                  Member since{" "}
                  {otherUserProfile.createdAt
                    ? new Date(otherUserProfile.createdAt).toLocaleDateString()
                    : "Just joined"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4 pt-0">
            <button
              onClick={() => {
                setShowProfile(false);
                setShowBlockConfirm(true);
              }}
              className="w-full py-4 rounded-full bg-red-500/20 text-red-500 font-semibold text-center hover:bg-red-500/30 active:scale-95 transition-all"
            >
              Block User
            </button>
            <button
              onClick={handleCloseProfile}
              className="w-full py-4 rounded-full hover:bg-white/10 text-white/80 font-semibold text-center active:bg-white/20 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

  if (showBlockConfirm) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowBlockConfirm(false)}
            className="text-white flex items-center"
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-white font-semibold">Block User</h2>
            <p className="text-white/40 text-xs">This cannot be undone</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🚫</div>
              <h2 className="text-2xl font-bold text-red-500">
                Block {match.name}?
              </h2>
              <p className="text-white/60 mt-2 text-sm">
                This will permanently:
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="bg-black/50 rounded-xl p-3">
                <p className="text-white/80 text-sm">
                  • Remove them from your matches
                </p>
                <p className="text-white/80 text-sm">• Delete all messages</p>
                <p className="text-white/80 text-sm">
                  • Prevent them from finding you
                </p>
                <p className="text-white/80 text-sm">
                  • Add them to your blocked list
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                disabled={blocking}
                className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                disabled={blocking}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {blocking ? "Blocking..." : "Block Forever"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-white flex items-center">
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse" />
          <div>
            <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-20 bg-white/5 rounded mt-1 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white/60">Loading messages...</div>
        </div>
      </div>
    );
  }

  if (showRemoveConfirm) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowRemoveConfirm(false)}
            className="text-white flex items-center"
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-white font-semibold">Remove Match</h2>
            <p className="text-white/40 text-xs">This cannot be undone</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">💔</div>
              <h2 className="text-2xl font-bold text-red-500">
                Remove {match.name}?
              </h2>
              <p className="text-white/60 mt-2 text-sm">
                This will permanently delete:
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="bg-black/50 rounded-xl p-3">
                <p className="text-white/80 text-sm">
                  • All messages between you
                </p>
                <p className="text-white/80 text-sm">
                  • This match from your list
                </p>
                <p className="text-white/80 text-sm">
                  • {match.name} will also lose this match
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                disabled={removing}
                className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMatch}
                disabled={removing}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {removing ? "Removing..." : "Remove Forever"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showMessageMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-full z-40" />
      )}
      {showMessageMenu && selectedMessage && selectedMessageRect && (
        <div
          className="fixed z-45"
          style={{
            left: `${selectedMessageRect.left}px`,
            top: `${selectedMessageRect.top}px`,
            width: `${selectedMessageRect.width}px`,
          }}
        >
          <div className="relative">
            <div
              className={`rounded-2xl px-4 py-2 ${
                selectedMessage.senderId === userId
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-white"
              }`}
              style={{ opacity: 1 }}
            >
              <p className="text-sm break-words">{selectedMessage.message}</p>
            </div>
            <div className="flex justify-end gap-1 mt-1 text-xs">
              <span className="text-white/40">
                {formatTime(selectedMessage.timestamp)}
              </span>
              {getReadStatus(selectedMessage, 0) && (
                <span className="text-blue-400">
                  {getReadStatus(selectedMessage, 0)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {showMessageMenu && (
          <div
            ref={messageMenuRef}
            className="fixed z-50 bg-zinc-900 rounded-xl shadow-lg border border-white/10 overflow-hidden"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y + messageHeight + 55}px`,
              minWidth: "140px",
            }}
          >
            <button
              onClick={handleCopyMessage}
              className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 transition-all text-sm flex items-center gap-3"
            >
              <IconCopy size={18} />
              Copy message
            </button>
            {isOwnMessage && (
              <button
                onClick={handleDeleteMessage}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 transition-all text-sm flex items-center gap-3"
              >
                <IconTrash size={18} />
                Delete message
              </button>
            )}
          </div>
        )}

        <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-white flex items-center">
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

          <button
            onClick={viewProfile}
            className="flex items-center gap-3 flex-1 active:opacity-70"
          >
            {match.photos && match.photos[0] ? (
              <img
                src={match.photos[0]}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                👤
              </div>
            )}

            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold">{match.name}</h2>
                {isMuted && <IconBellOff size={16} className="text-white/60" />}
              </div>
              <p className={`text-xs ${getStatusColor()}`}>{getStatusText()}</p>
            </div>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-white/60 hover:text-white transition-all p-2"
            >
              <IconDots size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 rounded-xl shadow-lg border border-white/10 overflow-hidden z-20">
                <button
                  onClick={handleMute}
                  className="w-full text-left px-4 py-3 text-white/80 hover:bg-white/10 transition-all text-sm flex items-center gap-3"
                >
                  {isMuted ? (
                    <>
                      <IconBell size={18} className="text-white/80" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <IconBellOff size={18} className="text-white/80" />
                      Mute
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeleteChat}
                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 transition-all text-sm flex items-center gap-3"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete chat
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{
            transition: "filter 0.2s",
          }}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/40">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Say hi to start the conversation</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSelected =
                showMessageMenu && selectedMessage?.id === msg.id;
              return (
                <div
                  key={msg.id || idx}
                  className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
                  onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                  style={{
                    filter: isSelected
                      ? "none"
                      : showMessageMenu
                        ? "blur(4px)"
                        : "none",
                    transition: "filter 0.2s",
                  }}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.senderId === userId
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
                    >
                      <span className="text-white/40">
                        {formatTime(msg.timestamp)}
                      </span>
                      {getReadStatus(msg, idx) && (
                        <span className="text-blue-400">
                          {getReadStatus(msg, idx)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-white/10 flex gap-2 bg-black relative"
          style={{
            filter: showMessageMenu ? "blur(4px)" : "none",
            transition: "filter 0.2s",
          }}
        >
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center transition-all"
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
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-16 left-4 z-50"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width={300}
                height={400}
                theme="dark"
                previewConfig={{ showPreview: false }}
                searchPlaceholder="Search emojis..."
                skinTonesDisabled={true}
              />
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
              const target = e.target;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.style.height = "auto";
                  }
                }, 0);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all text-sm"
            style={{
              minHeight: "48px",
              height: "auto",
              overflow: "hidden",
            }}
            rows="1"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-500 text-white w-10 h-10 rounded-full pl-1 pb-1 flex items-center justify-center hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5 rotate-45"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}

export default Chat;
