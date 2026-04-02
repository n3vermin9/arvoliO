import React, { useState, useEffect } from "react";
import { auth, logoutUser, getUserData } from "./firebase";
import Login from "./components/Login";
import Register from "./components/Register";
import ProfileSetup from "./components/ProfileSetup";
import ProfileView from "./components/ProfileView";
import SwipeCard from "./components/SwipeCard";
import MatchesList from "./components/MatchesList";
import Chat from "./components/Chat";
import logo from "./assets/logo.svg";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [currentView, setCurrentView] = useState("swipe");
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const data = await getUserData(firebaseUser.uid);
          if (data && data.name && data.age && data.hasProfile === true) {
            setUserData(data);
            setNeedsProfile(false);
          } else {
            setNeedsProfile(true);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setNeedsProfile(true);
        }
      } else {
        setUser(null);
        setUserData(null);
        setNeedsProfile(false);
        setCurrentView("swipe");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleProfileComplete = async () => {
    const data = await getUserData(user.uid);
    setUserData(data);
    setNeedsProfile(false);
  };

  const refreshProfile = async () => {
    const data = await getUserData(user.uid);
    setUserData(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  if (needsProfile) {
    return (
      <ProfileSetup userId={user.uid} onComplete={handleProfileComplete} />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/10 z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => setCurrentView("swipe")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
              currentView === "swipe" ? "text-blue-500" : "text-white/60"
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 6h-2v2h-2V6h-2V4h2V2h2v2h2v2zm-10 3c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 4c-2.33 0-7 1.17-7 3.5V17h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            <span className="text-xs">Discover</span>
          </button>

          <button
            onClick={() => setCurrentView("matches")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
              currentView === "matches" ? "text-blue-500" : "text-white/60"
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-xs">Matches</span>
          </button>

          <button
            onClick={() => setCurrentView("profile")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
              currentView === "profile" ? "text-blue-500" : "text-white/60"
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      <div className="pb-20">
        {currentView === "swipe" && (
          <SwipeCard userId={user.uid} userData={userData} />
        )}
        {currentView === "matches" && (
          <div className="p-4">
            <MatchesList
              userId={user.uid}
              onSelectMatch={(match) => {
                setSelectedMatch(match);
                setCurrentView("chat");
              }}
            />
          </div>
        )}
        {currentView === "profile" && (
          <ProfileView
            userData={userData}
            userId={user.uid}
            onUpdate={refreshProfile}
            onLogout={handleLogout}
          />
        )}
        {currentView === "chat" && selectedMatch && (
          <Chat
            match={selectedMatch}
            userId={user.uid}
            onBack={() => {
              setSelectedMatch(null);
              setCurrentView("matches");
            }}
            onMatchRemoved={() => {
              setSelectedMatch(null);
              setCurrentView("matches");
              refreshProfile();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
