import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { updateProfile } from "firebase/auth";

function ProfileSetup({
  userId,
  onComplete,
  isEditing = false,
  existingData = null,
}) {
  const [formData, setFormData] = useState({
    name: existingData?.name || "",
    age: existingData?.age || "",
    gender: existingData?.gender || "other",
    bio: existingData?.bio || "",
    photos: existingData?.photos || ["", "", ""],
  });
  const [loading, setLoading] = useState(false);

  const updatePhotoUrl = (index, url) => {
    const newPhotos = [...formData.photos];
    newPhotos[index] = url;
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validPhotos = formData.photos.filter(
        (url) => url && url.trim() !== "",
      );

      if (auth.currentUser && formData.name) {
        await updateProfile(auth.currentUser, { displayName: formData.name });
      }

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        bio: formData.bio,
        photos: validPhotos,
        hasProfile: true,
        updatedAt: new Date().toISOString(),
      });

      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 pb-20">
      <div className="max-w-md mx-auto pt-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? "Edit Profile" : "Complete Your Profile"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/80 text-sm mb-2 block">
              Profile Photos (up to 3)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="relative aspect-square">
                  {formData.photos[index] ? (
                    <>
                      <img
                        src={formData.photos[index]}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/150?text=Invalid+URL";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => updatePhotoUrl(index, "")}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center border-2 border-dashed border-white/30">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-white/40 text-xs">
                          Photo {index + 1}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {[0, 1, 2].map((index) => (
              <input
                key={index}
                type="text"
                placeholder={`Photo ${index + 1} URL (optional)`}
                value={formData.photos[index] || ""}
                onChange={(e) => updatePhotoUrl(index, e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all text-sm"
              />
            ))}
          </div>

          <div>
            <label className="text-white/80 text-sm mb-1 block">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-white/80 text-sm mb-1 block">Age</label>
            <input
              type="number"
              placeholder="Your age"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              min="18"
              max="100"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-white/80 text-sm mb-1 block">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="male" className="text-black">
                Male
              </option>
              <option value="female" className="text-black">
                Female
              </option>
              <option value="other" className="text-black">
                Other
              </option>
            </select>
          </div>

          <div>
            <label className="text-white/80 text-sm mb-1 block">Bio</label>
            <textarea
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows="4"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Profile"
                : "Start Matching"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-white/60 text-xs text-center">
            Upload images to Imgur or another image host, then paste the direct
            URL above
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;
