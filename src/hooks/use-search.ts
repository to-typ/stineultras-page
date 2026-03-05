import { useState, useEffect, useCallback } from "react";
import { SearchResult, ModulResult } from "@/types/planner";

export function useSearch(semesterId?: number | null) {
  const [search, setSearch] = useState("");
  const [searchedEvents, setSearchedEvents] = useState<SearchResult[]>([]);
  const [searchedModuls, setSearchedModuls] = useState<ModulResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchEvent = useCallback(async (searchTerm: string, semester?: number | null) => {
    const searchParam = searchTerm.trim().toLowerCase();
    if (searchParam === "") {
      setSearchedEvents([]);
      return;
    }

    setIsSearching(true);
    try {
      let url = "/api/search?search=" + encodeURIComponent(searchParam);
      if (semester) {
        url += "&semesterId=" + semester;
      }
      const response = await fetch(url);
      const result = await response.json();
      setSearchedEvents(result);
    } catch (error) {
      console.error("Suche fehlgeschlagen:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchModul = useCallback(async (searchTerm: string, semester?: number | null) => {
    const searchParam = searchTerm.trim().toLowerCase();
    if (searchParam === "") {
      setSearchedModuls([]);
      return;
    }

    setIsSearching(true);
    try {
      let url = "/api/moduls?search=" + encodeURIComponent(searchParam);
      if (semester) {
        url += "&semesterId=" + semester;
      }
      const response = await fetch(url);
      const result = await response.json();
      setSearchedModuls(result);
    } catch (error) {
      console.error("Suche fehlgeschlagen:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce Effekt für die Suche (nur ab 2 Zeichen)
  useEffect(() => {
    const trimmedSearch = search.trim();

    if (trimmedSearch.length < 2) {
      setSearchedEvents([]);
      setSearchedModuls([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      searchEvent(search, semesterId);
      searchModul(search, semesterId);
    }, 1000); // 1000ms Debounce

    return () => clearTimeout(timeoutId);
  }, [search, semesterId, searchEvent, searchModul]);

  const clearSearch = useCallback(() => {
    setSearch("");
    setSearchedEvents([]);
    setSearchedModuls([]);
    setIsSearching(false);
  }, []);

  return {
    search,
    setSearch,
    searchedEvents,
    searchedModuls,
    isSearching,
    clearSearch,
  };
}
