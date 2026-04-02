import React, { useState } from "react";
import ProfileSetup from "./ProfileSetup";
import DeleteAccount from "./DeleteAccount";

function ProfileView({ userData, userId, onUpdate, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);

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
      />
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 pb-20">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-white/60 text-sm mt-1">
            View and manage your profile
          </p>
        </div>

        <div className="mb-6">
          <label className="text-white/80 text-sm mb-2 block">My Photos</label>
          <div className="grid grid-cols-3 gap-2">
            {userData?.photos && userData.photos.length > 0 ? (
              <>
                {userData.photos.slice(0, 3).map((photo, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={photo}
                      alt={`Profile ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ))}
                {[...Array(3 - userData.photos.length)].map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square bg-white/5 rounded-xl flex items-center justify-center"
                  >
                    <div className="text-white/30 text-2xl">📷</div>
                  </div>
                ))}
              </>
            ) : (
              <div className="col-span-3 aspect-square bg-white/5 rounded-xl flex flex-col items-center justify-center">
                <div className="text-6xl mb-2">📷</div>
                <p className="text-white/40 text-sm">No photos yet</p>
              </div>
            )}
          </div>
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
              Bio
            </label>
            <p className="text-white/80 mt-1 leading-relaxed">
              {userData?.bio || "No bio yet. Tell us about yourself!"}
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

        <button
          onClick={() => setIsEditing(true)}
          className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-all active:scale-95"
        >
          ✏️ Edit Profile
        </button>

        <button
          onClick={onLogout}
          className="w-full mt-3 bg-gray-500/20 text-gray-300 font-semibold py-3 rounded-xl border border-gray-500/50 hover:bg-gray-500/30 transition-all active:scale-95"
        >
          🚪 Logout
        </button>

        <DeleteAccount userId={userId} onAccountDeleted={onLogout} />

        <div className="mt-6 bg-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {userData?.matches?.length || 0}
              </div>
              <div className="text-white/40 text-xs mt-1">Matches</div>
            </div>
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
            💡 <strong>Pro Tip:</strong> Add more photos and a detailed bio to
            get more matches!
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
