"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, ArrowRight } from "lucide-react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: RegisterModalProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto-login after registration
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      onClose();
      window.location.reload();
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
                  Create account
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Join the community
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
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="cooluser123"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-lavender/30 transition-colors"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Min 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-lavender/30 transition-colors"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
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
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-neutral-500 hover:text-lavender transition-colors"
                >
                  Already have an account?{" "}
                  <span className="text-lavender">Sign in</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
