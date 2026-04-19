export default function SkipModal({
  onSkip,
  onClose,
}: {
  onSkip: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-s2 border-brd rounded-2xl p-6 w-full max-w-xs text-center animate-up"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold mb-1">Skip this chat?</p>
        <p className="text-xs text-neutral-500 mb-5">
          You&apos;ll match with someone new
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-s3 border-brd text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Stay
          </button>
          <button
            onClick={onSkip}
            className="flex-1 h-10 rounded-lg bg-white text-void text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
