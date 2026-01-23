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
    await fetch('/api/admin/reset', {
      method: 'POST',
      body: JSON.stringify({}),
    });
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
      </div>
    </>
  );
}
