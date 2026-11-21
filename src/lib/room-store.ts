import { randomUUID } from "crypto";
import { BlobPreconditionFailedError, del, get, head, put } from "@vercel/blob";
import { ROOMS, isRoom, type Room, type RoomView } from "./rooms";

type StoredPhoto = {
  id: string;
  url: string;
  createdAt: string;
};

type StoredRoom = {
  description: string;
  photos: StoredPhoto[];
};

type Store = Partial<Record<Room, StoredRoom>>;

const STORE_PATH = "rooms.json";
export const PHOTO_PREFIX = "photos/";
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class ValidationError extends Error {}

// Writes must read with `fresh` so they never build on a CDN-cached copy.
async function readStore(fresh: boolean): Promise<{ store: Store; etag?: string }> {
  const result = await get(STORE_PATH, { access: "public", useCache: !fresh });
  if (!result || result.statusCode !== 200) return { store: {} };
  return {
    store: (await new Response(result.stream).json()) as Store,
    // get() reports a weak ETag (W/"…"), but conditional writes need the strong form.
    etag: result.blob.etag.replace(/^W\//, ""),
  };
}

const WRITE_ATTEMPTS = 5;

// Right after a write, a fresh read can still briefly return the previous
// version, so a failed conditional write is retried against a re-read store.
async function mutateStore<T>(apply: (store: Store) => T): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const { store, etag } = await readStore(true);
    const result = apply(store);
    try {
      await put(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : {}),
      });
      return result;
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError)) throw error;
      if (attempt === WRITE_ATTEMPTS) {
        throw new ValidationError("Could not save right now. Please try again.");
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
}

function toView(room: Room, stored: StoredRoom | undefined): RoomView {
  return {
    room,
    description: stored?.description ?? "",
    photos: (stored?.photos ?? []).map((photo) => ({ id: photo.id, url: photo.url })),
  };
}

export function parseRoom(value: string): Room {
  if (!isRoom(value)) throw new ValidationError("Unknown room.");
  return value;
}

export async function listRooms({ fresh = false } = {}): Promise<RoomView[]> {
  const { store } = await readStore(fresh);
  return ROOMS.map((room) => toView(room, store[room]));
}

async function verifyUploadedPhoto(imageUrl: string) {
  try {
    const blob = await head(imageUrl);
    if (blob.pathname.startsWith(PHOTO_PREFIX) && PHOTO_CONTENT_TYPES.includes(blob.contentType)) {
      return blob.url;
    }
  } catch {}
  throw new ValidationError("Uploaded photo could not be found.");
}

type RoomUpdate = {
  description?: string;
  imageUrl?: string;
};

export async function updateRoom(room: Room, update: RoomUpdate): Promise<RoomView> {
  const imageUrl = update.imageUrl ? await verifyUploadedPhoto(update.imageUrl) : undefined;

  const photo = imageUrl
    ? { id: randomUUID(), url: imageUrl, createdAt: new Date().toISOString() }
    : undefined;

  try {
    return await mutateStore((store) => {
      const entry: StoredRoom = store[room] ?? { description: "", photos: [] };
      if (update.description !== undefined) {
        entry.description = update.description.replace(/\r\n?/g, "\n").trim();
      }
      if (photo) entry.photos.push(photo);
      store[room] = entry;
      return toView(room, entry);
    });
  } catch (error) {
    if (imageUrl) await del(imageUrl).catch(() => {});
    throw error;
  }
}

export async function deletePhoto(room: Room, photoId: string): Promise<RoomView> {
  let removedUrl = "";
  const view = await mutateStore((store) => {
    const entry = store[room];
    const photo = entry?.photos.find((p) => p.id === photoId);
    if (!entry || !photo) {
      throw new ValidationError("Photo not found.");
    }
    entry.photos = entry.photos.filter((p) => p.id !== photoId);
    removedUrl = photo.url;
    return toView(room, entry);
  });
  await del(removedUrl);
  return view;
}
