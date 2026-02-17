import { useState, useEffect, useCallback } from "react";
import { SearchResult } from "@/types/planner";

export function useSearch() {
  const [search, setSearch] = useState("");
  const [searchedEvents, setSearchedEvents] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchEvent = useCallback(async (searchTerm: string) => {
    const searchParam = searchTerm.trim().toLowerCase();
    if (searchParam === "") {
      setSearchedEvents([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        "/api/search?search=" + encodeURIComponent(searchParam),
      );
      const result = await response.json();
      setSearchedEvents(result);
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
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      searchEvent(search);
    }, 500); // 500ms Debounce

    return () => clearTimeout(timeoutId);
  }, [search, searchEvent]);

  const clearSearch = useCallback(() => {
    setSearch("");
    setSearchedEvents([]);
    setIsSearching(false);
  }, []);

  return {
    search,
    setSearch,
    searchedEvents,
    isSearching,
    clearSearch,
  };
}
