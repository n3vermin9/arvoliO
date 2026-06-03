import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  getUserData,
  auth,
  getUserData as getUserDataById,
  removeMatch,
} from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";
import ShareModal from "./ShareModal";
import { IconShare3 } from "@tabler/icons-react";

function ProfilePage({ onRestoreSearch }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [matchId, setMatchId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState(false);
  const menuRef = React.useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user && userId) {
        const currentUserData = await getUserDataById(user.uid);
        const friendMatch = currentUserData?.matches?.find(
          (m) => m.userId === userId,
        );
        setIsFriend(!!friendMatch);
        setMatchId(friendMatch?.id);
      }
    });
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserData(userId);
      if (data && data.hasProfile) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendLike = () => {
    if (currentUser) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  const handleBack = () => {
    if (location.state?.fromSearch && onRestoreSearch) {
      onRestoreSearch(location.state.searchState);
      navigate("/");
    } else if (
      document.referrer &&
      document.referrer.includes(window.location.origin)
    ) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleMessage = () => {
    navigate("/", {
      state: {
        openChat: true,
        matchId: matchId,
        userId: userId,
        userName: profile.name,
        userPhoto: profile.photos?.[0],
      },
    });
  };

  const handleRemoveFriend = () => {
    setShowRemoveFriendModal(true);
  };

  const confirmRemoveFriend = async () => {
    setShowRemoveFriendModal(false);
    await removeMatch(matchId, currentUser.uid, userId);
    setIsFriend(false);
    setMatchId(null);
  };

  const handleShare = () => {
    setShowShareModal(true);
    setShowMenu(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <img src={starLogo} className="w-24 h-24 mx-auto animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="text-center">
          <img src={sadLogo} className="w-24 h-24 mx-auto mb-4 grayscale" />
          <h3 className="text-xl font-bold text-white mb-2">
            Profile not found
          </h3>
          <p className="text-white/60 text-sm">
            This user doesn't exist or deleted their account
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 text-blue-500 font-semibold"
          >
            Go to App →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {showShareModal && (
        <ShareModal
          link={`${window.location.origin}/profile/${userId}`}
          name={profile.name}
          age={profile.age}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showRemoveFriendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRemoveFriendModal(false)}
          />
          <div className="relative bg-[#1c1c1e] rounded-[40px] p-4 pb-4 max-w-sm w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">
                Remove {profile?.name}?
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                This will permanently delete all messages and remove them from
                your matches.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={confirmRemoveFriend}
                className="w-full py-4 rounded-full text-red-500 hover:bg-red-500/20 font-semibold text-center active:bg-red-500/30 transition-all"
              >
                Remove Friend
              </button>
              <button
                onClick={() => setShowRemoveFriendModal(false)}
                className="w-full py-4 rounded-full hover:bg-white/10 text-white font-semibold text-center active:bg-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-6 px-4 pb-24">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleBack}
              className="text-white transition-transform active:scale-95 hover:scale-110"
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

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-white/60 hover:text-white transition-all p-2 transition-transform active:scale-95 hover:scale-110"
              >
                <IconShare3 size={20} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 rounded-xl shadow-lg border border-white/10 overflow-hidden z-20">
                    <button
                      onClick={handleShare}
                      className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 transition-all text-sm"
                    >
                      Share Profile
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="text-center">
            {profile.photos && profile.photos[0] ? (
              <img
                src={profile.photos[0]}
                className="w-32 h-32 rounded-full object-cover mx-auto"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-5xl mx-auto">
                👤
              </div>
            )}

            <h1 className="text-2xl font-bold text-white mt-4">
              {profile.name}
            </h1>
            <p className="text-white/40 text-sm mt-1">@{profile.username}</p>
            <p className="text-white/60 text-sm mt-1">
              {profile.age} years old
            </p>
            <p className="text-white/60 text-sm capitalize mt-1">
              {profile.gender}
            </p>

            <div className="mt-6 p-4 bg-white/5 rounded-full">
              <p className="text-white/80">{profile.bio || "No bio yet"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-md mb-4 mx-auto">
          {isFriend ? (
            <>
              <button
                onClick={handleMessage}
                className="w-full bg-blue-500 text-white font-semibold py-3 rounded-full hover:bg-blue-600 transition-all transition-transform active:scale-95"
              >
                Message
              </button>
              <button
                onClick={handleRemoveFriend}
                className="w-full mt-4 bg-red-500/20 text-red-400 font-semibold py-3 rounded-full border border-red-500/50 hover:bg-red-500/30 transition-all transition-transform active:scale-95"
              >
                Remove Friend
              </button>
            </>
          ) : (
            <button
              onClick={handleSendLike}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-full hover:bg-blue-600 transition-all transition-transform active:scale-95"
            >
              {currentUser ? "Send Like" : "Login to Send Like"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
