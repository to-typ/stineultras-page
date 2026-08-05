"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardTitle } from "@/components/ui/card";
import { Check, Trash, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Semester {
  id: number;
  name: string;
}

export default function Admin() {
  const [semesterId, setSemesterId] = useState<Semester | null>(null);
  const [semesterOptions, setSemesterOptions] = useState<Semester[]>([]);
  const [modulId, setModulId] = useState<number>(0);
  const [modulData, setModulData] = useState<Modul | null>(null);
  const [matches, setMatches] = useState<Modul[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSemesterOptions() {
      // Admin-Endpunkt statt /api/semesters: der öffentliche filtert auf
      // isSelectable, ausgeblendete Semester hätten hier sonst keine Module.
      const response = await fetch("/api/admin/semesters", {
        method: "GET",
      });
      const data = await response.json();
      setSemesterOptions(data);
    }
    fetchSemesterOptions();
  }, []);

  useEffect(() => {
    async function fetchNextId() {
      if (modulData == null) {
        setLoading(true);
        const response = await fetch(
          `/api/admin/moduls?next=${modulId}${semesterId ? `&semesterId=${semesterId.id}` : ""}`,
          {
            method: "GET",
          },
        );
        const nextId = await response.json();
        setModulId(nextId.id ? nextId.id : modulId + 1);
      } else {
        setLoading(true);
        fetch(
          `/api/admin/moduls?name=${encodeURIComponent(modulData.name)}${
            semesterId ? `&semesterId=${semesterId.id}` : ""
          }`,
          {
            method: "GET",
          },
        )
          .then((res) => res.json())
          .then((data) => data.matches)
          .then((data) => setMatches(Array.isArray(data) ? data : [data]))
          .then(() => setLoading(false))
          .catch(() => {
            setLoading(false);
          });
      }
    }
    fetchNextId();
    // semesterId gehört dazu, sonst greift der Semesterfilter erst beim
    // nächsten Modulwechsel statt sofort beim Umschalten.
  }, [modulData, semesterId]);

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
      });
  }, [modulId]);

  const handleDelete = (id: number) => {
    fetch(`/api/admin/moduls?id=${id}`, {
      method: "DELETE",
    });
  };

  const handleNext = () => {
    setModulId(modulId + 1);
  };

  return (
    <>
      <div className="text-white flex flex-col m-8 gap-6 h-fit justify-center w-full">
        <Select
          value={semesterId ? String(semesterId.id) : undefined}
          onValueChange={(v) =>
            setSemesterId(
              semesterOptions.find((s) => s.id === Number(v)) || null,
            )
          }>
          <SelectTrigger className="w-[140px] h-8 text-xs flex-shrink-0">
            <SelectValue placeholder="Alle Semester" />
          </SelectTrigger>
          <SelectContent>
            {semesterOptions.map((d) => (
              <SelectItem
                key={d.id}
                value={d.id.toString()}
                className="text-xs">
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setModulId(Number((e.target as HTMLInputElement).value));
            }
          }}
          placeholder="Modul ID"
        />
        {modulData && (
          <div className="w-full items-center justify-center flex flex-col gap-4">
            <Card className="p-4 w-1/3 flex flex-row justify-between">
              <div>
                <CardTitle>{modulData.name}</CardTitle>
                <p>
                  Anzahl Veranstaltungen: {modulData.veranstaltungen.length}
                </p>
                <p>ID: {modulData.id}</p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Info className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-90">
                  {modulData.veranstaltungen.map(
                    (veranstaltung: Veranstaltung) => (
                      <p className="py-1" key={veranstaltung.id}>
                        {veranstaltung.veranstaltung.name}
                      </p>
                    ),
                  )}
                </PopoverContent>
              </Popover>
            </Card>
            <Separator />
            {matches.length > 0 &&
              matches.map((match) => (
                <Card
                  key={match.id}
                  className="p-4 w-1/3 flex flex-row justify-between">
                  <div>
                    <CardTitle>{match.name}</CardTitle>
                    <p>
                      Anzahl Veranstaltungen: {match.veranstaltungen.length}
                    </p>
                    <p>ID: {match.id}</p>
                  </div>
                  <div className="w-min gap-2 flex flex-col">
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(match.id)}>
                      <Trash className="h-5 w-5" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          <Info className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-90">
                        {match.veranstaltungen.map(
                          (veranstaltung: Veranstaltung) => (
                            <p className="py-1" key={veranstaltung.id}>
                              {veranstaltung.veranstaltung.name}
                            </p>
                          ),
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </Card>
              ))}
          </div>
        )}
        {!modulData && !loading && (
          <div className="w-full items-center justify-center flex">
            <p className="w-full text-center">Keine Daten gefunden</p>
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
          <Button onClick={handleNext} className="bg-green-500 w-full h-20">
            <Check style={{ width: 64, height: 64 }} />
          </Button>
        </div>
      </div>
    </>
  );
}
