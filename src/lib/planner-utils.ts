import { Termin } from "@prisma/client";

export const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
export const LOCAL_STORAGE_KEY = "planer-events";

export const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

/**
 * Extrahiert Tag und Zeitintervall aus Terminen
 */
export function getInterval(termine: Termin[]) {
  const tagDate = new Date(termine[0].tag);
  const startDate = new Date(termine[0].startZeit);
  const endDate = new Date(termine[0].endZeit);

  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const tag = days[tagDate.getDay()];

  function toTimeString(date: Date) {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  const start = toTimeString(startDate);
  const end = toTimeString(endDate);

  return { tag, start, end };
}

/**
 * Berechnet eine kontrastreiche Textfarbe basierend auf der Hintergrundfarbe
 */
export function getContrastColor(hexColor: string) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance > 0.5) {
    const darkR = Math.round(r * 0.7);
    const darkG = Math.round(g * 0.7);
    const darkB = Math.round(b * 0.7);
    return `#${darkR.toString(16).padStart(2, "0")}${darkG.toString(16).padStart(2, "0")}${darkB.toString(16).padStart(2, "0")}`;
  } else {
    const lightR = Math.min(255, Math.round(r * 2.5));
    const lightG = Math.min(255, Math.round(g * 2.5));
    const lightB = Math.min(255, Math.round(b * 2.5));
    return `#${lightR.toString(16).padStart(2, "0")}${lightG.toString(16).padStart(2, "0")}${lightB.toString(16).padStart(2, "0")}`;
  }
}

/**
 * Generiert eine zufällige Farbe aus der vordefinierten Palette
 */
export function generateRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
