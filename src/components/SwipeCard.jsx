import React, { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { getNextProfile, createSwipe } from "../firebase";

function SwipeCard({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noMore, setNoMore] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  useEffect(() => {
    loadNextProfile();
  }, []);

  const loadNextProfile = async () => {
    setLoading(true);
    setCurrentImageIndex(0);
    try {
      const nextProfile = await getNextProfile(userId);
      if (!nextProfile) {
        setNoMore(true);
        setProfile(null);
      } else {
        setProfile(nextProfile);
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

    try {
      const result = await createSwipe(userId, profile.id, direction);

      if (result.matched) {
        const matchAlert = document.createElement("div");
        matchAlert.className =
          "fixed top-20 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce text-center";
        matchAlert.innerHTML = `🎉 It's a match! You matched with ${profile.name}! 🎉`;
        document.body.appendChild(matchAlert);
        setTimeout(() => matchAlert.remove(), 3000);
      }

      loadNextProfile();
    } catch (error) {
      console.error("Failed to record swipe:", error);
    }
  };

  const handleDragEnd = (event, info) => {
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-white/60">Finding people...</p>
        </div>
      </div>
    );
  }

  if (noMore) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
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
    <div className="relative h-screen flex items-center justify-center">
      <motion.div
        className="absolute w-full max-w-md h-[70vh] cursor-grab active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-white/10">
          {profile.photos && profile.photos.length > 0 ? (
            <>
              <img
                src={profile.photos[currentImageIndex]}
                alt={profile.name}
                className="w-full h-full object-cover"
              />

              {hasMultiplePhotos && (
                <div className="absolute top-4 left-0 right-0 flex justify-center gap-1">
                  {profile.photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all ${
                        idx === currentImageIndex
                          ? "w-6 bg-white"
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
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-xl"
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
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-xl"
                    >
                      ›
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <div className="text-8xl">📸</div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
            <h2 className="text-3xl font-bold text-white mb-1">
              {profile.name}, {profile.age}
            </h2>
            <p className="text-white/80 text-lg">
              {profile.bio || "New to LeoMatch!"}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8">
        <button
          onClick={() => handleSwipe("pass")}
          className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur border-2 border-red-500 text-red-500 text-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
        >
          ✗
        </button>
        <button
          onClick={() => handleSwipe("like")}
          className="w-16 h-16 rounded-full bg-green-500/20 backdrop-blur border-2 border-green-500 text-green-500 text-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

export default SwipeCard;
