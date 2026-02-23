import { SearchResult } from "@/types/planner";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSelectResult: (result: SearchResult) => void;
}

export function SearchDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  searchResults,
  isSearching,
  onSelectResult,
}: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Veranstaltungen durchsuchen
          </DialogTitle>
          <DialogDescription>
            Suche nach Name, STiNE-ID, Lehrenden oder Typ (mind. 2 Zeichen)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center border rounded-md px-3">
            <Search className="h-4 w-4 mr-2 shrink-0 opacity-50" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="z.B. Algorithmen, 64-001, Germer..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </div>

          <ScrollArea className="">
            <Command>
              <CommandList>
                {search.trim().length > 0 && search.trim().length < 2 && (
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    Noch {2 - search.trim().length} Zeichen eingeben...
                  </CommandEmpty>
                )}

                {search.trim().length >= 2 &&
                  searchResults.length === 0 &&
                  !isSearching && (
                    <CommandEmpty className="py-6 text-center text-sm">
                      Keine Veranstaltungen gefunden
                    </CommandEmpty>
                  )}

                {isSearching && (
                  <CommandEmpty className="py-6 text-center text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Suche läuft...
                  </CommandEmpty>
                )}

                {searchResults.length > 0 && (
                  <CommandGroup
                    heading={`${searchResults.length} Ergebnis${searchResults.length !== 1 ? "se" : ""}`}>
                    {searchResults.map((ev) => (
                      <CommandItem
                        key={ev.veranstaltung.id + "-" + ev.veranstaltung.name}
                        onSelect={() => onSelectResult(ev)}
                        onClick={() => onSelectResult(ev)}
                        className="flex flex-col items-start py-3 cursor-pointer">
                        <div className="font-semibold text-sm mb-1">
                          {ev.veranstaltung.name}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary" className="text-xs">
                            {ev.veranstaltung.typ}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ev.veranstaltung.stineId}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 italic line-clamp-1 w-full">
                          {ev.veranstaltung.lehrende}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
