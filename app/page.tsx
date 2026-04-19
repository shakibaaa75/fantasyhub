"use client";

import { useState, useCallback } from "react";
import { View } from "@/lib/types";
import WelcomeHero from "@/app/components/welcome-hero";
import TagSelector from "@/app/components/tag-selector";
import Searching from "@/app/components/searching";
import MatchFound from "@/app/components/match-found";
import ChatRoom from "@/app/components/chat-room";
import ReportModal from "@/app/components/report-modal";
import SkipModal from "@/app/components/skip-modal";
import Toast from "@/app/components/toast";

export default function Home() {
  const [view, setView] = useState<View>("welcome");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "info" | "warn" | "success";
  } | null>(null);

  const notify = useCallback(
    (msg: string, type: "info" | "warn" | "success" = "info") => {
      setToast({ msg, type });
    },
    [],
  );

  const handleTagsSelected = useCallback((tags: string[]) => {
    setSelectedTags(tags);
    setView("searching");
  }, []);

  const handleMatchFound = useCallback(() => {
    const shared = selectedTags.slice(0, Math.min(3, selectedTags.length));
    setSharedTags(shared);
    setView("match");
  }, [selectedTags]);

  const handleSkipFromMatch = useCallback(() => {
    setView("searching");
  }, []);

  const handleReport = useCallback(() => {
    setShowReport(false);
    notify("reported — finding someone new");
    setTimeout(() => setView("searching"), 400);
  }, [notify]);

  const handleSkip = useCallback(() => {
    setShowSkip(false);
    notify("skipping...");
    setTimeout(() => setView("searching"), 400);
  }, [notify]);

  return (
    <main className="min-h-[100dvh]">
      {view === "welcome" && <WelcomeHero onStart={() => setView("tags")} />}
      {view === "tags" && <TagSelector onContinue={handleTagsSelected} />}
      {view === "searching" && (
        <Searching
          selectedTags={selectedTags}
          onMatch={handleMatchFound}
          onCancel={() => setView("tags")}
        />
      )}
      {view === "match" && (
        <MatchFound
          sharedTags={sharedTags}
          onChat={() => setView("chat")}
          onSkip={handleSkipFromMatch}
        />
      )}
      {view === "chat" && (
        <ChatRoom
          sharedTags={sharedTags}
          onReport={() => setShowReport(true)}
          onSkip={() => setShowSkip(true)}
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
    </main>
  );
}
