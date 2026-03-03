import { Veranstaltung, Termin, Uebungsgruppe } from "@prisma/client";

export enum Visibility {
  Visible,
  Hidden,
  Partial,
}

export type EventDate = {
  day: string;
  start: string;
  end: string;
  room?: string;
};

export type SubEvent = {
  name: string;
  shortname: string;
  active: Visibility;
  dates: EventDate[];
  prioritized?: boolean;
  hiddenByPriority?: boolean;
  icsName?: string;
};

export type Event = {
  id: number;
  name: string;
  shortname: string;
  active: Visibility;
  bgcolor: string;
  textcolor: string;
  info: SearchResult | null;
  events: SubEvent[];
  prioritized?: boolean;
  icsName?: string;
};

export type SearchResult = {
  veranstaltung: Veranstaltung;
  termine: Termin[] | null;
  uebungsgruppen:
    | {
        uebungsgruppe: Uebungsgruppe;
        termine: Termin[];
      }[]
    | null;
};
