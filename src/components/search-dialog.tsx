import { ModulResult, SearchResult } from "@/types/planner";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
  searchResults: SearchResult[];
  modulResults: ModulResult[];
  isSearching: boolean;
  onSelectResult: (result: SearchResult) => void;
}

export function SearchDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  searchResults,
  modulResults,
  isSearching,
  onSelectResult,
}: SearchDialogProps) {
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

          <ScrollArea className="">
            <Command>
              <CommandList>
                {search.trim().length > 0 && search.trim().length < 2 && (
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    Noch {2 - search.trim().length} Zeichen eingeben...
                  </CommandEmpty>
                )}

                {search.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                  <CommandEmpty className="py-6 text-center text-sm">Keine Veranstaltungen gefunden</CommandEmpty>
                )}

                {isSearching && (
                  <CommandEmpty className="py-6 text-center text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Suche läuft...
                  </CommandEmpty>
                )}

                {searchResults.length > 0 && (
                  <CommandGroup heading={`${searchResults.length} Ergebnis${searchResults.length !== 1 ? "se" : ""}`}>
                    {searchResults.map((ev) => (
                      <CommandItem
                        key={ev.veranstaltung.id + "-" + ev.veranstaltung.name}
                        onSelect={() => onSelectResult(ev)}
                        onClick={() => onSelectResult(ev)}
                        className="flex flex-col items-start py-3 cursor-pointer"
                      >
                        <div className="font-semibold text-sm mb-1">{ev.veranstaltung.name}</div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary" className="text-xs">
                            {ev.veranstaltung.typ}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{ev.veranstaltung.stineId}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 italic line-clamp-1 w-full">
                          {ev.veranstaltung.lehrende}
                        </div>
                        {ev.module && Array.isArray(ev.module) && ev.module.length > 0 && ev.module[0]?.name && (
                          <Accordion type="single" collapsible>
                            <AccordionItem value="sub-events" className="border-none">
                              <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
                                Auch enthalten in {ev.module.length} Modul
                                {ev.module.length !== 1 ? "e" : ""}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-1.5 pt-2">
                                  {ev.module.map((modul, idx) => {
                                    return <div key={idx}>{String(modul.name)} </div>;
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </ScrollArea>
          <ScrollArea className="">
            <Command>
              <CommandList>
                {search.trim().length > 0 && search.trim().length < 2 && (
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    Noch {2 - search.trim().length} Zeichen eingeben...
                  </CommandEmpty>
                )}

                {search.trim().length >= 2 && modulResults.length === 0 && !isSearching && (
                  <CommandEmpty className="py-6 text-center text-sm">Keine Module gefunden</CommandEmpty>
                )}

                {modulResults.length > 0 && (
                  <CommandGroup heading={`${modulResults.length} Modul${modulResults.length !== 1 ? "e" : ""}`}>
                    {modulResults.map((modul) => (
                      <CommandItem
                        key={modul.id}
                        //onSelect={() => onSelectResult(modul)}
                        //onClick={() => onSelectResult(modul)}
                        className="flex flex-col items-start py-3 cursor-pointer"
                      >
                        <div className="font-semibold text-sm mb-1">{modul.name}</div>
                        <Separator />
                        <Accordion type="single" collapsible>
                          <AccordionItem value="sub-events" className="border-none">
                            <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
                              {modul.veranstaltungen.length} Veranstaltung
                              {modul.veranstaltungen.length !== 1 ? "en" : ""}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1.5 pt-2">
                                {modul.veranstaltungen.map((veranstaltung, idx) => {
                                  return (
                                    <div key={idx}>
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
