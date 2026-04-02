import React, { useState, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { updateProfile } from "firebase/auth";
import DeleteAccount from "./DeleteAccount";

function ProfileSetup({
  userId,
  onComplete,
  isEditing = false,
  existingData = null,
  onLogout,
}) {
  const [formData, setFormData] = useState({
    name: existingData?.name || "",
    age: existingData?.age || 18,
    gender: existingData?.gender || null,
    bio: existingData?.bio || "",
    photos: existingData?.photos || [""],
  });
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startAge, setStartAge] = useState(formData.age);
  const [showPhoto2, setShowPhoto2] = useState(!!formData.photos[1]);
  const [showPhoto3, setShowPhoto3] = useState(!!formData.photos[2]);
  const scrollRef = useRef(null);
  const isFirstTime = !existingData?.gender;

  const updatePhotoUrl = (index, url) => {
    const newPhotos = [...formData.photos];
    newPhotos[index] = url;
    setFormData({ ...formData, photos: newPhotos });
  };

  const addPhotoSlot = (slot) => {
    if (slot === 2 && !showPhoto2) {
      setShowPhoto2(true);
      const newPhotos = [...formData.photos];
      newPhotos[1] = "";
      setFormData({ ...formData, photos: newPhotos });
    } else if (slot === 3 && !showPhoto3) {
      setShowPhoto3(true);
      const newPhotos = [...formData.photos];
      newPhotos[2] = "";
      setFormData({ ...formData, photos: newPhotos });
    }
  };

  const removePhotoSlot = (slot) => {
    if (slot === 2) {
      setShowPhoto2(false);
      const newPhotos = [...formData.photos];
      newPhotos[1] = "";
      setFormData({ ...formData, photos: newPhotos });
    } else if (slot === 3) {
      setShowPhoto3(false);
      const newPhotos = [...formData.photos];
      newPhotos[2] = "";
      setFormData({ ...formData, photos: newPhotos });
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
              Profile Photos
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="relative aspect-square">
                {formData.photos[0] ? (
                  <>
                    <img
                      src={formData.photos[0]}
                      alt="Main photo"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/150?text=Invalid+URL";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => updatePhotoUrl(0, "")}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center border-2 border-dashed border-white/30">
                    <div className="text-center">
                      <div className="text-2xl mb-1">📷</div>
                      <div className="text-white/40 text-xs">Main Photo</div>
                    </div>
                  </div>
                )}
              </div>

              {showPhoto2 && (
                <div className="relative aspect-square">
                  {formData.photos[1] ? (
                    <>
                      <img
                        src={formData.photos[1]}
                        alt="Photo 2"
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/150?text=Invalid+URL";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoSlot(2)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center border-2 border-dashed border-white/30">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-white/40 text-xs">Photo 2</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showPhoto3 && (
                <div className="relative aspect-square">
                  {formData.photos[2] ? (
                    <>
                      <img
                        src={formData.photos[2]}
                        alt="Photo 3"
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/150?text=Invalid+URL";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoSlot(3)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center border-2 border-dashed border-white/30">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-white/40 text-xs">Photo 3</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!showPhoto2 && (
                <button
                  type="button"
                  onClick={() => addPhotoSlot(2)}
                  className="aspect-square bg-white/5 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-white/30 hover:border-blue-500 transition-all"
                >
                  <div className="text-2xl mb-1">+</div>
                  <div className="text-white/40 text-xs">Add Photo</div>
                </button>
              )}

              {showPhoto2 && !showPhoto3 && (
                <button
                  type="button"
                  onClick={() => addPhotoSlot(3)}
                  className="aspect-square bg-white/5 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-white/30 hover:border-blue-500 transition-all"
                >
                  <div className="text-2xl mb-1">+</div>
                  <div className="text-white/40 text-xs">Add Photo</div>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Main photo URL (required)"
              value={formData.photos[0] || ""}
              onChange={(e) => updatePhotoUrl(0, e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all text-sm"
              required
            />
            {showPhoto2 && (
              <input
                type="text"
                placeholder="Photo 2 URL (optional)"
                value={formData.photos[1] || ""}
                onChange={(e) => updatePhotoUrl(1, e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all text-sm"
              />
            )}
            {showPhoto3 && (
              <input
                type="text"
                placeholder="Photo 3 URL (optional)"
                value={formData.photos[2] || ""}
                onChange={(e) => updatePhotoUrl(2, e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all text-sm"
              />
            )}
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
            disabled={loading || !formData.photos[0] || !formData.gender}
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
            Main photo and gender are required. Gender cannot be changed after
            saving. Upload images to Imgur or another image host, then paste the
            direct URL above
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
