interface MatchFoundProps {
  strangerName: string; // Add this
  sharedTags: string[];
  onChat: () => void;
  onSkip: () => void;
}

export default function MatchFound({
  strangerName, // Add this
  sharedTags,
  onChat,
  onSkip,
}: MatchFoundProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-s3 border-border flex items-center justify-center mx-auto mb-8 anim-up">
          <i data-lucide="user-check" className="w-7 h-7 text-lavender" />
        </div>

        <h2 className="text-xl font-bold mb-2 anim-up anim-d1">
          Someone&apos;s here.
        </h2>
        <p className="text-sm text-neutral-400 mb-6 anim-up anim-d1">
          You match with{" "}
          <span className="text-white font-medium">{strangerName}</span> on{" "}
          <span className="text-lavender">{sharedTags.length}</span> interests
        </p>

        <div className="flex flex-wrap gap-1.5 justify-center mb-10 anim-up anim-d2">
          {sharedTags.map((t) => (
            <span
              key={t}
              className="text-[11px] text-lavender bg-purple/10 border border-purple/20 px-2.5 py-1 rounded-md"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="flex gap-3 anim-up anim-d3">
          <button
            onClick={onChat}
            className="h-11 px-8 rounded-xl bg-white text-void font-semibold text-sm hover:bg-neutral-200 transition-colors"
          >
            Chat
          </button>
          <button
            onClick={onSkip}
            className="h-11 px-6 rounded-xl bg-s3 border-border text-neutral-400 text-sm font-medium hover:text-white hover:border-neutral-700 transition-all"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
