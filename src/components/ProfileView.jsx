import React, { useState } from "react";
import ProfileSetup from "./ProfileSetup";

function ProfileView({
  userData,
  userId,
  onUpdate,
  onLogout,
  onShowPreviousMatches,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  if (isEditing) {
    return (
      <ProfileSetup
        userId={userId}
        onComplete={() => {
          setIsEditing(false);
          onUpdate();
        }}
        isEditing={true}
        existingData={userData}
        onLogout={onLogout}
      />
    );
  }

  const photos = userData?.photos || [];
  const hasPhotos = photos.length > 0;
  const previousMatchesCount = userData?.previousMatches?.length || 0;
  const totalMatches = (userData?.matches?.length || 0) + previousMatchesCount;

  const nextPhoto = () => {
    if (hasPhotos && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (hasPhotos && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
  };

if (isFullScreen && hasPhotos) {
  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={() => setIsFullScreen(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setIsFullScreen(false)}
          className="absolute top-4 left-4 text-white text-2xl z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
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
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={photos[currentPhotoIndex]}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white text-2xl"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white text-2xl"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx === currentPhotoIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-black p-4 pb-20">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">My Profile</h1>{" "}
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 text-sm font-semibold hover:text-blue-400 transition-all"
          >
            Edit
          </button>
        </div>

        <div className="mb-6">
          {hasPhotos ? (
            <div className="flex justify-center gap-3 overflow-x-auto py-2 scrollbar-hide">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentPhotoIndex(idx);
                    setIsFullScreen(true);
                  }}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <div
                    className={`w-20 h-20 rounded-full overflow-hidden border-2 ${idx === currentPhotoIndex ? "border-blue-500" : "border-white/20"}`}
                  >
                    <img src={photo} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <div className="text-3xl">📷</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 rounded-2xl p-6 space-y-4 mb-6">
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider">
              Name
            </label>
            <p className="text-white text-lg font-semibold mt-1">
              {userData?.name || "Not set"}
            </p>
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider">
              Age
            </label>
            <p className="text-white text-lg font-semibold mt-1">
              {userData?.age || "Not set"}
            </p>
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider">
              Gender
            </label>
            <p className="text-white text-lg font-semibold mt-1 capitalize">
              {userData?.gender || "Not set"}
            </p>
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider">
              Interested In
            </label>
            <p className="text-white text-lg font-semibold mt-1 capitalize">
              {userData?.interestedIn || "Both"}
            </p>
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider">
              Bio
            </label>
            <p className="text-white/80 mt-1 leading-relaxed">
              {userData?.bio || "No bio yet"}
            </p>
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider">
              Member Since
            </label>
            <p className="text-white/60 text-sm mt-1">
              {userData?.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : "Just joined"}
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onShowPreviousMatches}
              className="text-center hover:bg-white/10 rounded-xl p-2 transition-all"
            >
              <div className="text-2xl font-bold text-blue-400">
                {totalMatches}
              </div>
              <div className="text-white/40 text-xs mt-1">Total Matches</div>
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {userData?.swipes?.length || 0}
              </div>
              <div className="text-white/40 text-xs mt-1">People met</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <p className="text-blue-400 text-sm text-center">
            Add more photos and a detailed bio to get more matches
          </p>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-6 bg-gray-500/20 text-gray-300 font-semibold py-3 rounded-xl border border-gray-500/50 hover:bg-gray-500/30 transition-all active:scale-95"
        >
          Logout
        </button>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default ProfileView;
