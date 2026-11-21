// One-time copy of the local catalog (data/rooms.json + data/uploads) into Vercel Blob.
// Usage: node --env-file=.env.local scripts/migrate-to-blob.mjs
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { put } from "@vercel/blob";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is missing. Run `npx vercel env pull .env.local` first.");
  process.exit(1);
}

const local = JSON.parse(await readFile(path.join(DATA_DIR, "rooms.json"), "utf8"));
const tmp = await mkdtemp(path.join(tmpdir(), "estate-sale-"));
const migrated = {};

for (const [room, entry] of Object.entries(local)) {
  const photos = [];
  for (const photo of entry.photos) {
    const source = path.join(DATA_DIR, "uploads", photo.imagePath);
    const ext = path.extname(photo.imagePath).toLowerCase();
    let file = source;
    let contentType = CONTENT_TYPES[ext];

    if (ext !== ".gif") {
      file = path.join(tmp, `${photo.id}.jpg`);
      execFileSync("sips", ["-Z", "2048", "-s", "format", "jpeg", "-s", "formatOptions", "85", source, "--out", file], { stdio: "ignore" });
      contentType = "image/jpeg";
    }

    const blob = await put(`photos/${path.basename(file)}`, await readFile(file), {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    photos.push({ id: photo.id, url: blob.url, createdAt: photo.createdAt });
    console.log(`${room}: uploaded ${photo.imagePath}`);
  }
  migrated[room] = { description: entry.description, photos };
}

await put("rooms.json", `${JSON.stringify(migrated, null, 2)}\n`, {
  access: "public",
  contentType: "application/json",
  addRandomSuffix: false,
  allowOverwrite: true,
  cacheControlMaxAge: 60,
});
await rm(tmp, { recursive: true, force: true });
console.log("Done. rooms.json written to Blob.");
