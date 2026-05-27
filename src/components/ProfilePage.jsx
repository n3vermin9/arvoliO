import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserData,
  auth,
  getUserData as getUserDataById,
  removeMatch,
} from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";
import ShareModal from "./ShareModal";

function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [matchId, setMatchId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

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

  const handleRemoveFriend = async () => {
    if (window.confirm(`Remove ${profile.name} from your friends?`)) {
      await removeMatch(matchId, currentUser.uid, userId);
      setIsFriend(false);
      setMatchId(null);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
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
      <div className="pt-6 px-4 pb-20">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate("/")} className="text-white">
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
              onClick={handleShare}
              className="text-white/60 hover:text-white transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m1.858-3.243a4 4 0 00-5.656 0m5.656 0l-4 4"
                />
              </svg>
            </button>
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
              {profile.name}, {profile.age}
            </h1>
            <p className="text-white/40 text-sm mt-1">@{profile.username}</p>
            <p className="text-white/60 text-sm capitalize mt-1">
              {profile.gender}
            </p>

            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <p className="text-white/80">{profile.bio || "No bio yet"}</p>
            </div>

            {isFriend ? (
              <button
                onClick={handleRemoveFriend}
                className="w-full mt-6 bg-red-500/20 text-red-400 font-semibold py-3 rounded-full border border-red-500/50 hover:bg-red-500/30 transition-all"
              >
                Remove Friend
              </button>
            ) : (
              <button
                onClick={handleSendLike}
                className="w-full mt-6 bg-blue-500 text-white font-semibold py-3 rounded-full hover:bg-blue-600 transition-all"
              >
                {currentUser ? "Send Like" : "Login to Send Like"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
