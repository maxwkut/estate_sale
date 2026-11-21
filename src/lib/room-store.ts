import { randomUUID } from "crypto";
import { del, get, head, list, put } from "@vercel/blob";
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

// An overwritten blob can keep serving its old contents (or a 404) for a while,
// so every save writes a new, never-overwritten version under VERSIONS_PREFIX and
// edits always build on the newest one. SNAPSHOT_PATH is overwritten on each save
// for the public catalog, which can tolerate a short delay. Listing versions
// counts against the Hobby plan's 2,000 monthly advanced operations, so public
// page views must only read the snapshot.
const VERSIONS_PREFIX = "rooms/";
const SNAPSHOT_PATH = "rooms.json";
const KEEP_VERSIONS = 20;

export const PHOTO_PREFIX = "photos/";
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class ValidationError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// list() returns pathnames in ascending order, so a reversed timestamp puts the
// newest version first.
function newVersionPath() {
  const reversed = String(Number.MAX_SAFE_INTEGER - Date.now()).padStart(16, "0");
  return `${VERSIONS_PREFIX}${reversed}-${randomUUID()}.json`;
}

async function readJson(urlOrPathname: string): Promise<Store | null> {
  const result = await get(urlOrPathname, { access: "public" });
  if (!result || result.statusCode !== 200) return null;
  return (await new Response(result.stream).json()) as Store;
}

async function readLatest() {
  const { blobs } = await list({ prefix: VERSIONS_PREFIX, limit: KEEP_VERSIONS + 5 });
  if (blobs.length === 0) return { store: {} as Store, versions: blobs };
  for (let attempt = 1; attempt <= 5; attempt++) {
    const store = await readJson(blobs[0].url);
    if (store) return { store, versions: blobs };
    await sleep(300 * attempt);
  }
  throw new Error("Could not load the latest room data.");
}

async function mutateStore<T>(apply: (store: Store) => T): Promise<T> {
  const { store, versions } = await readLatest();
  const result = apply(store);
  const body = `${JSON.stringify(store, null, 2)}\n`;

  await put(newVersionPath(), body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  await put(SNAPSHOT_PATH, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });

  const stale = versions.slice(KEEP_VERSIONS - 1).map((blob) => blob.url);
  if (stale.length > 0) await del(stale).catch(() => {});
  return result;
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
  const store = fresh
    ? (await readLatest()).store
    : ((await readJson(SNAPSHOT_PATH)) ?? (await readLatest()).store);
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
