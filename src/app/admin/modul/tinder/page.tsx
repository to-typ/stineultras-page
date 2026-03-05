"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardTitle } from "@/components/ui/card";
import { Check, Info, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface Veranstaltung {
  id: number;
  veranstaltung: {
    name: string;
  };
}

interface Modul {
  id: number;
  name: string;
  veranstaltungen: Veranstaltung[];
}

export default function Admin() {
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Modul[]>([]);
  const [modulId, setModulId] = useState<number>(0);
  const [modulData, setModulData] = useState<Modul | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchNextId() {
      if (modulData == null || modulData.name.toLowerCase().includes("modul")) {
        setLoading(true);
        const response = await fetch(`/api/admin/moduls?next=${modulId}`, {
          method: "GET",
        });
        const nextId = await response.json();
        setModulId(nextId.id ? nextId.id : modulId + 1);
      }
    }
    fetchNextId();
  }, [modulData]);

  useEffect(() => {
    if (modulId === 0) return;
    setLoading(true);
    fetch(`/api/admin/moduls?id=${modulId}`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => setModulData(Array.isArray(data) ? data[0] : data))
      .then(() => setLoading(false))
      .catch(() => {
        setLoading(false);
        // Handle error
      });
  }, [modulId]);

  const handleDeleteEmptys = async () => {
    const response = await fetch("/api/admin/moduls?empty=true", {
      method: "DELETE",
    });
    const result = await response.json();
    console.log(result);
  };

  const handleSearch = async () => {
    const response = await fetch(`/api/admin/moduls?search=${search}`, {
      method: "GET",
    });
    const result = await response.json();
    setSearchResults(result);
  };

  const handleDeleteAll = async () => {
    const ids = searchResults.map((m) => m.id);
    await fetch(`/api/admin/moduls?ids=${ids.join(",")}`, {
      method: "DELETE",
    });
    setSearchResults([]);
  };

  const handleNext = () => {
    setModulId(modulId + 1);
  };

  const handleDelete = async () => {
    await fetch(`/api/admin/moduls?id=${modulId}`, {
      method: "DELETE",
    });
    handleNext();
  };

  return (
    <>
      <div className="text-white flex flex-col m-8 gap-6 h-fit justify-center">
        <div className="flex flex-row gap-6">
          <Button onClick={handleDeleteEmptys} variant="destructive" className="w-1/2">
            Delete Emptys
          </Button>
          <Button onClick={handleSearch} className="w-1/2">
            Search
          </Button>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
        </div>

        {searchResults.length > 0 && (
          <>
            <div className="flex flex-row gap-2">
              <Button
                onClick={() => {
                  setSearchResults([]);
                  setSearch("");
                }}
                variant="outline"
                className="w-1/2 self-start text-gray-900"
              >
                Clear Search Results
              </Button>
              <Button onClick={handleDeleteAll} variant="destructive" className="w-1/2 self-end">
                Delete Search Results
              </Button>
            </div>
            <div className="flex flex-col gap-2 w-full items-center justify-center">
              {searchResults.map((modul) => (
                <Card key={modul.id} className="p-4 w-1/3 flex flex-row justify-between">
                  <div>
                    <CardTitle>{modul.name}</CardTitle>
                    <p>Anzahl Veranstaltungen: {modul.veranstaltungen.length}</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Info className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-90">
                      {modul.veranstaltungen.map((veranstaltung: Veranstaltung) => (
                        <p className="py-1" key={veranstaltung.id}>
                          {veranstaltung.veranstaltung.name}
                        </p>
                      ))}
                    </PopoverContent>
                  </Popover>
                </Card>
              ))}
            </div>
          </>
        )}

        {!searchResults.length && (
          <>
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setModulId(Number((e.target as HTMLInputElement).value));
                }
              }}
              placeholder="Modul ID"
            />
            {modulData && (
              <div className="w-full items-center justify-center flex">
                <Card className="p-4 w-1/3 flex flex-row justify-between">
                  <div>
                    <CardTitle>{modulData.name}</CardTitle>
                    <p>Anzahl Veranstaltungen: {modulData.veranstaltungen.length}</p>
                    <p>ID: {modulData.id}</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Info className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-90">
                      {modulData.veranstaltungen.map((veranstaltung: Veranstaltung) => (
                        <p className="py-1" key={veranstaltung.id}>
                          {veranstaltung.veranstaltung.name}
                        </p>
                      ))}
                    </PopoverContent>
                  </Popover>
                </Card>
              </div>
            )}
            {loading && (
              <>
                <Label className="w-full text-center flex items-center justify-center gap-2">
                  Loading <Spinner />
                </Label>
              </>
            )}
            <div className="flex flex-row gap-4 h-full">
              <Button onClick={handleDelete} className="bg-red-500 w-1/2 h-48">
                <X style={{ width: 64, height: 64 }} />
              </Button>
              <Button onClick={handleNext} className="bg-green-500 w-1/2 h-48">
                <Check style={{ width: 64, height: 64 }} />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
