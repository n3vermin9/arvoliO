import React, { useState } from "react";
import { IconShare3 } from "@tabler/icons-react";

function ShareModal({ link, name, age, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <IconShare3 size={28} color="white" />
          </div>
          <h3 className="text-white font-bold text-lg">Share Profile</h3>
          <p className="text-white/60 text-sm mt-1">
            Share {name}, {age} with others
          </p>
        </div>

        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <p className="text-white/80 text-sm break-all">{link}</p>
        </div>

        <button
          onClick={handleCopy}
          className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-all"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 text-white/60 text-sm py-2 hover:text-white transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ShareModal;
