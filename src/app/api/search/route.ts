import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, VeranstaltungsTyp } from "@prisma/client";
import { Veranstaltung, Termin, Uebungsgruppe } from "@prisma/client";

const prisma = new PrismaClient();

type SearchResult = {
        veranstaltung: Veranstaltung;
        termine: Termin[] | null;
        uebungsgruppen: [
            {
                uebungsgruppe: Uebungsgruppe;
                termine: Termin[];
            }
        ] | null;
    };

async function searchDB(search: string) {
    const results = [];
    const vResults = await prisma.veranstaltung.findMany({
        where: {
            name: {
                contains: search,
                mode: "insensitive",
            },
        },
    });
    for (const v of vResults) {
        if(v.typ === VeranstaltungsTyp.UEBUNG) {
            const uebungsgruppen = await prisma.uebungsgruppe.findMany({
                where: {
                    veranstaltungsId: v.id,
                },
            });
            const uebungsgruppenWithTermine = [];
            for (const u of uebungsgruppen) {
                const termine = await prisma.termin.findMany({
                    where: {
                        uebungsId: u.id,
                    },
                });
                uebungsgruppenWithTermine.push({
                    uebungsgruppe: u,
                    termine: termine,
                });
            }
            results.push({
                veranstaltung: v,
                termine: null,
                uebungsgruppen: uebungsgruppenWithTermine,
            });
        } else {
            const termine = await prisma.termin.findMany({
                where: {
                    veranstaltungsId: v.id, 
                },
            });
            results.push({
                veranstaltung: v,
                termine: termine,
                uebungsgruppen: null,
            });
        }
    }
    return results;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searched = await searchDB(url.searchParams.get("search") || "");
  console.log(searched);
  return NextResponse.json(searched);
}


