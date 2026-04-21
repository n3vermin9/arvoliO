import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserData, auth } from "../firebase";
import { toast } from "react-hot-toast";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";

function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

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

  const handleShare = async () => {
    const link = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.share({
        title: `${profile.name} on ArvoliO`,
        text: `Check out ${profile.name}, ${profile.age} on ArvoliO! 💕`,
        url: link,
      });
    } catch (err) {
      navigator.clipboard.writeText(link);
      toast.success("Profile link copied to clipboard!");
    }
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
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate("/")} className="text-white text-2xl">
            ←
          </button>
          <button
            onClick={handleShare}
            className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-all"
          >
            Share
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
          <p className="text-white/60 text-sm capitalize mt-1">
            {profile.gender}
          </p>

          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <p className="text-white/80">{profile.bio || "No bio yet"}</p>
          </div>

          <button
            onClick={handleSendLike}
            className="w-full mt-6 bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-all"
          >
            {currentUser ? "Send Like" : "Login to Send Like"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
