import React, { useState, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { updateProfile } from "firebase/auth";
import { toast } from "react-hot-toast";
import DeleteAccount from "./DeleteAccount";
import { checkUsernameAvailable } from "../firebase";

function ProfileSetup({
  userId,
  onComplete,
  isEditing = false,
  existingData = null,
  onLogout,
}) {
  const [formData, setFormData] = useState({
    name: existingData?.name || "",
    username: existingData?.username || "",
    age: existingData?.age || 18,
    gender: existingData?.gender || null,
    interestedIn: existingData?.interestedIn || "both",
    bio: existingData?.bio || "",
    photos: existingData?.photos || [],
  });
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startAge, setStartAge] = useState(formData.age);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const scrollRef = useRef(null);
  const isFirstTime = !existingData?.gender;

  const updatePhotoUrl = (index, url) => {
    const newPhotos = [...formData.photos];
    newPhotos[index] = url;
    setFormData({
      ...formData,
      photos: newPhotos.filter((p) => p && p.trim() !== ""),
    });
  };

  const addPhotoSlot = () => {
    if (formData.photos.length < 3) {
      setFormData({ ...formData, photos: [...formData.photos, ""] });
    }
  };

  const removeImage = (indexToRemove) => {
    const newPhotos = formData.photos.filter(
      (_, index) => index !== indexToRemove,
    );
    setFormData({ ...formData, photos: newPhotos });
  };

  const checkUsername = async () => {
    if (!formData.username || formData.username.length < 4) {
      toast.error("Username must be at least 4 characters");
      return;
    }
    if (formData.username.length > 20) {
      toast.error("Username must be less than 20 characters");
      return;
    }
    if (!/^[a-z0-9]+$/.test(formData.username)) {
      toast.error("Username can only contain lowercase letters and numbers");
      return;
    }
    setCheckingUsername(true);
    try {
      const available = await checkUsernameAvailable(formData.username);
      setUsernameAvailable(available);
      toast.success(
        available ? "Username available!" : "Username already taken",
      );
    } catch (error) {
      console.error("Error checking username:", error);
      toast.error("Failed to check username");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setStartAge(formData.age);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    const swipeThreshold = 30;

    if (Math.abs(deltaX) > swipeThreshold) {
      let newAge = startAge;
      if (deltaX > 0) {
        newAge = Math.min(40, startAge + Math.floor(deltaX / swipeThreshold));
      } else {
        newAge = Math.max(18, startAge + Math.floor(deltaX / swipeThreshold));
      }

      if (newAge !== formData.age) {
        setFormData({ ...formData, age: newAge });

        const selectedElement = document.getElementById(`age-${newAge}`);
        if (selectedElement && scrollRef.current) {
          const container = scrollRef.current;
          const scrollPosition =
            selectedElement.offsetLeft -
            container.clientWidth / 2 +
            selectedElement.clientWidth / 2;
          container.scrollTo({ left: scrollPosition, behavior: "smooth" });
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const scrollToAge = (age) => {
    setFormData({ ...formData, age: age });
    const selectedElement = document.getElementById(`age-${age}`);
    if (selectedElement && scrollRef.current) {
      const container = scrollRef.current;
      const scrollPosition =
        selectedElement.offsetLeft -
        container.clientWidth / 2 +
        selectedElement.clientWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username) {
      toast.error("Username is required");
      return;
    }
    if (formData.username.length < 4 || formData.username.length > 20) {
      toast.error("Username must be 4-20 characters");
      return;
    }
    if (!/^[a-z0-9]+$/.test(formData.username)) {
      toast.error("Username can only contain lowercase letters and numbers");
      return;
    }
    if (usernameAvailable === false) {
      toast.error("Username already taken. Please choose another.");
      return;
    }

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
        username: formData.username,
        age: parseInt(formData.age),
        gender: formData.gender,
        interestedIn: formData.interestedIn,
        bio: formData.bio,
        photos: validPhotos,
        hasProfile: true,
        updatedAt: new Date().toISOString(),
      });

      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setGender = (gender) => {
    if (isFirstTime) {
      const confirmGender = window.confirm(
        `You selected: ${gender.toUpperCase()}\n\nGender can only be set once and cannot be changed later.\n\nAre you sure you want to continue?`,
      );
      if (confirmGender) {
        setFormData({ ...formData, gender: gender });
      }
    }
  };

  const isGenderLocked = !isFirstTime && formData.gender;

  return (
    <div className="min-h-screen bg-black p-4 pt-0 pb-6">
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-2">
              About "Both" option
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Selecting "Both" allows you to see and match with people of any
              gender. This is great for making friends, networking, or keeping
              your options open. You'll appear in feeds of users who selected
              "Both" or your specific gender.
            </p>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-blue-500 text-white font-semibold py-2 rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto pt-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">
            {isEditing ? "Edit Profile" : "Complete Your Profile"}
          </h1>
          {isEditing && (
            <button
              onClick={onComplete}
              className="text-blue-500 text-sm font-semibold hover:text-blue-400 transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/80 text-sm mb-2 block">
              Profile Photos
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="relative aspect-square">
                  {formData.photos[index] ? (
                    <>
                      <img
                        src={formData.photos[index]}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/150?text=Invalid+URL";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
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
            <button
              type="button"
              onClick={addPhotoSlot}
              disabled={formData.photos.length >= 3}
              className="w-full py-2 bg-white/5 rounded-xl text-white/60 text-sm hover:bg-white/10 transition-all disabled:opacity-50"
            >
              + Add Photo
            </button>
          </div>

          <div className="space-y-2">
            {formData.photos.map((photo, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Photo ${index + 1} URL`}
                value={photo}
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
            <label className="text-white/80 text-sm mb-1 block">Username</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "");
                      if (value.length <= 20) {
                        setFormData({ ...formData, username: value });
                        setUsernameAvailable(null);
                      }
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-7 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={checkUsername}
                disabled={
                  checkingUsername ||
                  !formData.username ||
                  formData.username.length < 4
                }
                className="bg-white/10 hover:bg-white/20 px-4 rounded-xl text-white/80 text-sm disabled:opacity-50"
              >
                {checkingUsername ? "..." : "Check"}
              </button>
            </div>
            <p className="text-white/40 text-xs mt-1">
              4-20 lowercase letters & numbers only
            </p>
            {usernameAvailable === true && (
              <p className="text-green-500 text-xs mt-1">
                ✓ Username available
              </p>
            )}
            {usernameAvailable === false && (
              <p className="text-red-500 text-xs mt-1">
                ✗ Username already taken
              </p>
            )}
          </div>

          <div className="min-h-[120px]">
            <label className="text-white/80 text-sm mb-2 block">
              Age: {formData.age}
            </label>
            <div
              ref={scrollRef}
              className="relative w-full overflow-x-auto hide-scrollbar py-4 cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={(e) => {
                if (isDragging && e.buttons === 1) {
                  handleTouchMove(e);
                }
              }}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <div className="flex items-center min-w-full px-4 gap-2">
                {[...Array(23)].map((_, i) => {
                  const age = 18 + i;
                  const isSelected = age === parseInt(formData.age);
                  return (
                    <div
                      key={age}
                      id={`age-${age}`}
                      onClick={() => scrollToAge(age)}
                      className={`flex-shrink-0 w-12 text-center transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "text-blue-500 text-2xl font-bold"
                          : "text-white/20 text-base hover:text-white/50"
                      }`}
                    >
                      {age}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm mb-2 block">
              Gender {isGenderLocked && "(locked - cannot be changed)"}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                disabled={isGenderLocked && formData.gender !== "male"}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  formData.gender === "male"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                disabled={isGenderLocked && formData.gender !== "female"}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  formData.gender === "female"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setGender("other")}
                disabled={isGenderLocked && formData.gender !== "other"}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  formData.gender === "other"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                Other
              </button>
            </div>
            {isFirstTime && (
              <p className="text-yellow-500/70 text-xs mt-2">
                Warning: Gender can only be set once and cannot be changed later
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-white/80 text-sm">Interested In</label>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="w-4 h-4 rounded-full bg-white/20 text-white/60 text-[10px] flex items-center justify-center hover:bg-white/30 transition-all"
              >
                i
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, interestedIn: "male" })
                }
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  formData.interestedIn === "male"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                Men
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, interestedIn: "female" })
                }
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  formData.interestedIn === "female"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                Women
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, interestedIn: "both" })
                }
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  formData.interestedIn === "both"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                Both
              </button>
            </div>
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
            disabled={
              loading ||
              formData.photos.length === 0 ||
              !formData.gender ||
              !formData.username ||
              usernameAvailable === false
            }
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Profile"
                : "Start Matching"}
          </button>
        </form>

        {isEditing && (
          <div className="mt-6">
            <DeleteAccount userId={userId} onAccountDeleted={onLogout} />
          </div>
        )}

        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-white/60 text-xs text-center">
            Main photo, username, and gender are required. Gender cannot be
            changed after saving. Upload images to Imgur or another image host,
            then paste the direct URL above
          </p>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default ProfileSetup;
