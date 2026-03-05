"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import betterStine from "/public/icons/betterstine.svg";
import logoWhite from "/public/stineultras-white.svg";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Check, Info, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Admin() {
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [modulId, setModulId] = useState<number>(0);
  const [modulData, setModulData] = useState<any>(null);

  useEffect(() => {
    // Fetch current admin session info
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.admin) {
          setAdminUsername(data.admin.username);
        }
      })
      .catch(() => {
        // Session expired or invalid, middleware will handle redirect
      });
  }, []);

  useEffect(() => {
    async function fetchNextId() {
      if(modulData == null) {
        console.log("No modul data, skipping next id fetch");
        console.log(modulId);
        console.log(modulData);
        const response = await fetch(`/api/admin/moduls?next=${modulId}`, {
          method: "GET",
        });
        const nextId = await response.json();
        console.log(nextId)
        setModulId(nextId.id ? nextId.id : modulId+1);
      }
    }
    fetchNextId();
  }, [modulData]);

  useEffect(() => {
    if (modulId === 0) return;
    fetch(`/api/admin/moduls?id=${modulId}`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => setModulData(Array.isArray(data) ? data[0] : data))
      .catch(() => {
        // Handle error
      });
  }, [modulId]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

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
  }

  const handleDeleteAll = async() => {
    const ids = searchResults.map((m) => m.id);
    await fetch(`/api/admin/moduls?ids=${ids.join(",")}`, {
      method: "DELETE",
    });
    setSearchResults([]);
  }

  const handleNext = () => {
    setModulId(modulId+1);
  }

  const handleDelete = async () => {
    await fetch(`/api/admin/moduls?id=${modulId}`, {
      method: "DELETE",
    });
    handleNext();
  };


  return (
    <>
      <header
        className={`bg-ocean text-white flex gap-6 items-center justify-between px-4 h-24 py-4`}>
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
          </Link>
          <Link href="/">
            <Image src={logoWhite} alt="STiNE Ultras" height={64} />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {adminUsername && (
            <span className="text-sm opacity-80">
              Angemeldet als: <strong>{adminUsername}</strong>
            </span>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/30">
            Abmelden
          </Button>
        </div>
      </header>
      <div className="text-white flex flex-col m-8 gap-6 h-fit justify-center">
        <div className="flex flex-row gap-6">
          <Button onClick={handleDeleteEmptys} className="w-1/2">Delete Emptys</Button>
          <Button onClick={handleSearch} className="w-1/2">Search</Button>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
        </div>

        {searchResults.length > 0 && (
          <>
            <Button onClick={() => setSearchResults([])} variant="outline" className="w-1/2 self-end">Clear Search Results</Button>
            <Button onClick={handleDeleteAll} variant="destructive" className="w-1/2 self-end">Delete Search Results</Button>
            <div className="flex flex-col gap-2">
              {searchResults.map((modul) => (
                <Card key={modul.id} className="p-4">
                  <CardTitle>{modul.name}</CardTitle>
                  <p>Anzahl Veranstaltungen: {modul.veranstaltungen.length}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline"><Info className="h-5 w-5" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-90">
                      {modul.veranstaltungen.map((veranstaltung: any) => (
                          <p className="py-1" key={veranstaltung.id} >{veranstaltung.veranstaltung.name}</p>
                      ))}
                    </PopoverContent>
                  </Popover>
                </Card>
              ))}
            </div>
          </>
        )}

        <Input value={modulId} onChange={(e) => setModulId(Number(e.target.value))} placeholder="Modul ID" />
        {modulData && (
          <div className="w-full items-center justify-center flex">
            <Card className="p-4 w-1/3 flex flex-row justify-between">
              <div>
                <CardTitle>{modulData.name}</CardTitle>
                <p>Anzahl Veranstaltungen: {modulData.veranstaltungen.length}</p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><Info className="h-5 w-5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-90">
                  {modulData.veranstaltungen.map((veranstaltung: any) => (
                      <p className="py-1" key={veranstaltung.id} >{veranstaltung.veranstaltung.name}</p>
                  ))}
                </PopoverContent>
              </Popover>
            </Card>
          </div>
        )}
        <div className="flex flex-row gap-4 h-full">
          <Button onClick={handleDelete} className="bg-red-500 w-1/2 h-48"><X style={{ width: 64, height: 64 }} /></Button>
          <Button onClick={handleNext} className="bg-green-500 w-1/2 h-48"><Check style={{ width: 64, height: 64 }} /></Button>
        </div>

      </div>
    </>
  );
}
