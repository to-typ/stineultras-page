import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
        const search = req.nextUrl.searchParams.get("search");
        if (!search) {
            const next = req.nextUrl.searchParams.get("next");
            const moduls = await prisma.modul.findMany({orderBy: { id: "asc" }});
            if (next) {
                const nextId = parseInt(next);
                const nextModul = moduls.find((modul) => modul.id > nextId);
                return NextResponse.json(
                    {id: nextModul?.id}, { status: 200 }
                );  
            }
            return NextResponse.json(
                {id: moduls[0]?.id}, { status: 200 }
            )
        }
        return NextResponse.json(
            await prisma.modul.findMany({
                where: {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    }
                },
                include: {
                    veranstaltungen: {
                        include: {
                            veranstaltung: true,
                        },
                    },
                },
            })
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
            })
        );
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