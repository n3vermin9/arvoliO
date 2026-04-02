import React, { useState } from "react";
import { auth, db } from "../firebase";
import { deleteUser, signInWithEmailAndPassword } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

function DeleteAccount({ userId, onAccountDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [needReauth, setNeedReauth] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const deleteUserData = async () => {
    setDeleting(true);
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("No user logged in");
        setDeleting(false);
        return;
      }

      try {
        await deleteUser(user);
        await deleteDoc(doc(db, "users", userId));
        onAccountDeleted();
        return;
      } catch (error) {
        if (error.code === "auth/requires-recent-login") {
          setNeedReauth(true);
          setDeleting(false);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(`Failed to delete account: ${error.message}`);
      setDeleting(false);
    }
  };

  const reauthenticateAndDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const user = auth.currentUser;
      const email = user.email;

      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await deleteUser(credential.user);

      await deleteDoc(doc(db, "users", userId));

      onAccountDeleted();
    } catch (error) {
      console.error("Re-authentication failed:", error);
      setError("Incorrect password or failed to delete account");
      setDeleting(false);
    }
  };

  if (needReauth) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/5 rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="text-2xl font-bold text-white">Confirm Deletion</h2>
            <p className="text-white/60 text-sm mt-2">
              For security, please enter your password to delete your account
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-red-500 transition-all"
              autoFocus
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-center text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setNeedReauth(false)}
                className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={reauthenticateAndDelete}
                disabled={!password || deleting}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={deleteUserData}
      disabled={deleting}
      className="w-full mt-3 bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "🗑️ Delete Account"}
    </button>
  );
}

export default DeleteAccount;
