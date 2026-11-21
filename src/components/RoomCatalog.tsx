"use client";

import { useCallback, useEffect, useState } from "react";
import { hasContent, type Room, type RoomView } from "@/lib/rooms";
import { PhotoLightbox } from "./PhotoLightbox";

type Viewing = { room: Room; index: number };

export function RoomCatalog() {
  const [rooms, setRooms] = useState<RoomView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Room | null>(null);
  const [viewing, setViewing] = useState<Viewing | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/rooms", { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load the catalog.");
        const data = (await res.json()) as { rooms: RoomView[] };
        if (!cancelled) setRooms(data.rooms.filter(hasContent));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the catalog.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const closeViewer = useCallback(() => setViewing(null), []);
  const navigateViewer = useCallback(
    (index: number) => setViewing((v) => (v ? { ...v, index } : v)),
    [],
  );

  const visible = filter ? rooms.filter((r) => r.room === filter) : rooms;
  const viewingRoom = viewing ? rooms.find((r) => r.room === viewing.room) : undefined;

  return (
    <>
      <section className="section site-shell" id="catalog" aria-labelledby="catalog-heading">
        <div className="section-head">
          <h2 className="section-title" id="catalog-heading">
            Rooms
          </h2>
        </div>

        {loading ? <p className="status-text">Loading…</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!loading && !error && rooms.length === 0 ? (
          <div className="empty-state">
            <p>Nothing posted yet. Check back soon.</p>
          </div>
        ) : null}

        {rooms.length > 1 ? (
          <div className="room-filter" role="group" aria-label="Filter by room">
            <button
              type="button"
              className="room-chip"
              aria-pressed={filter === null}
              onClick={() => setFilter(null)}
            >
              All rooms
            </button>
            {rooms.map((r) => (
              <button
                key={r.room}
                type="button"
                className="room-chip"
                aria-pressed={filter === r.room}
                onClick={() => setFilter(r.room)}
              >
                {r.room}
              </button>
            ))}
          </div>
        ) : null}

        <div className="room-list">
          {visible.map((r) => (
            <article
              key={r.room}
              className="room-section"
              aria-labelledby={`room-${r.room.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <h3 className="room-name" id={`room-${r.room.toLowerCase().replace(/\s+/g, "-")}`}>
                {r.room}
              </h3>
              {r.description ? <p className="room-description">{r.description}</p> : null}
              {r.photos.length > 0 ? (
                <div className="photo-grid">
                  {r.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      className="photo-tile"
                      onClick={() => setViewing({ room: r.room, index })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={`${r.room}, photo ${index + 1}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {viewing && viewingRoom ? (
        <PhotoLightbox
          room={viewingRoom}
          index={viewing.index}
          onNavigate={navigateViewer}
          onClose={closeViewer}
        />
      ) : null}
    </>
  );
}
