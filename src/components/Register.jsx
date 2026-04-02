import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import logo from "../assets/logo.svg";

function Register({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: "",
        age: null,
        gender: "",
        bio: "",
        photos: [],
        hasProfile: false,
        swipes: [],
        matches: [],
        createdAt: new Date().toISOString(),
      });

      onSwitchToLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="LeoMatch" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Join LeoMatch</h1>
          <p className="text-white/60 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-all"
            required
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-all"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-400 transition-all"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
