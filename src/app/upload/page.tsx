import { RoomManager } from "@/components/RoomManager";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Edit rooms · Estate Sale",
  description: "Add photos and descriptions for each room.",
};

export default function UploadPage() {
  return (
    <>
      <SiteHeader active="upload" />
      <main className="upload-page site-shell">
        <div className="upload-card">
          <h1>Edit rooms</h1>
          <p>Pick a room, describe the main things in it, and add a few photos.</p>
          <RoomManager />
        </div>
      </main>
    </>
  );
}
