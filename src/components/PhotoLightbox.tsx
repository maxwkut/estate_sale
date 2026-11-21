"use client";

import { useEffect } from "react";
import type { RoomView } from "@/lib/rooms";

type PhotoLightboxProps = {
  room: RoomView;
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
};

export function PhotoLightbox({ room, index, onNavigate, onClose }: PhotoLightboxProps) {
  const count = room.photos.length;
  const photo = room.photos[index];
  const prev = () => onNavigate((index - 1 + count) % count);
  const next = () => onNavigate((index + 1) % count);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (count > 1 && event.key === "ArrowLeft") onNavigate((index - 1 + count) % count);
      if (count > 1 && event.key === "ArrowRight") onNavigate((index + 1) % count);
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, index, onClose, onNavigate]);

  if (!photo) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${room.room} photos`}
      onClick={onClose}
    >
      <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={`${room.room}, photo ${index + 1} of ${count}`} />
        <figcaption className="lightbox-caption">
          <span>{room.room}</span>
          <span>
            {index + 1} / {count}
          </span>
        </figcaption>
      </figure>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            aria-label="Previous photo"
            onClick={(event) => {
              event.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            aria-label="Next photo"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
          >
            ›
          </button>
        </>
      ) : null}

      <button type="button" className="lightbox-close" aria-label="Close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
