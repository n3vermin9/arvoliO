import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/logo.svg";

function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="LeoMatch" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">LeoMatch</h1>
          <p className="text-white/60 mt-2">Connect with new people</p>
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
            Log In
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:text-blue-400 transition-all"
          >
            Create new account →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
