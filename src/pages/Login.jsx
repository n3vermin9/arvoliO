import React, { useState } from "react";
import {
  getAllData,
  getAllUsers,
  getCurrentUser,
  getUserById,
} from "../services/storage";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const handleUsername = (e) => {
    setUsername(e.target.value);
  };
  const handlePassword = (e) => {
    setPassword(e.target.value);
  };
  const handleClick = () => {
    console.log(
      getAllUsers().find(
        (user) => user.tag === username && user.age == password,
      ),
    );
  };
  return (
    <div
      className="bg-zinc-800 w-full h-screen text-white
     flex items-center justify-center gap-4"
    >
      <input
        className="bg-zinc-600 h-10"
        type="text"
        value={username}
        onChange={handleUsername}
        placeholder="Username"
      ></input>
      <input
        className="bg-zinc-600 h-10"
        type="text"
        value={password}
        onChange={handlePassword}
        placeholder="Password"
      ></input>
      <button onClick={() => handleClick()}>Ok</button>
    </div>
  );
}

export default Login;
