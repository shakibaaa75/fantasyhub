"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { View } from "@/lib/types";
import WelcomeHero from "@/app/components/welcome-hero";
import TagSelector from "@/app/components/tag-selector";
import Searching from "@/app/components/searching";
import MatchFound from "@/app/components/match-found";
import ChatRoom from "@/app/components/chat-room";
import ReportModal from "@/app/components/report-modal";
import SkipModal from "@/app/components/skip-modal";
import Toast from "@/app/components/toast";
import LoginModal from "@/app/components/login-modal";
import RegisterModal from "@/app/components/register-modal";
import SettingsModal from "@/app/components/settings-modal";
import { wsService } from "@/lib/websocket-service";

export default function Home() {
  const [view, setView] = useState<View>("welcome");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [strangerName, setStrangerName] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const [showReport, setShowReport] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "info" | "warn" | "success";
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const isInChatMode = view === "chat" || view === "match";

  // Simple body scroll lock - NO position fixed
  useEffect(() => {
    if (isInChatMode) {
      document.documentElement.classList.add("chat-mode");
    } else {
      document.documentElement.classList.remove("chat-mode");
    }
    return () => {
      document.documentElement.classList.remove("chat-mode");
    };
  }, [isInChatMode]);

  const notify = useCallback(
    (msg: string, type: "info" | "warn" | "success" = "info") => {
      setToast({ msg, type });
    },
    [],
  );

  const handlersRef = useRef<any>({});

  useEffect(() => {
    const handleMatchFound = (data: any) => {
      console.log("Match found!", data);
      setSharedTags(data.shared_tags || []);
      setMatchId(data.match_id || data.id || "match-1");
      setStrangerName(`anon#${Math.floor(Math.random() * 9000 + 1000)}`);
      setView("match");
      setIsSearching(false);
    };

    const handleSearching = () => console.log("Still searching...");

    const handleError = (data: any) => {
      console.error("WebSocket error:", data);
      notify(data.message || "Connection error", "warn");
      setView("tags");
      setIsSearching(false);
    };

    const handleSkipped = () => console.log("Skipped, searching for new match");

    handlersRef.current = {
      match_found: handleMatchFound,
      searching: handleSearching,
      error: handleError,
      skipped: handleSkipped,
    };

    wsService.on("match_found", handleMatchFound);
    wsService.on("searching", handleSearching);
    wsService.on("error", handleError);
    wsService.on("skipped", handleSkipped);

    return () => {
      if (handlersRef.current) {
        wsService.off("match_found", handlersRef.current.match_found);
        wsService.off("searching", handlersRef.current.searching);
        wsService.off("error", handlersRef.current.error);
        wsService.off("skipped", handlersRef.current.skipped);
      }
    };
  }, [notify]);

  const handleTagsSelected = useCallback(
    async (tags: string[]) => {
      setSelectedTags(tags);
      setView("searching");
      setIsSearching(true);
      try {
        await wsService.connect(tags);
      } catch (error) {
        console.error("Failed to connect:", error);
        notify("Failed to connect to server", "warn");
        setView("tags");
        setIsSearching(false);
      }
    },
    [notify],
  );

  const handleSkipFromMatch = useCallback(() => {
    setShowSkip(false);
    wsService.send({ type: "skip", data: {} });
    setView("searching");
    setIsSearching(true);
    notify("Finding someone new...", "info");
  }, [notify]);

  const handleReport = useCallback(() => {
    setShowReport(false);
    wsService.send({ type: "report", data: { reason: "reported by user" } });
    notify("Reported — finding someone new", "success");
    setView("searching");
    setIsSearching(true);
  }, [notify]);

  const handleSkip = useCallback(() => {
    setShowSkip(false);
    wsService.send({ type: "skip", data: {} });
    notify("Skipping...", "info");
    setView("searching");
    setIsSearching(true);
  }, [notify]);

  const handleNavigate = useCallback((v: View | "login" | "register") => {
    if (v === "login") {
      setShowLogin(true);
      setShowRegister(false);
    } else if (v === "register") {
      setShowRegister(true);
      setShowLogin(false);
    } else {
      setView(v);
    }
  }, []);

  const isActive = (tabView: string) => {
    if (tabView === "home") return view === "welcome";
    if (tabView === "find") return view === "tags" || view === "searching";
    if (tabView === "chat") return view === "match" || view === "chat";
    if (tabView === "settings") return showSettings;
    return false;
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHAT MODE — NO wrapper divs, NO overflow-hidden (this breaks sticky!)
  // ═══════════════════════════════════════════════════════════════════════════════
  if (isInChatMode) {
    return (
      <div className="fixed inset-0 z-50 bg-void">
        {view === "match" && (
          <MatchFound
            strangerName={strangerName}
            sharedTags={sharedTags}
            onChat={() => setView("chat")}
            onSkip={handleSkipFromMatch}
          />
        )}

        {view === "chat" && (
          <ChatRoom
            strangerName={strangerName}
            sharedTags={sharedTags}
            matchId={matchId}
            onReport={() => setShowReport(true)}
            onSkip={() => setShowSkip(true)}
            onBack={() => {
              wsService.disconnect();
              setView("welcome");
              setIsSearching(false);
            }}
          />
        )}

        {showReport && (
          <ReportModal
            onReport={handleReport}
            onClose={() => setShowReport(false)}
          />
        )}

        {showSkip && (
          <SkipModal onSkip={handleSkip} onClose={() => setShowSkip(false)} />
        )}

        {toast && (
          <Toast
            message={toast.msg}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NON-CHAT MODE — Normal website
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              wsService.disconnect();
              setView("welcome");
              setIsSearching(false);
            }}
          >
            <span className="text-2xl font-bold text-white tracking-tight">
              Fantasy<span className="text-purple-500">Hub</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {view === "welcome" || view === "tags" ? (
              <>
                <button
                  onClick={() => handleNavigate("login")}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNavigate("register")}
                  className="text-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors px-4 py-2 rounded-lg"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="hidden sm:inline">
                  {isSearching ? "Searching..." : "Connected"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[100dvh] pt-16 pb-24 bg-[#0a0a0a] text-white overflow-y-auto">
        {view === "welcome" && (
          <WelcomeHero
            onStart={() => setView("tags")}
            onNavigate={handleNavigate}
          />
        )}

        {view === "tags" && (
          <TagSelector
            onContinue={handleTagsSelected}
            onBack={() => setView("welcome")}
          />
        )}

        {view === "searching" && (
          <Searching
            selectedTags={selectedTags}
            onMatch={() => {}}
            onCancel={() => {
              wsService.disconnect();
              setView("tags");
              setIsSearching(false);
            }}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 w-full z-40 bg-[#0e0a14]/90 backdrop-blur-xl border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full px-4 py-2">
          <button
            onClick={() => {
              wsService.disconnect();
              setView("welcome");
              setIsSearching(false);
            }}
            className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-all duration-200 ${isActive("home") ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            {isActive("home") && (
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 border border-purple-500/30"></div>
            )}
            <span className="relative z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </span>
            <span
              className={`relative z-10 text-[10px] tracking-[0.08em] font-medium ${isActive("home") ? "text-purple-300" : ""}`}
            >
              Home
            </span>
          </button>

          <button
            onClick={() => {
              if (view !== "searching") setView("tags");
            }}
            className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-all duration-200 ${isActive("find") ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            {isActive("find") && (
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 border border-purple-500/30"></div>
            )}
            <span className="relative z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
              </svg>
            </span>
            <span
              className={`relative z-10 text-[10px] tracking-[0.08em] font-medium ${isActive("find") ? "text-purple-300" : ""}`}
            >
              Find
            </span>
          </button>

          <button
            disabled={!isActive("chat")}
            className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-all duration-200 ${isActive("chat") ? "text-white" : "text-neutral-700 cursor-not-allowed"}`}
          >
            {isActive("chat") && (
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 border border-purple-500/30"></div>
            )}
            <span className="relative z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>
              </svg>
            </span>
            <span
              className={`relative z-10 text-[10px] tracking-[0.08em] font-medium ${isActive("chat") ? "text-purple-300" : ""}`}
            >
              Chat
            </span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-all duration-200 ${isActive("settings") ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            {isActive("settings") && (
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 border border-purple-500/30"></div>
            )}
            <span className="relative z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
            <span
              className={`relative z-10 text-[10px] tracking-[0.08em] font-medium ${isActive("settings") ? "text-purple-300" : ""}`}
            >
              Settings
            </span>
          </button>
        </div>
      </nav>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
