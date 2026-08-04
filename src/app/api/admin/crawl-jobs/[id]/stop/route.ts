import { NextResponse } from "next/server";
import { stopJob } from "@/lib/crawl-jobs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stopped = await stopJob(id);

  if (!stopped) {
    return NextResponse.json({ error: "Kein aktiver Job mit dieser ID." }, { status: 404 });
  }

  return NextResponse.json({ message: "Stopp angefordert." });
}
