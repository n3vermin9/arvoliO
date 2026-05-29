import React, { useState } from "react";
import ProfileSetup from "./ProfileSetup";
import ShareModal from "./ShareModal";
import { IconShare3 } from "@tabler/icons-react";

function ProfileView({
  userData,
  userId,
  onUpdate,
  onLogout,
  onShowPreviousMatches,
  onShowBlockedUsers,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
  const blockedCount = (
    userData?.previousMatches?.filter((m) => m.blocked === true) || []
  ).length;

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

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (isFullScreen && hasPhotos) {
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={() => setIsFullScreen(false)}
      >
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
        <div
          className="w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentPhotoIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 pb-20">
      {showShareModal && (
        <ShareModal
          link={`${window.location.origin}/profile/${userId}`}
          name={userData?.name}
          age={userData?.age}
          onClose={() => setShowShareModal(false)}
        />
      )}
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">My Profile</h1>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 text-sm font-semibold hover:text-blue-400 transition-all"
          >
            Edit
          </button>
        </div>

        <div className="mb-4 flex justify-center">
          {hasPhotos ? (
            photos.length === 1 ? (
              <div
                className="w-32 h-32 rounded-full overflow-hidden cursor-pointer border-2 border-white/20 hover:border-blue-500 transition-all mx-auto"
                onClick={() => {
                  setCurrentPhotoIndex(0);
                  setIsFullScreen(true);
                }}
              >
                <img src={photos[0]} className="w-full h-full object-cover" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 justify-center">
                    {photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 w-24 h-24 rounded-full overflow-hidden cursor-pointer border-2 border-white/20 hover:border-blue-500 transition-all"
                        onClick={() => {
                          setCurrentPhotoIndex(idx);
                          setIsFullScreen(true);
                        }}
                      >
                        <img
                          src={photo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {photos.length > 1 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all ${
                          idx === currentPhotoIndex
                            ? "w-4 bg-white"
                            : "w-1 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            )
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
              <div className="text-3xl">📷</div>
            </div>
          )}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {userData?.name || "Not set"}
          </h2>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 space-y-4 mb-6">
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider">
              Username
            </label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-white/60 text-sm">@</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${userData?.username}`);
                }}
                className="text-white text-lg font-semibold hover:text-blue-400 transition-all text-left"
              >
                {userData?.username || "Not set"}
              </button>
            </div>
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
              Bio
            </label>
            <p className="text-white/80 mt-1 leading-relaxed">
              {userData?.bio || "No bio yet"}
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
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onShowPreviousMatches}
              className="text-center hover:bg-white/10 rounded-xl p-2 transition-all flex flex-col items-center"
            >
              <div className="text-2xl font-bold text-blue-400">
                {totalMatches}
              </div>
              <div className="text-white/40 text-xs mt-1">Matches</div>
            </button>
            <div className="text-center flex flex-col justify-center items-center">
              <div className="text-2xl font-bold text-blue-400">
                {userData?.swipes?.length || 0}
              </div>
              <div className="text-white/40 text-xs mt-1">Swipes</div>
            </div>
            <button
              onClick={onShowBlockedUsers}
              className="text-center hover:bg-white/10 rounded-xl p-2 transition-all flex flex-col items-center"
            >
              <div className="text-2xl font-bold text-red-400">
                {blockedCount}
              </div>
              <div className="text-white/40 text-xs mt-1">Blocked</div>
            </button>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full border border-white/20 transition-all flex items-center justify-center gap-2"
        >
          <IconShare3 size={20} />
          Share Profile
        </button>

        <button
          onClick={onLogout}
          className="w-full mt-3 bg-gray-500/20 text-gray-300 font-semibold py-3 rounded-full border border-gray-500/50 hover:bg-gray-500/30 transition-all active:scale-95"
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
