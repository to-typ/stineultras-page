import { ModulResult, SearchResult } from "@/types/planner";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const stringSimilarity = require("string-similarity");

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
  searchResults: SearchResult[];
  modulResults: ModulResult[];
  isSearching: boolean;
  onSelectResult: (result: SearchResult) => void;
  onSelectModulResult: (modul: ModulResult) => void;
  onSelectModuleByID: (moduleId: number) => void;
}

const ModulItem = ({
  modul,
  onSelectModulResult,
  onSelectResult,
}: {
  modul: ModulResult;
  onSelectModulResult: (modul: ModulResult) => void;
  onSelectResult: (result: SearchResult) => void;
}) => {
  return (
    <CommandItem
      onSelect={() => onSelectModulResult(modul)}
      onClick={() => onSelectModulResult(modul)}
      className="flex flex-col items-start py-3 cursor-pointer mt-2"
    >
      <div className="w-full justify-between flex flex-row">
        <div className="font-semibold text-sm mb-1">{modul.name}</div>
        <Badge variant="default" className="text-xs">
          Modul
        </Badge>
      </div>
      <Separator />
      <Accordion type="single" collapsible>
        <AccordionItem value="sub-events" className="border-none">
          <AccordionTrigger
            className="text-xs font-medium py-2 hover:no-underline w-full relative z-10 pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {modul.veranstaltungen.length} Veranstaltung
            {modul.veranstaltungen.length !== 1 ? "en" : ""}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1.5 pt-2">
              {modul.veranstaltungen.map((veranstaltung, idx) => {
                return (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      onSelectResult(veranstaltung);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  >
                    {String(veranstaltung.veranstaltung.name)}{" "}
                    <Badge variant="secondary" className="text-xs">
                      {veranstaltung.veranstaltung.typ}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                      {veranstaltung.veranstaltung.lehrende}
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CommandItem>
  );
};

const VeranstaltungItem = ({
  ev,
  onSelectResult,
  onSelectModuleByID,
}: {
  ev: SearchResult;
  onSelectResult: (result: SearchResult) => void;
  onSelectModuleByID: (moduleId: number) => void;
}) => {
  return (
    <CommandItem
      onSelect={() => onSelectResult(ev)}
      onClick={() => onSelectResult(ev)}
      className="border rounded-md flex flex-col items-stretch p-2 cursor-pointer w-full shadow-sm mt-2"
    >
      <div className="font-semibold text-sm mb-1">{ev.veranstaltung.name}</div>
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="secondary" className="text-xs">
          {ev.veranstaltung.typ}
        </Badge>
        <span className="text-xs text-muted-foreground">{ev.veranstaltung.stineId}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 italic line-clamp-1 w-full">{ev.veranstaltung.lehrende}</div>
      {ev.module && Array.isArray(ev.module) && ev.module.length > 0 && ev.module[0]?.name && (
        <Accordion type="single" collapsible>
          <AccordionItem value="sub-events" className="border-none">
            <AccordionTrigger
              className="text-xs w-full font-medium p-2 hover:no-underline relative z-10 pointer-events-auto bg-gray-200 rounded-md"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              Auch enthalten in {ev.module.length} Modul
              {ev.module.length !== 1 ? "e" : ""}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 p-2">
                {ev.module.map((modul, idx) => {
                  return (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        onSelectModuleByID(modul.id);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {String(modul.name)}{" "}
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </CommandItem>
  );
};

export function SearchDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  searchResults,
  modulResults,
  isSearching,
  onSelectResult,
  onSelectModulResult,
  onSelectModuleByID,
}: SearchDialogProps) {
  const allResults = [...searchResults, ...modulResults];

  const sortedAllResults = [...allResults].sort((a, b) => {
    const nameA = "veranstaltung" in a ? a.veranstaltung.name : a.name;
    const nameB = "veranstaltung" in b ? b.veranstaltung.name : b.name;
    const similarityA = stringSimilarity.findBestMatch(search.toLowerCase(), [nameA.toLowerCase()]).bestMatch.rating;
    const similarityB = stringSimilarity.findBestMatch(search.toLowerCase(), [nameB.toLowerCase()]).bestMatch.rating;
    return similarityB - similarityA;
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vorlesungsverzeichnis durchsuchen
          </DialogTitle>
          <DialogDescription>Suche nach Name, STiNE-ID, Lehrenden oder Typ (mind. 2 Zeichen)</DialogDescription>
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

          <ScrollArea>
            <Command>
              <CommandList>
                {search.trim().length > 0 && search.trim().length < 2 && (
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    Noch {2 - search.trim().length} Zeichen eingeben...
                  </CommandEmpty>
                )}

                {search.trim().length >= 2 &&
                  searchResults.length === 0 &&
                  modulResults.length === 0 &&
                  !isSearching && (
                    <CommandEmpty className="py-6 text-center text-sm">
                      Keine Veranstaltungen oder Module gefunden
                    </CommandEmpty>
                  )}

                {isSearching && (
                  <CommandEmpty className="py-6 text-center text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Suche läuft...
                  </CommandEmpty>
                )}

                {searchResults.length > 0 && (
                  <CommandGroup heading={`${allResults.length} Ergebnis${allResults.length !== 1 ? "se" : ""}`}>
                    {sortedAllResults.map((result) => {
                      if ("veranstaltung" in result) {
                        return (
                          <VeranstaltungItem
                            key={result.veranstaltung.id}
                            ev={result}
                            onSelectResult={onSelectResult}
                            onSelectModuleByID={onSelectModuleByID}
                          />
                        );
                      } else {
                        return (
                          <ModulItem
                            key={result.id}
                            modul={result}
                            onSelectModulResult={onSelectModulResult}
                            onSelectResult={onSelectResult}
                          />
                        );
                      }
                    })}
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
