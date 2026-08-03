import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type JobStatus = "pending" | "running" | "completed" | "stopped" | "error";
type Job = {
  id: string;
  status: JobStatus;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  searchTree?: object;
};

const standardTimeout = 1000;
const randomTimeout = 1000;

const jobs = new Map<string, Job>();

let crawlStopFlag = false;

//Test URLs ------------------------------------------------
// const urlEventMenu = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AOIRQVyI3yOi8SRKgfbOi1I-EA5k6~IbrQQu3vIzBc29qLEaa7Ai6KxX0JJGoRM~8Bof92S3-heBl-4LDQW1AVVtQvhAh51sUMbIMvNOLYm-Jnoy9SsqOzPUvL6ZprWKCIey9Al2Yk6DmA3D5BjuiB22Yz1nzMGExUjKqia-Xh~TMgy4GK1XCpx3DdkaLNkI34a-rBDD3xn6R5Qc_';
// const urllowestMenu = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AawyuPmiQ-H8NpWhPylm4aQB9T5E8Ee0J~eToCr2JzXaaD4MOI0U5fClAZoVrpERdaRnm~KMJsWUsKmlA~B4-mUVnlbo9ko726uaHtyEHiBs1HSVIHM8VvHfRlBa7FBlagPxPZ9zcuIrLu7iv1rRaIdOZrvGz7gyvJF7GAcMhw-gyDstFmALTcbNR3bOOj80qg0uVIWkhENcHYlw_';
// const urlEvent = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N0,-N394345008561775,-N394345008583776,-N0,-N0,-N0';
// const urlSubgroup = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N391396481147841,-N394345008718797,-N394345008852800,-N0,-N000000000000000,-N0';
//----------------------------------------------------------

const stineBaseURL = "https://www.stine.uni-hamburg.de";
const stineURL2526 =
  "https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AyWhCKzswcs-c6Byp9xtolWBxvzFmFk0QpruFGBmRNFjlPz43J2ag0L5ha5-89vKhj2PvYDbIdNHfyXlIqS0Cb3gY7vrV-05CVsDJOmjltPkq6ijPzRVeUo9twJDU4IjTtgSJ0Afq0Cv4ClqOyuTKiMzzHYRORro8iznXvXszKJ~RxZSouhqsq~klyQ__";
const stineURL26 =
  "https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AKASswnuYGaqGHKVIEzr78JS8XTsQ2rjXfsNr0DDrEtf5z3fuUMOHbPtzKrF39qCiCCJS0jT9UUDe4yRDIvwHSpkmQPQmoTQCnSd78HQttnxA1jheEvE5DPnc8vdkNqgpTi1O1uRvibRV7CAnOxwZuZUlmcbrpHCIqSQVzFIcfmJe9NeoSYCefsFjOQ__";

//---------------------------------------------------
//    _____                    _
//   / ____|                  | |
//  | |     _ __ __ ___      _| | ___ _ __
//  | |    | '__/ _` \ \ /\ / / |/ _ \ '__|
//  | |____| | | (_| |\ V  V /| |  __/ |
//   \_____|_|  \__,_| \_/\_/ |_|\___|_|
//---------------------------------------------------

async function crawlSemester(semester: string, semesterId: number) {
  if (semester === null || semester === undefined || semester === "") {
    console.log(`Crawling menu: null semester`);
    return null;
  } else {
    let url = "";
    switch (semester) {
      case "WiSe 25/26":
        url = stineURL2526;
      case "SoSe 26":
        url = stineURL26;
    }
    if (url === "") {
      console.log(`Crawling menu: no url for semester ${semester}`);
      return;
    }

    return crawlMenu("Übersicht", url, semesterId);
  }
}

