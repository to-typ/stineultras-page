import { describe, expect, test } from "bun:test";
import { VeranstaltungsTyp } from "@prisma/client";
import {
  findSubmenus,
  findTermine,
  findUebungsgruppen,
  findVeranstaltungen,
  getUebungsgruppeData,
  getVeranstaltungData,
} from "@/lib/crawler/parse";

describe("findSubmenus", () => {
  test("liest Titel und Href aus der auditRegistrationList", () => {
    const html = `
      <ul class="auditRegistrationList" id="x">
        <li><a class="auditRegNodeLink" href="/a?x=1&amp;y=2"> Informatik </a></li>
        <li><a class="auditRegNodeLink" href="/b"> Mathematik </a></li>
      </ul>`;

    expect(findSubmenus(html)).toEqual([
      { title: "Informatik", href: "/a?x=1&y=2" },
      { title: "Mathematik", href: "/b" },
    ]);
  });

  test("liefert eine leere Liste, wenn keine Liste vorhanden ist", () => {
    expect(findSubmenus("<html><body>nichts</body></html>")).toEqual([]);
  });
});

describe("findVeranstaltungen", () => {
  test("liest Name und URL aus den eventLink-Ankern", () => {
    const html = `
      <a name="eventLink" href="/kurs?id=1&amp;s=2"> 64-100 Mathematik I </a>
      <a name="eventLink" href="/kurs?id=2"> 64-101 Analysis </a>`;

    expect(findVeranstaltungen(html)).toEqual([
      { name: "64-100 Mathematik I", url: "/kurs?id=1&s=2" },
      { name: "64-101 Analysis", url: "/kurs?id=2" },
    ]);
  });
});

describe("findTermine", () => {
  test("zerlegt Datum, Zeit und Raum aus dem title-Attribut", () => {
    const html = `
      <div class="courseListCell dl-inner" title="Mo, 6. Okt. 2025 / 10:15 - 11:45 / Raum ABC 123" >
        <span class="nr">1<span></span></span>
      </div>`;

    expect(findTermine(html)).toEqual([
      {
        date: "2025-10-06",
        starttime: "10:15",
        endtime: "11:45",
        location: "Raum ABC 123",
        number: 1,
      },
    ]);
  });

  test("füllt einstellige Tage auf und übersetzt deutsche Monatskürzel", () => {
    const html = `
      <div class="courseListCell" title="Di, 3. Mär. 2026 / 08:00 - 09:30 / Online" >
        <span>12<span></span></span>
      </div>`;

    const termine = findTermine(html);
    expect(termine[0].date).toBe("2026-03-03");
    expect(termine[0].number).toBe(12);
  });

  test("überspringt Einträge ohne Raumangabe", () => {
    const html = `
      <div class="courseListCell" title="Mi, 7. Okt. 2025 / 10:15 - 11:45" >
        <span>1<span></span></span>
      </div>`;

    expect(findTermine(html)).toEqual([]);
  });
});

describe("findUebungsgruppen", () => {
  test("verbindet Gruppennamen mit dem zugehörigen Link", () => {
    const html = `
      <ul class="dl-ul-listview">
        <li>
          <p class="dl-ul-li-headline"><strong>Gruppe 1</strong></p>
          <a href="/gruppe?id=1&amp;x=2">
            Kleingruppe anzeigen
          </a>
        </li>
        <li>
          <p class="dl-ul-li-headline"><strong>Gruppe 2</strong></p>
          <a href="/gruppe?id=2"> Kleingruppe anzeigen </a>
        </li>
      </ul>`;

    expect(findUebungsgruppen(html)).toEqual([
      { name: "Gruppe 1", href: "/gruppe?id=1&x=2" },
      { name: "Gruppe 2", href: "/gruppe?id=2" },
    ]);
  });
});

describe("getVeranstaltungData", () => {
  test("liest StiNE-ID, Name, Typ, Stundenplanname und Lehrende", () => {
    const html = `
      <h1> 64-100 Mathematik I </h1>
      <span id="dozenten">Prof. Dr. Beispiel</span>
      <p>Veranstaltungsart:</p><div class="v"> Vorlesung
      </div>
      <p>Anzeige im Stundenplan: </p><div class="v"> Mathe I
      </div>`;

    expect(getVeranstaltungData(html)).toEqual({
      type: VeranstaltungsTyp.VORLESUNG,
      stineId: "64-100",
      name: "Mathematik I",
      stineName: "Mathe I",
      person: "Prof. Dr. Beispiel",
    });
  });

  test("fällt auf leere Werte und UNDEFINED zurück, wenn nichts passt", () => {
    expect(getVeranstaltungData("<html></html>")).toEqual({
      type: VeranstaltungsTyp.UNDEFINED,
      stineId: "",
      name: "",
      stineName: "",
      person: "",
    });
  });
});

describe("getUebungsgruppeData", () => {
  test("liest den Gruppennamen aus der Überschrift", () => {
    expect(getUebungsgruppeData('<h2 class="x"> Kleingruppe: Gruppe 1 </h2>')).toEqual({
      name: "Gruppe 1",
    });
  });

  test("liefert einen leeren Namen ohne passende Überschrift", () => {
    expect(getUebungsgruppeData("<h2>Etwas anderes</h2>")).toEqual({ name: "" });
  });
});
