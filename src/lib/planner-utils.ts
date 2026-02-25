import { Termin } from "@prisma/client";

export const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
export const LOCAL_STORAGE_KEY = "planer-events";

export const COLORS = [
  "#4a148c", // dark purple
  "#6a1b9a", // purple
  "#7b1fa2", // medium purple
  "#8e24aa", // light purple
  "#b71c1c", // dark red
  "#d32f2f", // red
  "#e53935", // light red
  "#e64a19", // dark orange
  "#f57c00", // orange
  "#ff9800", // amber
  "#ffa726", // light orange
  "#ffb74d", // lighter orange
  "#ffc107", // yellow orange
  "#ffd54f", // light yellow
  "#ffe082", // lighter yellow
  "#ffecb3", // very light yellow
];

/**
 * Extrahiert Tag, Zeitintervall und Raum aus Terminen
 */
export function getInterval(termine: Termin[]) {
  const tagDate = new Date(termine[0].tag);
  const startDate = new Date(termine[0].startZeit);
  const endDate = new Date(termine[0].endZeit);
  const raum = termine[0].raum;

  // Debug logging
  console.log("getInterval input:", {
    startZeit: termine[0].startZeit,
    endZeit: termine[0].endZeit,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const tag = days[tagDate.getDay()];

  // Verwende UTC-Stunden und -Minuten, um Timezone-Probleme zu vermeiden
  function toTimeString(date: Date) {
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  const start = toTimeString(startDate);
  const end = toTimeString(endDate);

  console.log("getInterval output:", { tag, start, end, room: raum });

  return { tag, start, end, room: raum };
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
