import React, { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  listenToMessages,
  markMessagesAsRead,
  removeMatch,
} from "../firebase";

function Chat({ match, userId, onBack, onMatchRemoved }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getReadStatus = (msg, index) => {
    if (msg.senderId !== userId) return null;
    const nextMessage = messages[index + 1];
    if (nextMessage && nextMessage.senderId === userId) return null;
    if (msg.read) return "✓✓";
    return "✓";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-white text-2xl">
            ←
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
            className="text-white text-2xl"
          >
            ←
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
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="bg-black/95 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-white text-2xl active:opacity-50"
        >
          ←
        </button>

        {match.photos && match.photos[0] ? (
          <img
            src={match.photos[0]}
            alt={match.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
            👤
          </div>
        )}

        <div className="flex-1">
          <h2 className="text-white font-semibold">{match.name}</h2>
          <p className="text-green-500 text-xs">Online</p>
        </div>

        <button
          onClick={() => setShowRemoveConfirm(true)}
          disabled={removing}
          className="text-red-400 text-sm px-3 py-1 rounded-lg active:bg-red-500/20 disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/40">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Say hi to start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-white/10 flex gap-2 bg-black"
      >
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all text-sm"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-blue-500 text-white px-6 rounded-full font-semibold hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default Chat;
