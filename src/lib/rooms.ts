export const ROOMS = [
  "Outside",
  "Garage",
  "Kitchen",
  "Dining room",
  "Living room",
  "Bedroom 1",
  "Bedroom 2",
  "Office",
  "Bathroom",
  "Other",
] as const;

export type Room = (typeof ROOMS)[number];

export function isRoom(value: string): value is Room {
  return (ROOMS as readonly string[]).includes(value);
}

export type RoomPhotoView = {
  id: string;
  url: string;
};

export type RoomView = {
  room: Room;
  description: string;
  photos: RoomPhotoView[];
};

export function hasContent(view: RoomView) {
  return view.photos.length > 0 || view.description.trim().length > 0;
}
