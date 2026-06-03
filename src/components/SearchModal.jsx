import React, { useState, useEffect, useRef } from "react";
import { searchUsersByUsername, getUserData } from "../firebase";
import { useNavigate } from "react-router-dom";
import starLogo from "../assets/star.png";

function SearchModal({
  onClose,
  currentUserId,
  initialSearchState,
  onNavigateToProfile,
}) {
  const [searchTerm, setSearchTerm] = useState(
    initialSearchState?.searchTerm || "",
  );
  const [results, setResults] = useState(initialSearchState?.results || []);
  const [loading, setLoading] = useState(false);
  const [userMatches, setUserMatches] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(
    initialSearchState?.scrollPosition || 0,
  );
  const resultsContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMatches = async () => {
      const userData = await getUserData(currentUserId);
      setUserMatches(userData?.matches || []);
    };
    if (currentUserId) {
      loadMatches();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (resultsContainerRef.current && scrollPosition > 0) {
      resultsContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length >= 1) {
        performSearch();
      } else if (searchTerm.length === 0) {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const users = await searchUsersByUsername(searchTerm);
      const filtered = users.filter((u) => u.id !== currentUserId);
      setResults(filtered);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    const searchState = {
      searchTerm: searchTerm,
      results: results,
      scrollPosition: resultsContainerRef.current?.scrollTop || 0,
    };
    if (onNavigateToProfile) {
      onNavigateToProfile(userId, searchState);
    } else {
      navigate(`/profile/${userId}`);
      onClose();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="px-4 pt-4 pb-2 bg-black">
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="text-white">
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
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1a1a1a] rounded-full pl-10 pr-4 py-3 text-white placeholder-gray-400 text-base focus:outline-none"
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      <div ref={resultsContainerRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <img src={starLogo} className="w-12 h-12 animate-spin" />
          </div>
        ) : results.length === 0 && searchTerm ? (
          <div className="text-center text-gray-500 mt-8">No users found</div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-white/10">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
              >
                {user.photos && user.photos[0] ? (
                  <img
                    src={user.photos[0]}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                    👤
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {user.name}, {user.age}
                  </h3>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            Search for users by username
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchModal;
