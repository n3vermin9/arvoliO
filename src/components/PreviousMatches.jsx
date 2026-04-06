import React, { useState, useEffect } from "react";
import { getUserData } from "../firebase";
import sadLogo from "../assets/sad.png";
import starLogo from "../assets/star.png";

function PreviousMatches({ userId, onBack }) {
  const [previousMatches, setPreviousMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreviousMatches();
  }, [userId]);

  const loadPreviousMatches = async () => {
    setLoading(true);
    try {
      const userData = await getUserData(userId);
      setPreviousMatches(userData?.previousMatches || []);
    } catch (error) {
      console.error("Failed to load previous matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={starLogo} className="w-24 h-24 mx-auto animate-spin" />
          <p className="text-white/60 mt-4">Loading history...</p>
        </div>
      </div>
    );
  }

if (previousMatches.length === 0) {
  return (
    <div className="min-h-screen bg-black">
      <button onClick={onBack} className="absolute top-4 left-4 text-blue-500">
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
      <div className="flex items-center justify-center h-[calc(100vh-80px)] overflow-hidden">
        <div className="text-center">
          <img src={sadLogo} className="w-24 h-24 mx-auto mb-4 grayscale" />
          <h3 className="text-xl font-bold text-white mb-2">
            No match history
          </h3>
          <p className="text-white/60 text-sm">
            People you unmatched will appear here
          </p>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-white text-2xl flex items-center gap-1"
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
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold text-white">
            Previous Matches
          </h1>{" "}
        </div>

        <div className="space-y-3">
          {previousMatches.map((match, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
            >
              {match.photos && match.photos[0] ? (
                <img
                  src={match.photos[0]}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-semibold text-white">{match.name}</h3>
                <p className="text-white/60 text-sm">{match.age} years old</p>
                <p className="text-white/40 text-xs mt-1">
                  Unmatched on{" "}
                  {new Date(match.unmatchedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PreviousMatches;
