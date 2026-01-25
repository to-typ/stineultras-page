'use client';

import Image from "next/image";

import betterStine from "/public/icons/betterstine.svg";
import logoWhite from "/public/stineultras-white.svg";
import Link from "next/link";

export default function Admin() {
  const seed = async () => {
    await fetch('/api/admin/seed', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  const reset = async () => {
    const response = await fetch('/api/admin/reset', {
      method: 'POST',
      body: JSON.stringify(""),
    });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
    alert(JSON.stringify(result, null, 2));
  }

  const crawl = async () => {
    const response = await fetch('/api/admin/crawl', {
      method: 'POST',
      body: JSON.stringify({semester: 'WiSe 25/26'}),
    });
    const result = await response.json();
    alert(JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    const jobIdInput = document.getElementById('jobId') as HTMLInputElement;
    jobIdInput.value = result.jobId;
  }

  const status = async () => {
    const jobIdInput = document.getElementById('jobId') as HTMLInputElement;
    const jobId = jobIdInput.value;
    const response = await fetch(`/api/admin/crawl?jobId=${jobId}`, {
      method: 'GET',  
    });
    const result = await response.json();
    alert(JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }

  return (
    <>
      <header
        className={`bg-ocean text-white flex gap-6 items-center justify-between px-4 h-24 py-4`}>
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
          </Link>
          <Image src={logoWhite} alt="STiNE Ultras" height={64} />
        </div>
      </header>
      <div className="text-white flex flex-col m-8 gap-6">
        <input type="button" value="Datenbank zurücksetzen" onClick={reset} className="bg-red-600 p-4 rounded-lg hover:bg-red-700 cursor-pointer"/>
        <input type="button" value="Seed-Daten neu einfügen" onClick={seed} className="bg-green-600 p-4 rounded-lg hover:bg-green-700 cursor-pointer"/>
        <input type="button" value="Daten von STiNE crawlen" onClick={crawl} className="bg-blue-600 p-4 rounded-lg hover:bg-blue-700 cursor-pointer"/>
        <input type="text" placeholder="Job ID" id="jobId" className="p-4 rounded-lg text-black"/>
        <input type="button" value="Crawl-Status prüfen" onClick={status} className="bg-yellow-600 p-4 rounded-lg hover:bg-yellow-700 cursor-pointer"/>
      </div>
    </>
  );
}
