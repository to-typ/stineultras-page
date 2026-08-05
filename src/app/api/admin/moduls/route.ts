import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const stringSimilarity = require("string-similarity");

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (name) {
    const semesterId = parseInt(req.nextUrl.searchParams.get("semesterId") ?? "0");
    const filter = semesterId ? { semesterId } : {};
    const allModuls = await prisma.modul.findMany({ where: filter });
    const matches = allModuls.filter(
      (m) => stringSimilarity.compareTwoStrings(m.name.toLowerCase(), name.toLowerCase()) > 0.8,
    );
    const fullMatches = await prisma.modul.findMany({
      where: {
        id: {
          in: matches.map((m) => m.id),
        },
      },
      include: {
        veranstaltungen: {
          include: {
            veranstaltung: true,
          },
        },
      },
    });
    return NextResponse.json({ matches: fullMatches }, { status: 200 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    const search = req.nextUrl.searchParams.get("search");
    if (!search) {
      const next = req.nextUrl.searchParams.get("next");
      const semesterId = parseInt(req.nextUrl.searchParams.get("semesterId") ?? "0");
      const filter = semesterId ? { semesterId } : {};
      const moduls = await prisma.modul.findMany({ orderBy: { id: "asc" }, where: filter });
      if (next) {
        const nextId = parseInt(next);
        const nextModul = moduls.find((modul) => modul.id > nextId);
        return NextResponse.json({ id: nextModul?.id }, { status: 200 });
      }
      return NextResponse.json({ id: moduls[0]?.id }, { status: 200 });
    }
    return NextResponse.json(
      await prisma.modul.findMany({
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        include: {
          veranstaltungen: {
            include: {
              veranstaltung: true,
            },
          },
        },
      }),
    );
  }
  const modul = await prisma.modul.findUnique({
    where: { id: Number(id) },
    include: {
      veranstaltungen: {
        include: {
          veranstaltung: true,
        },
      },
    },
  });
  return NextResponse.json(modul);
}

export async function DELETE(req: NextRequest) {
  const empty = req.nextUrl.searchParams.get("empty");
  if (empty) {
    const emptyModuls = await prisma.modul.findMany({
      where: {
        veranstaltungen: {
          none: {},
        },
      },
    });
    const emptyModulIds = emptyModuls.map((modul) => modul.id);
    return NextResponse.json(
      await prisma.modul.deleteMany({
        where: {
          id: {
            in: emptyModulIds,
          },
        },
      }),
    );
  }

  const duplicates = req.nextUrl.searchParams.get("duplicates");
  if (duplicates) {
    const groupModules = await prisma.modul.groupBy({
      by: ["name"],
      _count: {
        name: true,
      },
    });
    const duplicateNames = groupModules.filter((group) => group._count.name > 1).map((group) => group.name);
    const duplicateModuls = await prisma.modul.findMany({
      where: {
        name: { in: duplicateNames },
      },
      include: {
        veranstaltungen: {
          include: { veranstaltung: true },
        },
      },
    });

    const trueDuplicates: { [name: string]: number[] } = {};
    for (const name of duplicateNames) {
      const modulsWithName = duplicateModuls.filter((modul) => modul.name === name);
      for (let i = 0; i < modulsWithName.length; i++) {
        for (let j = i + 1; j < modulsWithName.length; j++) {
          const modulA = modulsWithName[i];
          const modulB = modulsWithName[j];
          if (
            modulA.veranstaltungen
              .flatMap((v) => v.veranstaltung.id)
              .sort()
              .join(",") ===
            modulB.veranstaltungen
              .flatMap((v) => v.veranstaltung.id)
              .sort()
              .join(",")
          ) {
            if (!trueDuplicates[name]) {
              trueDuplicates[name] = [];
            }
            trueDuplicates[name].push(modulA.id);
            trueDuplicates[name].push(modulB.id);
          }
        }
      }
    }

    // delete duplicates, keeping the one with the lowest ID for each name
    const idsToDelete = Object.values(trueDuplicates).flatMap((ids) => {
      const minId = ids.reduce((min, id) => (id < min ? id : min), ids[0]);
      return ids.filter((id) => id !== minId);
    });

    const dryRun = req.nextUrl.searchParams.get("dryRun");
    if (dryRun != "true") {
      await prisma.$transaction([
        prisma.veranstaltungInModul.deleteMany({
          where: {
            modulId: {
              in: idsToDelete,
            },
          },
        }),
        prisma.modul.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        }),
      ]);
    }
    return NextResponse.json({ success: true, deletedIds: idsToDelete });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    const ids = req.nextUrl.searchParams.get("ids");
    if (!ids) {
      return NextResponse.json({ error: "id or ids parameter is required" }, { status: 400 });
    }

    const idArray = ids.split(",").map((id) => Number(id.trim()));

    await prisma.veranstaltungInModul.deleteMany({
      where: {
        modulId: {
          in: idArray,
        },
      },
    });
    await prisma.modul.deleteMany({
      where: {
        id: {
          in: idArray,
        },
      },
    });
    return NextResponse.json({ success: true, deletedIds: idArray });
  }

  await prisma.veranstaltungInModul.deleteMany({
    where: { modulId: Number(id) },
  });
  return NextResponse.json(
    await prisma.modul.delete({
      where: { id: Number(id) },
    }),
  );
}
