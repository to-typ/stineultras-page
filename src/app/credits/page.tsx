import Image from "next/image";

import betterStine from "/public/icons/betterstine.svg";
import logoWhite from "/public/stineultras-white.svg";
import Link from "next/link";

export default function Credits() {
  return (
    <div>
      <header
        className={`bg-ocean text-white flex gap-6 items-center justify-between px-4 h-24 py-4`}>
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
          </Link>
          <Image src={logoWhite} alt="STiNE Ultras" height={64} />
        </div>
      </header>
      <div className="flex flex-col items-end justify-end gap-4 text-white absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
        <div className="flex items-baseline">
          <p className="inline-block text-nowrap">ORIGINAL-THEME</p>
          <p className="inline-block sm:text-8xl text-7xl">
            <a href="https://uso.kkx.one/style/174975">@INTRES</a>
          </p>
        </div>
        <div className="flex items-baseline">
          <p className="inline-block ">SAFARI-APP</p>
          <p className="inline-block sm:text-8xl text-7xl">
            <a href="https://github.com/Momixxxxxxx">MORITZ </a>
          </p>
        </div>
        <div className="flex items-baseline">
          <p className="inline-block ">PAGE&THEME</p>
          <p className="inline-block sm:text-8xl text-7xl">
            <a href="https://github.com/to-typ">BEN </a>
          </p>
        </div>
      </div>
    </div>
  );
}
