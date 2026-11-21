"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { ROOMS, type Room, type RoomView } from "@/lib/rooms";
import { shrinkPhoto } from "@/lib/shrink-photo";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type Draft = {
  key: string;
  file: File;
  previewUrl: string;
  status: "idle" | "uploading" | "error";
  error?: string;
};

function roomEndpoint(room: Room) {
  return `/api/rooms/${encodeURIComponent(room)}`;
}

export function RoomManager() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [rooms, setRooms] = useState<RoomView[]>([]);
  const [room, setRoom] = useState<Room | "">("");
  const [description, setDescription] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const nextKey = useRef(0);
  const draftsRef = useRef<Draft[]>([]);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    return () => {
      for (const draft of draftsRef.current) URL.revokeObjectURL(draft.previewUrl);
    };
  }, []);

  const current = rooms.find((r) => r.room === room);
  const descriptionChanged = current !== undefined && description !== current.description;
  const dirty = descriptionChanged || drafts.length > 0;

  function applyRoom(view: RoomView) {
    setRooms((all) => all.map((r) => (r.room === view.room ? view : r)));
  }

  function clearDrafts() {
    for (const draft of drafts) URL.revokeObjectURL(draft.previewUrl);
    setDrafts([]);
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const auth = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!auth.ok) {
        const data = (await auth.json()) as { error?: string };
        throw new Error(data.error || "Could not verify password.");
      }

      const res = await fetch("/api/rooms?fresh", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load rooms.");
      const data = (await res.json()) as { rooms: RoomView[] };
      setRooms(data.rooms);
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify password.");
    } finally {
      setBusy(false);
    }
  }

  function selectRoom(next: Room) {
    if (dirty && !window.confirm(`Discard unsaved changes to ${room}?`)) return;
    clearDrafts();
    setRoom(next);
    setDescription(rooms.find((r) => r.room === next)?.description ?? "");
    setError(null);
    setSuccess(null);
  }

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setSuccess(null);
    setDrafts((existing) => [
      ...existing,
      ...files.map((file) => ({
        key: String(nextKey.current++),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "idle" as const,
      })),
    ]);
  }

  function removeDraft(key: string) {
    setDrafts((existing) => {
      const draft = existing.find((d) => d.key === key);
      if (draft) URL.revokeObjectURL(draft.previewUrl);
      return existing.filter((d) => d.key !== key);
    });
  }

  async function deleteSaved(photoId: string, index: number) {
    if (!room || !window.confirm(`Delete photo ${index + 1} from ${room}?`)) return;
    setError(null);
    setSuccess(null);
    setBusy(true);

    try {
      const res = await fetch(`${roomEndpoint(room)}/photos/${photoId}`, {
        method: "DELETE",
        headers: { "x-upload-password": password },
      });
      const data = (await res.json()) as { room?: RoomView; error?: string };
      if (!res.ok || !data.room) throw new Error(data.error || "Could not delete photo.");
      applyRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete photo.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    const photo = await shrinkPhoto(file);
    const type = EXT_BY_TYPE[photo.type] ? photo.type : file.type;
    if (!EXT_BY_TYPE[type]) {
      throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed.");
    }
    if (photo.size > 20 * 1024 * 1024) {
      throw new Error("Each photo must be 20 MB or smaller.");
    }

    const blob = await upload(`photos/photo.${EXT_BY_TYPE[type]}`, photo, {
      access: "public",
      contentType: type,
      handleUploadUrl: "/api/upload",
      headers: { "x-upload-password": password },
    });
    return blob.url;
  }

  async function postToRoom(target: Room, fields: Record<string, string>) {
    const form = new FormData();
    form.set("password", password);
    for (const [key, value] of Object.entries(fields)) form.set(key, value);

    const res = await fetch(roomEndpoint(target), { method: "POST", body: form });
    const data = (await res.json()) as { room?: RoomView; error?: string };
    if (!res.ok || !data.room) throw new Error(data.error || "Save failed.");
    applyRoom(data.room);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!room) return;
    setError(null);
    setSuccess(null);
    setBusy(true);

    let savedDescription = false;
    let added = 0;
    let failed = 0;

    if (descriptionChanged) {
      try {
        await postToRoom(room, { description });
        setDescription(description.trim());
        savedDescription = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save description.");
        setBusy(false);
        return;
      }
    }

    for (const draft of drafts) {
      setDrafts((existing) =>
        existing.map((d) => (d.key === draft.key ? { ...d, status: "uploading", error: undefined } : d)),
      );
      try {
        await postToRoom(room, { imageUrl: await uploadPhoto(draft.file) });
        added++;
        removeDraft(draft.key);
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : "Upload failed.";
        setDrafts((existing) =>
          existing.map((d) => (d.key === draft.key ? { ...d, status: "error", error: message } : d)),
        );
      }
    }

    const parts = [];
    if (savedDescription) parts.push("description saved");
    if (added > 0) parts.push(`${added} ${added === 1 ? "photo" : "photos"} added`);
    if (parts.length > 0) {
      const summary = parts.join(", ");
      setSuccess(`${room}: ${summary.charAt(0).toUpperCase()}${summary.slice(1)}.`);
    }
    if (failed > 0) {
      setError(`${failed} ${failed === 1 ? "photo" : "photos"} couldn't be uploaded. See below.`);
    }
    setBusy(false);
  }

  if (!unlocked) {
    return (
      <form key="unlock" className="form-stack" onSubmit={unlock}>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <form key="manage" className="form-stack" onSubmit={onSave}>
      <div className="field">
        <label htmlFor="room">Room</label>
        <select
          id="room"
          value={room}
          onChange={(e) => selectRoom(e.target.value as Room)}
          disabled={busy}
          required
        >
          <option value="" disabled>
            Choose a room
          </option>
          {ROOMS.map((r) => {
            const view = rooms.find((v) => v.room === r);
            const count = view?.photos.length ?? 0;
            return (
              <option key={r} value={r}>
                {count > 0 ? `${r} (${count} ${count === 1 ? "photo" : "photos"})` : r}
              </option>
            );
          })}
        </select>
      </div>

      {current ? (
        <>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mid-century dining table with six chairs, a china cabinet full of dishes, framed art…"
              disabled={busy}
            />
          </div>

          {current.photos.length > 0 ? (
            <div className="field">
              <span className="field-label">Photos on the site</span>
              <ul className="thumb-grid">
                {current.photos.map((photo, index) => (
                  <li key={photo.id} className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`${current.room}, photo ${index + 1}`} />
                    <button
                      type="button"
                      className="thumb-remove"
                      onClick={() => deleteSaved(photo.id, index)}
                      disabled={busy}
                      aria-label={`Delete photo ${index + 1}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="images">Add photos</label>
            <input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={addFiles}
              disabled={busy}
            />
          </div>

          {drafts.length > 0 ? (
            <ul className="thumb-grid" aria-label="Photos to add">
              {drafts.map((draft, index) => (
                <li key={draft.key} className="thumb" data-status={draft.status}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.previewUrl} alt={`New photo ${index + 1} preview`} />
                  {draft.status === "uploading" ? (
                    <span className="thumb-badge">Uploading…</span>
                  ) : null}
                  {draft.error ? <span className="thumb-badge thumb-badge-error">{draft.error}</span> : null}
                  <button
                    type="button"
                    className="thumb-remove"
                    onClick={() => removeDraft(draft.key)}
                    disabled={busy}
                    aria-label={`Remove new photo ${index + 1}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}
          {success ? (
            <p className="form-success">
              {success} <Link href="/">View catalog</Link>
            </p>
          ) : null}

          <button className="btn btn-primary" type="submit" disabled={busy || !dirty}>
            {busy ? "Saving…" : `Save ${current.room}`}
          </button>
        </>
      ) : null}
    </form>
  );
}