async function crawlMenu(name: string, url: string, semesterId: number): Promise<object> {
  if (url === null || url === undefined || url === "") {
    console.log(`Crawling menu: null url`);
    return {};
  } else {
    await new Promise((r) => setTimeout(r, standardTimeout + Math.random() * randomTimeout));
    console.log(`Crawling menu: ${url}`);

    const website = async () => {
      return await fetch(url, {
        method: "GET",
      });
    };
    const response = await website();
    const html = await response.text();

    if (!html.includes("auditRegistrationList" ) || html.includes("Veranstaltungen / Module")) {
      const modul = await prisma.modul.create({
          data: {
            name: name,
          },
        });

      const veranstaltungen = findVeranstaltungen(html);
      for (const veranstaltung of veranstaltungen) {
          const stineId = veranstaltung.name.split(" ")[0];
          await prisma.veranstaltung.updateMany({
            where: { stineId: stineId, },
            data: { url: stineBaseURL + veranstaltung.url, },
          });

          const updatedVeranstaltung = await prisma.veranstaltung.findFirst({
            where: { stineId: stineId, },
          });
          if(updatedVeranstaltung) {
            await prisma.veranstaltungInModul.create({
              data: {
                modul: {
                  connect: { id: modul.id, },
                },
                veranstaltung: {  
                  connect: { id: updatedVeranstaltung.id,},
                },
              },
            });
          }
        }
    }
    if (html.includes("auditRegistrationList")) {
      const submenuLinks = findSubmenus(html);
      const results = [];
      for (const submenu of submenuLinks) {
        if (crawlStopFlag) {
          return { submenus: results };
        }
        results.push(await crawlMenu(submenu.title, stineBaseURL + submenu.href, semesterId));
      }
      return { submenus: results };
    } 
    return {};
  }
}

//--------------------------------------------------
//   ______ _           _
//  |  ____(_)         | |
//  | |__   _ _ __   __| | ___ _ __
//  |  __| | | '_ \ / _` |/ _ \ '__|
//  | |    | | | | | (_| |  __/ |
//  |_|    |_|_| |_|\__,_|\___|_|
//---------------------------------------------------

function findSubmenus(html: string): Array<{ title: string; href: string }> {
  const links: Array<{ title: string; href: string }> = [];
  const listMatch = html.match(
    /<ul class="auditRegistrationList"[^>]*>([\s\S]*?)<\/ul>/,
  );

  if (!listMatch) {
    return links;
  }

  const listContent = listMatch[1];
  const linkRegex =
    /<a class="auditRegNodeLink" href="([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/g;

  let match;
  while ((match = linkRegex.exec(listContent)) !== null) {
    const href = match[1].replace(/&amp;/g, "&");
    const title = match[2].trim();
    links.push({
      title: title,
      href: href,
    });
  }
  return links;
}

function findVeranstaltungen(
  html: string,
): Array<{ name: string; url: string }> {
  const events: Array<{ name: string; url: string }> = [];
  const eventRegex =
    /<a name="eventLink"\s+href="([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/g;

  let match;
  while ((match = eventRegex.exec(html)) !== null) {
    const url = match[1].replace(/&amp;/g, "&");
    const name = match[2].trim();

    events.push({
      name: name,
      url: url,
    });
  }
  return events;
}

//--------------------------------------------------
//   _____                            _
//  |  __ \                          | |
//  | |__) |___  __ _ _   _  ___  ___| |_ ___
//  |  _  // _ \/ _` | | | |/ _ \/ __| __/ __|
//  | | \ \  __/ (_| | |_| |  __/\__ \ |_\__ \
//  |_|  \_\___|\__, |\__,_|\___||___/\__|___/
//                 | |
//                 |_|
//---------------------------------------------------

//Start crawl job
export async function POST(req: NextRequest) {
  const body = await req.json();

  const jobId = `job_${Date.now()}_${Math.random().toString(36)}`;
  jobs.set(jobId, {
    id: jobId,
    status: "pending",
    createdAt: new Date(),
  });

  (async () => {
    try {
      const job = jobs.get(jobId);
      if (job) {
        job.status = "running";
        jobs.set(jobId, job);
      }
      console.log(`Starting crawl job ${jobId} for semester ${body.semester}`);

      const semId = 5; //TODO

      await crawlSemester(body.semester, semId);

      const completedJob = jobs.get(jobId);
      if (completedJob) {
        if (crawlStopFlag) {
          completedJob.status = "stopped";
        } else {
          completedJob.status = "completed";
        }
        completedJob.completedAt = new Date();
        jobs.set(jobId, completedJob);
      }
    } catch (error) {
      const errorJob = jobs.get(jobId);
      if (errorJob) {
        errorJob.status = "error";
        errorJob.error =
          error instanceof Error ? error.message : "Unknown error";
        errorJob.completedAt = new Date();
        jobs.set(jobId, errorJob);
      }
    }
  })();

  return NextResponse.json(
    {
      jobId,
      status: "pending",
      message: "Crawl job started",
      statusUrl: `/api/admin/crawl?jobId=${jobId}`,
    },
    { status: 202 },
  );
}

//Status check
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { error: "jobId parameter is required" },
      { status: 400 },
    );
  }

  const job = jobs.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PUT() {
  crawlStopFlag = true;
  return NextResponse.json({ message: "Crawl stop requested" });
}
