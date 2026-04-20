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
  const [toast, setToast] = useState<{
    msg: string;
    type: "info" | "warn" | "success";
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const notify = useCallback(
    (msg: string, type: "info" | "warn" | "success" = "info") => {
      setToast({ msg, type });
    },
    [],
  );

  // Use refs to store handler references for proper cleanup
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

    const handleSearching = () => {
      console.log("Still searching...");
    };

    const handleError = (data: any) => {
      console.error("WebSocket error:", data);
      notify(data.message || "Connection error", "warn");
      setView("tags");
      setIsSearching(false);
    };

    const handleSkipped = () => {
      console.log("Skipped, searching for new match");
    };

    // Store references for cleanup
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
      // Properly remove the exact same handler references
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
    wsService.send({
      type: "report",
      data: { reason: "reported by user" },
    });
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

  return (
    <main className="min-h-[100dvh]">
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
        />
      )}

      {/* Auth Modals */}
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
    </main>
  );
}
