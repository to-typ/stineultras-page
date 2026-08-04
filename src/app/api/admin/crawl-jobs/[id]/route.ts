import { NextResponse } from "next/server";
import { getJob } from "@/lib/crawl-jobs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(job);
}
