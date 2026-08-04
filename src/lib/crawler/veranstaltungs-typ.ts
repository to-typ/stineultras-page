import { VeranstaltungsTyp } from "@prisma/client";

export function mapVeranstaltungsTyp(type: string): VeranstaltungsTyp {
  switch (type) {
    case "ABK-Kurse":
      return VeranstaltungsTyp.ABK_KURSE;
    case "Anleitung":
      return VeranstaltungsTyp.ANLEITUNG;
    case "Arbeitsgemeinschaften":
      return VeranstaltungsTyp.ARBEITSGEMEINSCHAFTEN;
    case "Begleitseminar":
      return VeranstaltungsTyp.BEGLEITSEMINAR;
    case "Berufspraktische Übung":
      return VeranstaltungsTyp.BERUFSPRAKTISCHE_UEBUNG;
    case "Blocklehrveranstaltung":
      return VeranstaltungsTyp.BLOCKLEHRVERANSTALTUNG;
    case "Blockpraktikum":
      return VeranstaltungsTyp.BLOCKPRAKTIKUM;
    case "EDV-Tutorien":
      return VeranstaltungsTyp.EDV_TUTORIEN;
    case "Einführungskurs":
      return VeranstaltungsTyp.EINFUEHRUNGSKURS;
    case "Einführungsvorlesung":
      return VeranstaltungsTyp.EINFUEHRUNGSVORLESUNG;
    case "Ergänzende Sprachlehrveranstaltung":
      return VeranstaltungsTyp.ERGAENZENDE_SPRACHLEHRVERANSTALTUNG;
    case "Examenskolloquium":
      return VeranstaltungsTyp.EXAMENSKOLLOQUIUM;
    case "Exkursion":
      return VeranstaltungsTyp.EXKURSION;
    case "Exkursion/Praktikum":
      return VeranstaltungsTyp.EXKURSION_PRAKTIKUM;
    case "Förderkurs":
      return VeranstaltungsTyp.FOERDERKURS;
    case "Forschungskolloquium":
      return VeranstaltungsTyp.FORSCHUNGSKOLLOQUIUM;
    case "Forschungsseminar":
      return VeranstaltungsTyp.FORSCHUNGSSEMINAR;
    case "Geländepraktikum":
      return VeranstaltungsTyp.GELAENDEPRAKTIKUM;
    case "Geländepraktikum und Seminar":
      return VeranstaltungsTyp.GELAENDEPRAKTIKUM_UND_SEMINAR;
    case "Geländeübung":
      return VeranstaltungsTyp.GELAENDEUEBUNG;
    case "Geländeübung und Seminar":
      return VeranstaltungsTyp.GELAENDEUEBUNG_UND_SEMINAR;
    case "Große Exkursion":
      return VeranstaltungsTyp.GROSSE_EXKURSION;
    case "Großvorlesung":
      return VeranstaltungsTyp.GROSSVORLESUNG;
    case "Grundkurs":
      return VeranstaltungsTyp.GRUNDKURS;
    case "Halbtags-/Ganztagspraktikum":
      return VeranstaltungsTyp.HALBTAGS_GANZTAGS_PRAKTIKUM;
    case "Hauptseminar":
      return VeranstaltungsTyp.HAUPTSEMINAR;
    case "Hauptseminar/Vorlesung + Übung":
      return VeranstaltungsTyp.HAUPTSEMINAR_VORLESUNG_UEBUNG;
    case "Infoveranstaltung":
      return VeranstaltungsTyp.INFOVERANSTALTUNG;
    case "Integrierte Veranstaltung":
      return VeranstaltungsTyp.INTEGRIERTE_VERANSTALTUNG;
    case "Intensivkurs":
      return VeranstaltungsTyp.INTENSIVKURS;
    case "Interaktive Lehrveranstaltung":
      return VeranstaltungsTyp.INTERAKTIVE_LEHRVERANSTALTUNG;
    case "Kleine Exkursion":
      return VeranstaltungsTyp.KLEINE_EXKURSION;
    case "Kolloquium":
      return VeranstaltungsTyp.KOLLOQUIUM;
    case "Kompaktkurs":
      return VeranstaltungsTyp.KOMPAKTKURS;
    case "Kurspraktikum":
      return VeranstaltungsTyp.KURSPRAKTIKUM;
    case "Laborpraktikum":
      return VeranstaltungsTyp.LABORPRAKTIKUM;
    case "Lehrgang":
      return VeranstaltungsTyp.LEHRGANG;
    case "Lektürekurs":
      return VeranstaltungsTyp.LEKTUEREKURS;
    case "Lektüreseminar":
      return VeranstaltungsTyp.LEKTUERESEMINAR;
    case "Lesung":
      return VeranstaltungsTyp.LESUNG;
    case "Mittelseminar":
      return VeranstaltungsTyp.MITTELSEMINAR;
    case "Mittelseminar/Übung":
      return VeranstaltungsTyp.MITTELSEMINAR_UEBUNG;
    case "Mittelseminar/Übung/Vorleseung":
      return VeranstaltungsTyp.MITTELSEMINAR_UEBUNG_VORLESUNG;
    case "Musikalische Praxis":
      return VeranstaltungsTyp.MUSIKALISCHE_PRAXIS;
    case "Oberseminar":
      return VeranstaltungsTyp.OBERSEMINAR;
    case "Orientierungseinheit":
      return VeranstaltungsTyp.ORIENTIERUNGSEINHEIT;
    case "Praktikum":
      return VeranstaltungsTyp.PRAKTIKUM;
    case "Praktikum mit integriertem Seminar":
      return VeranstaltungsTyp.PRAKTIKUM_MIT_SEMINAR;
    case "Praktikumsseminar":
      return VeranstaltungsTyp.PRAKTIKUMSSEMINAR;
    case "Praxisbegleitseminar":
      return VeranstaltungsTyp.PRAXISBEGLEITSEMINAR;
    case "Praxisbezogene Einführung":
      return VeranstaltungsTyp.PRAXISBEZOGENE_EINFUEHRUNG;
    case "Projekt":
      return VeranstaltungsTyp.PROJEKT;
    case "Projekt + Seminar":
      return VeranstaltungsTyp.PROJEKT_SEMINAR;
    case "Projekt I":
      return VeranstaltungsTyp.PROJEKT_I;
    case "Projekt I/II":
      return VeranstaltungsTyp.PROJEKT_I_II;
    case "Projekt II":
      return VeranstaltungsTyp.PROJEKT_II;
    case "Projektseminar":
      return VeranstaltungsTyp.PROJEKTSEMINAR;
    case "Propädeutikum":
      return VeranstaltungsTyp.PROPAEDEUTIKUM;
    case "Proseminar":
      return VeranstaltungsTyp.PROSEMINAR;
    case "Prüfung":
      return VeranstaltungsTyp.PRUEFUNG;
    case "Ringvorlesung":
      return VeranstaltungsTyp.RINGVORLESUNG;
    case "Selbststudium":
      return VeranstaltungsTyp.SELBSTSTUDIUM;
    case "Seminar":
      return VeranstaltungsTyp.SEMINAR;
    case "Seminar I":
      return VeranstaltungsTyp.SEMINAR_I;
    case "Seminar Ia":
      return VeranstaltungsTyp.SEMINAR_IA;
    case "Seminar Ib":
      return VeranstaltungsTyp.SEMINAR_IB;
    case "Seminar II":
      return VeranstaltungsTyp.SEMINAR_II;
    case "Seminar III":
      return VeranstaltungsTyp.SEMINAR_III;
    case "Seminar/Exkursion":
      return VeranstaltungsTyp.SEMINAR_EXKURSION;
    case "Seminar/Übung":
      return VeranstaltungsTyp.SEMINAR_UEBUNG;
    case "Seminar/Übung/Vorlesung":
      return VeranstaltungsTyp.SEMINAR_UEBUNG_VORLESUNG;
    case "Seminar/Vorlesung":
      return VeranstaltungsTyp.SEMINAR_VORLESUNG;
    case "Sicht-/Hörtermin":
      return VeranstaltungsTyp.SICHT_HOERTERMIN;
    case "Sportkurs":
      return VeranstaltungsTyp.SPORTKURS;
    case "Sprachkurs":
      return VeranstaltungsTyp.SPRACHKURS;
    case "Sprachlehrveranstaltung":
      return VeranstaltungsTyp.SPRACHLEHRVERANSTALTUNG;
    case "Sprachlehrveranstaltung I":
      return VeranstaltungsTyp.SPRACHLEHRVERANSTALTUNG_I;
    case "Sprachlehrveranstaltung II":
      return VeranstaltungsTyp.SPRACHLEHRVERANSTALTUNG_II;
    case "Stilübung":
      return VeranstaltungsTyp.STILUEBUNG;
    case "Studie":
      return VeranstaltungsTyp.STUDIE;
    case "Translatorische Lehrveranstaltung":
      return VeranstaltungsTyp.TRANSLATORISCHE_LEHRVERANSTALTUNG;
    case "Translatorische Übung I":
      return VeranstaltungsTyp.TRANSLATORISCHE_UEBUNG_I;
    case "Translatorische Übung II":
      return VeranstaltungsTyp.TRANSLATORISCHE_UEBUNG_II;
    case "Tutorium":
      return VeranstaltungsTyp.TUTORIUM;
    case "Übung":
      return VeranstaltungsTyp.UEBUNG;
    case "Übung/Praktikum":
      return VeranstaltungsTyp.UEBUNG_PRAKTIKUM;
    case "Vertiefungsseminar":
      return VeranstaltungsTyp.VERTIEFUNGSSEMINAR;
    case "Vorlesung":
      return VeranstaltungsTyp.VORLESUNG;
    case "Vorlesung + Seminar":
      return VeranstaltungsTyp.VORLESUNG_SEMINAR;
    case "Vorlesung + Tutorium":
      return VeranstaltungsTyp.VORLESUNG_TUTORIUM;
    case "Vorlesung + Übung":
      return VeranstaltungsTyp.VORLESUNG_UEBUNG;
    case "Vorlesung/Seminar/Hauptseminar":
      return VeranstaltungsTyp.VORLESUNG_SEMINAR_HAUPTSEMINAR;
    case "Wissenschaftlicher Grundlagenkurs":
      return VeranstaltungsTyp.WISSENSCHAFTLICHER_GRUNDLAGENKURS;
    case "Wissenschaftliches Praktikum":
      return VeranstaltungsTyp.WISSENSCHAFTLICHES_PRAKTIKUM;
    case "Workshop":
      return VeranstaltungsTyp.WORKSHOP;

    default:
      return VeranstaltungsTyp.UNDEFINED;
  }
}
