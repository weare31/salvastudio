import React from "react";

interface ViewerControlsProps {
  counterLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
}

export function ViewerControls({ counterLabel, onPrev, onNext, onFullscreen }: ViewerControlsProps) {
  return (
    <div className="viewer-controls">
      <button className="viewer-controls__btn" onClick={onPrev} aria-label="Önceki sayfa">
        ‹
      </button>
      <span className="viewer-controls__counter">{counterLabel}</span>
      <button className="viewer-controls__btn" onClick={onNext} aria-label="Sonraki sayfa">
        ›
      </button>
      <button className="viewer-controls__btn viewer-controls__fullscreen" onClick={onFullscreen} aria-label="Tam ekran">
        ⤢
      </button>
    </div>
  );
}
