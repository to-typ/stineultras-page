import { NextRequest, NextResponse } from "next/server";
import { listJobs, startJob } from "@/lib/crawl-jobs";
import type { CrawlJobTyp } from "@/types/crawl";

export async function GET() {
  return NextResponse.json(await listJobs());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const typ = body.typ as CrawlJobTyp;
  if (typ !== "VERANSTALTUNGEN" && typ !== "MODULE") {
    return NextResponse.json(
      { error: "typ muss VERANSTALTUNGEN oder MODULE sein." },
      { status: 400 },
    );
  }

  const semesterId = Number(body.semesterId);
  if (!Number.isInteger(semesterId)) {
    return NextResponse.json({ error: "semesterId fehlt oder ist ungültig." }, { status: 400 });
  }

  const result = await startJob({
    typ,
    semesterId,
    delayBaseMs: Number(body.delayBaseMs),
    delayJitterMs: Number(body.delayJitterMs),
  });

  if (result.ok) {
    return NextResponse.json(result.job, { status: 202 });
  }

  if (result.code === "BUSY") {
    const { active } = await listJobs();
    return NextResponse.json({ error: result.message, active }, { status: 409 });
  }

  const status = result.code === "NO_SEMESTER" ? 404 : 400;
  return NextResponse.json({ error: result.message }, { status });
}
