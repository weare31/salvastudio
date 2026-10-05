import React from "react";

interface OrientationPromptProps {
  onContinuePortrait: () => void;
}

export function OrientationPrompt({ onContinuePortrait }: OrientationPromptProps) {
  return (
    <div className="orientation-prompt">
      <div className="orientation-prompt__icon" aria-hidden="true">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <rect x="16" y="4" width="20" height="34" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M40 30c0 8-6.5 14.5-14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 27l3.5 3.5-3.8 2.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="orientation-prompt__title">En iyi deneyim için telefonunuzu çevirin</h1>
      <p className="orientation-prompt__desc">
        Kataloğu çift sayfa görüntülemek için cihazınızı yatay konuma getirin.
      </p>
      <button className="orientation-prompt__secondary" onClick={onContinuePortrait}>
        Dikey devam et
      </button>
    </div>
  );
}
