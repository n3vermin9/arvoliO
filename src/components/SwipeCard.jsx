import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  getNextProfile,
  createSwipe,
  sendMessageWithLike,
  checkIfLikedMe,
} from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";

function SwipeCard({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noMore, setNoMore] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [alreadyLikedMe, setAlreadyLikedMe] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  useEffect(() => {
    loadNextProfile();
  }, []);

  const loadNextProfile = async () => {
    setLoading(true);
    setCurrentImageIndex(0);
    setShowMessageInput(false);
    setMessageText("");
    setAlreadyLikedMe(false);
    try {
      const nextProfile = await getNextProfile(userId);
      if (!nextProfile) {
        setNoMore(true);
        setProfile(null);
      } else {
        setProfile(nextProfile);
        const liked = await checkIfLikedMe(userId, nextProfile.id);
        setAlreadyLikedMe(liked);
        setNoMore(false);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (!profile) return;

    if (alreadyLikedMe) {
      const alert = document.createElement("div");
      alert.className =
        "fixed top-20 left-4 right-4 bg-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 text-center";
      alert.innerHTML = `${profile.name} already liked you! Check your Liked You tab.`;
      document.body.appendChild(alert);
      setTimeout(() => alert.remove(), 2000);
      loadNextProfile();
      return;
    }

    try {
      const result = await createSwipe(userId, profile.id, direction);

      if (result.matched) {
        const matchAlert = document.createElement("div");
        matchAlert.className =
          "fixed top-20 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce text-center";
        matchAlert.innerHTML = `It's a match! You matched with ${profile.name}!`;
        document.body.appendChild(matchAlert);
        setTimeout(() => matchAlert.remove(), 3000);
      }

      loadNextProfile();
    } catch (error) {
      console.error("Failed to record swipe:", error);
    }
  };

  const handleLikeWithMessage = async () => {
    if (!profile) return;

    if (alreadyLikedMe) {
      const alert = document.createElement("div");
      alert.className =
        "fixed top-20 left-4 right-4 bg-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 text-center";
      alert.innerHTML = `${profile.name} already liked you! Check your Liked You tab.`;
      document.body.appendChild(alert);
      setTimeout(() => alert.remove(), 2000);
      loadNextProfile();
      return;
    }

    if (!messageText.trim()) {
      handleSwipe("like");
      return;
    }

    setSending(true);
    try {
      const result = await sendMessageWithLike(userId, profile.id, messageText);

      if (result.matched) {
        const matchAlert = document.createElement("div");
        matchAlert.className =
          "fixed top-20 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce text-center";
        matchAlert.innerHTML = `It's a match! You matched with ${profile.name}!`;
        document.body.appendChild(matchAlert);
        setTimeout(() => matchAlert.remove(), 3000);
      } else {
        const alert = document.createElement("div");
        alert.className =
          "fixed top-20 left-4 right-4 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce text-center";
        alert.innerHTML = `Like sent to ${profile.name} with your message!`;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 2000);
      }

      loadNextProfile();
    } catch (error) {
      console.error("Failed to send like with message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDragEnd = (event, info) => {
    if (alreadyLikedMe) {
      const alert = document.createElement("div");
      alert.className =
        "fixed top-20 left-4 right-4 bg-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 text-center";
      alert.innerHTML = `${profile.name} already liked you! Check your Liked You tab.`;
      document.body.appendChild(alert);
      setTimeout(() => alert.remove(), 2000);
      loadNextProfile();
      return;
    }

    if (info.offset.x > 80) {
      handleSwipe("like");
    } else if (info.offset.x < -80) {
      handleSwipe("pass");
    }
  };

  const nextImage = () => {
    if (profile?.photos && currentImageIndex < profile.photos.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={starLogo} className="w-24 h-24 mx-auto animate-spin" />
          <p className="text-white/60 mt-4">Finding people...</p>
        </div>
      </div>
    );
  }

  if (noMore) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={sadLogo} className="w-24 h-24 mx-auto mb-4 grayscale" />
          <h3 className="text-xl font-bold text-white mb-2">
            No more profiles!
          </h3>
          <p className="text-white/60">Check back later for new people</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const hasMultiplePhotos = profile.photos && profile.photos.length > 1;

  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-sm px-4">
        {alreadyLikedMe && (
          <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500 rounded-xl text-center">
            <p className="text-yellow-400 text-sm">
              {profile.name} already liked you! Swipe to see next profile.
            </p>
          </div>
        )}

        <motion.div
          className="w-full cursor-grab active:cursor-grabbing"
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          whileTap={{ cursor: "grabbing" }}
        >
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-white/10">
            <div className="aspect-[3/4]">
              {profile.photos && profile.photos.length > 0 ? (
                <>
                  <img
                    src={profile.photos[currentImageIndex]}
                    className="w-full h-full object-cover"
                  />

                  {hasMultiplePhotos && (
                    <div className="absolute top-3 left-0 right-0 flex justify-center gap-1">
                      {profile.photos.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 rounded-full transition-all ${
                            idx === currentImageIndex
                              ? "w-5 bg-white"
                              : "w-1 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {hasMultiplePhotos && (
                    <>
                      {currentImageIndex > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white text-lg"
                        >
                          ‹
                        </button>
                      )}
                      {currentImageIndex < profile.photos.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white text-lg"
                        >
                          ›
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <div className="text-7xl">📸</div>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile.name}, {profile.age}
              </h2>
              <p className="text-white/80 text-sm line-clamp-2">
                {profile.bio || "New to LeoMatch!"}
              </p>
            </div>
          </div>
        </motion.div>

        {showMessageInput ? (
          <div className="mt-4 space-y-2">
            <textarea
              placeholder={`Send a message to ${profile.name}...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all resize-none text-sm"
              rows="3"
              maxLength="300"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowMessageInput(false)}
                className="flex-1 bg-white/10 text-white font-semibold py-2 rounded-xl hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLikeWithMessage}
                disabled={sending || alreadyLikedMe}
                className="flex-1 bg-green-500 text-white font-semibold py-2 rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Like & Message"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => handleSwipe("pass")}
              className="w-14 h-14 rounded-full bg-red-500/20 backdrop-blur border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"
            >
              <svg
                className="w-7 h-7"
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
              onClick={() => setShowMessageInput(true)}
              disabled={alreadyLikedMe}
              className="w-14 h-14 rounded-full bg-blue-500/20 backdrop-blur border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>

            <button
              onClick={() => handleSwipe("like")}
              disabled={alreadyLikedMe}
              className="w-14 h-14 rounded-full bg-green-500/20 backdrop-blur border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwipeCard;
