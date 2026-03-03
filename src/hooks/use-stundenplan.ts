import { useState, useEffect, useCallback } from "react";
import { Event } from "@/types/planner";

export type Stundenplan = {
  id: string;
  name: string;
  semesterId: number;
  events: Event[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "stineultras-stundenplaene";

export function useStundenplan() {
  const [stundenplaene, setStundenplaene] = useState<Stundenplan[]>([]);
  const [currentStundenplanId, setCurrentStundenplanId] = useState<
    string | null
  >(null);
  const [currentStundenplan, setCurrentStundenplan] =
    useState<Stundenplan | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Lade Stundenpläne aus LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStundenplaene(parsed);

        // Lade letzten aktiven Stundenplan
        const lastActiveId = localStorage.getItem(
          "stineultras-active-stundenplan",
        );
        if (lastActiveId) {
          const found = parsed.find(
            (sp: Stundenplan) => sp.id === lastActiveId,
          );
          if (found) {
            setCurrentStundenplanId(lastActiveId);
            setCurrentStundenplan(found);
          }
        }
      } catch (error) {
        console.error("Fehler beim Laden der Stundenpläne:", error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Speichere Stundenpläne in LocalStorage
  const saveToStorage = useCallback((plaene: Stundenplan[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plaene));
    setStundenplaene(plaene);
  }, []);

  // Erstelle neuen Stundenplan
  const createStundenplan = useCallback(
    (name: string, semesterId: number) => {
      // Eindeutigen Namen sicherstellen (Duplikat-Handling)
      let uniqueName = name;
      let counter = 2;
      while (stundenplaene.some((sp) => sp.name === uniqueName)) {
        uniqueName = `${name} (${counter++})`;
      }

      const newPlan: Stundenplan = {
        id: crypto.randomUUID(),
        name: uniqueName,
        semesterId,
        events: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [...stundenplaene, newPlan];
      saveToStorage(updated);
      setCurrentStundenplanId(newPlan.id);
      setCurrentStundenplan(newPlan);
      localStorage.setItem("stineultras-active-stundenplan", newPlan.id);

      return newPlan;
    },
    [stundenplaene, saveToStorage],
  );

  // Lade Stundenplan
  const loadStundenplan = useCallback(
    (id: string) => {
      const found = stundenplaene.find((sp) => sp.id === id);
      if (found) {
        setCurrentStundenplanId(id);
        setCurrentStundenplan(found);
        localStorage.setItem("stineultras-active-stundenplan", id);
        return found;
      }
      return null;
    },
    [stundenplaene],
  );

  // Speichere aktuellen Stundenplan
  const saveCurrentStundenplan = useCallback(
    (events: Event[]) => {
      if (!currentStundenplan) return;

      const updated = {
        ...currentStundenplan,
        events,
        updatedAt: new Date().toISOString(),
      };

      const newPlaene = stundenplaene.map((sp) =>
        sp.id === currentStundenplan.id ? updated : sp,
      );

      saveToStorage(newPlaene);
      // Nicht setCurrentStundenplan aufrufen, da das einen Re-Render triggert
      // Der State wird beim nächsten Laden aktualisiert
    },
    [currentStundenplan, stundenplaene, saveToStorage],
  );

  // Lösche Stundenplan
  const deleteStundenplan = useCallback(
    (id: string) => {
      const filtered = stundenplaene.filter((sp) => sp.id !== id);
      saveToStorage(filtered);

      if (currentStundenplanId === id) {
        const next = filtered[0] ?? null;
        if (next) {
          setCurrentStundenplanId(next.id);
          setCurrentStundenplan(next);
          localStorage.setItem("stineultras-active-stundenplan", next.id);
        } else {
          setCurrentStundenplanId(null);
          setCurrentStundenplan(null);
          localStorage.removeItem("stineultras-active-stundenplan");
        }
      }
    },
    [stundenplaene, currentStundenplanId, saveToStorage],
  );

  // Benenne Stundenplan um
  const renameStundenplan = useCallback(
    (id: string, newName: string) => {
      const updated = stundenplaene.map((sp) =>
        sp.id === id
          ? { ...sp, name: newName, updatedAt: new Date().toISOString() }
          : sp,
      );
      saveToStorage(updated);

      if (currentStundenplan?.id === id) {
        setCurrentStundenplan({ ...currentStundenplan, name: newName });
      }
    },
    [stundenplaene, currentStundenplan, saveToStorage],
  );

  return {
    stundenplaene,
    currentStundenplan,
    currentStundenplanId,
    isInitialized,
    createStundenplan,
    loadStundenplan,
    saveCurrentStundenplan,
    deleteStundenplan,
    renameStundenplan,
  };
}
