import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import {
  loginThunk,
  registerThunk,
  clearAuthError,
  selectAuthError,
  selectAuthLoading,
} from "../features/auth/authSlice";

interface AuthModalProps {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onClose }) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const [activeMode, setActiveMode] = useState<"login" | "register">(mode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setActiveMode(mode);
    dispatch(clearAuthError());
  }, [mode, dispatch]);

  if (!open) return null;

  const isLogin = activeMode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      const action = await dispatch(
        loginThunk({ email, password })
      );
      if (loginThunk.fulfilled.match(action)) {
        onClose();
      }
    } else {
      const action = await dispatch(
        registerThunk({ email, password, name })
      );
      if (registerThunk.fulfilled.match(action)) {
        onClose();
      }
    }
  };

  const switchMode = (newMode: "login" | "register") => {
    setActiveMode(newMode);
    dispatch(clearAuthError());
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`text-sm font-medium pb-1 border-b-2 ${
                isLogin
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`text-sm font-medium pb-1 border-b-2 ${
                !isLogin
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Register
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2.5 rounded-md disabled:opacity-60"
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Registering..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
