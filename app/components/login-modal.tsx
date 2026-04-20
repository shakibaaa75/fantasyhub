"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, ArrowRight } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store tokens
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Close modal and refresh page or update state
      onClose();
      window.location.reload(); // Or use a state update to show logged-in UI
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0e0a14] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Welcome back
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Sign in to your account
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-lavender/30 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-lavender/30 transition-colors"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-11 rounded-lg bg-gradient-to-r from-plum to-blush text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(94,61,140,0.35)] transition-shadow disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-xs text-neutral-500 hover:text-lavender transition-colors"
                >
                  Don't have an account?{" "}
                  <span className="text-lavender">Create one</span>
                </button>
              </div>
            </form>

            {/* OAuth Divider */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleGoogleOAuth()}
                  className="h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-sm text-neutral-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => handleFacebookOAuth()}
                  className="h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-sm text-neutral-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// OAuth handlers
function handleGoogleOAuth() {
  fetch("http://localhost:8080/api/auth/google")
    .then((res) => res.json())
    .then((data) => {
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    })
    .catch((err) => console.error("Google OAuth error:", err));
}

function handleFacebookOAuth() {
  fetch("http://localhost:8080/api/auth/facebook")
    .then((res) => res.json())
    .then((data) => {
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    })
    .catch((err) => console.error("Facebook OAuth error:", err));
}
