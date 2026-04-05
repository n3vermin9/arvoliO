import React, { useState, useEffect } from "react";
import {
  auth,
  logoutUser,
  getUserData,
  listenToUnreadCounts,
  listenToNewLikes,
  listenToMatches,
} from "./firebase";
import Login from "./components/Login";
import Register from "./components/Register";
import ProfileSetup from "./components/ProfileSetup";
import ProfileView from "./components/ProfileView";
import SwipeCard from "./components/SwipeCard";
import MatchesList from "./components/MatchesList";
import Chat from "./components/Chat";
import LikedYou from "./components/LikedYou";
import PreviousMatches from "./components/PreviousMatches";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [currentView, setCurrentView] = useState("swipe");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadLikes, setUnreadLikes] = useState(0);
  const [showPreviousMatches, setShowPreviousMatches] = useState(false);
  const [likedByUsers, setLikedByUsers] = useState([]);
  const [previousLikeCount, setPreviousLikeCount] = useState(0);

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

  useEffect(() => {
    if (user) {
      const unsubscribeUnread = listenToUnreadCounts(
        user.uid,
        (chats, likes) => {
          setUnreadChats(chats);
          setUnreadLikes(likes);
        },
      );

      const unsubscribeLikes = listenToNewLikes(user.uid, (users) => {
        const newLikeCount = users.length;

        if (newLikeCount > previousLikeCount && document.hidden) {
          const difference = newLikeCount - previousLikeCount;
          const notification = new Notification("Someone liked you!", {
            body: `${difference} new like${difference > 1 ? "s" : ""}`,
            icon: "/logo.png",
          });
          notification.onclick = () => {
            window.focus();
            setCurrentView("liked");
          };
        }

        setLikedByUsers(users);
        setPreviousLikeCount(newLikeCount);
      });

      return () => {
        unsubscribeUnread();
        unsubscribeLikes();
      };
    }
  }, [user, previousLikeCount]);

  useEffect(() => {
    if (user && currentView === "chat" && selectedMatch) {
      const unsubscribeMatches = listenToMatches(user.uid, (matches) => {
        const stillMatch = matches.some((m) => m.id === selectedMatch.id);
        if (!stillMatch) {
          setSelectedMatch(null);
          setCurrentView("matches");
        }
      });
      return () => unsubscribeMatches();
    }
  }, [user, currentView, selectedMatch]);

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

  if (showPreviousMatches) {
    return (
      <PreviousMatches
        userId={user.uid}
        onBack={() => setShowPreviousMatches(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/10 z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => setCurrentView("swipe")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
              currentView === "swipe" ? "text-blue-500" : "text-white/60"
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <span className="text-xs">Discover</span>
          </button>

          <button
            onClick={() => setCurrentView("matches")}
            className={`relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
              currentView === "matches" ? "text-blue-500" : "text-white/60"
            }`}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z" />
              </svg>
              {unreadChats > 0 && (
                <div className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1 shadow-lg ring-2 ring-black">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </div>
              )}
            </div>
            <span className="text-xs">Chats</span>
          </button>

          <button
            onClick={() => setCurrentView("liked")}
            className={`relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
              currentView === "liked" ? "text-blue-500" : "text-white/60"
            }`}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {likedByUsers.length > 0 && (
                <div className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1 shadow-lg ring-2 ring-black">
                  {likedByUsers.length > 9 ? "9+" : likedByUsers.length}
                </div>
              )}
            </div>
            <span className="text-xs">Liked You</span>
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
        {currentView === "liked" && (
          <div className="p-4">
            <LikedYou
              userId={user.uid}
              onMatch={() => {
                setCurrentView("matches");
                refreshProfile();
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
            onShowPreviousMatches={() => setShowPreviousMatches(true)}
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
