import { v4 as uuidv4 } from "uuid";

export function generateBookingReference(): string {
  // Generate a unique booking reference in format: BK-XXXXXX
  const uuid = uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
  return `BK-${uuid}`;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const timeFormats: { [key: string]: string } = {
    "09:00": "9:00 AM - 10:00 AM",
    "10:00": "10:00 AM - 11:00 AM",
    "11:00": "11:00 AM - 12:00 PM",
    "12:00": "12:00 PM - 1:00 PM",
    "14:00": "2:00 PM - 3:00 PM",
    "15:00": "3:00 PM - 4:00 PM",
    "16:00": "4:00 PM - 5:00 PM",
    "17:00": "5:00 PM - 6:00 PM",
    "18:00": "6:00 PM - 7:00 PM",
  };
  return timeFormats[time] || time;
}
