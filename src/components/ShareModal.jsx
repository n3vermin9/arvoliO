import React, { useState } from "react";
import { toast } from "react-hot-toast";

function ShareModal({ link, name, age, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Profile link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${name}, ${age}`,
          text: `Check out ${name}'s profile!`,
          url: link,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#1c1c1e] rounded-[40px] max-w-sm w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">
            Share {name}'s Profile
          </h3>
          <p className="text-graya-400 text-sm mb-4">
            Share this profile link with friends
          </p>
        </div>
        <div className="space-y-2 p-4 pt-0">

          <button
            onClick={handleCopyLink}
            className="w-full py-4 rounded-full  bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 active:scale-95 transition-all"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-full hover:bg-white/10 text-white/80 font-semibold text-center active:bg-white/20 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
