"use client";

import Slider from "@/components/slider";
import Image from "next/image";

import logo from "/public/stineultras.svg";
import { useState } from "react";
import ChromeInstructions from "@/components/instructions/chrome";
import FirefoxInstructions from "@/components/instructions/firefox";
import SafariInstructions from "@/components/instructions/safari";

const browser = ["Chrome", "Firefox", "Safari"];

export default function Home() {
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>(null);

  return (
    <>
      <main className="flex flex-col w-full">
        <div className="sticky top-0">
          <div className="flex flex-col items-center gap-4 sm:hidden drop-shadow-primary pb-4 bg-white pt-4">
            <Image src={logo} alt="STiNE Ultras" className="w-4/5" />
            <div className="text-ocean text-center text-xl font-semibold">
              <p>STiNE ist scheiße!</p>
              <p>Mach es dir zumindest etwas hübscher.</p>
            </div>
          </div>
          <div className="relative">
            <Slider />
            <div className="hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 sm:flex drop-shadow-primary pointer-events-none">
              <Image src={logo} alt="STiNE Ultras" className="w-[40vw]" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-6 p-4 sm:p-8 bg-ocean rounded-t-lg z-20 will-change-transform">
          <h2 className="font-extrabold text-3xl text-white">Anleitungen</h2>
          <div className="flex gap-3">
            {browser.map((browser) => (
              <button
                key={browser}
                onClick={() => setSelectedBrowser(browser)}
                className={`py-2 px-3 border-2 rounded border-white duration-300 transition-[background-color,color] active:bg-opacity-50 ${
                  selectedBrowser === browser
                    ? "text-ocean bg-white"
                    : "text-white hover:bg-ocean-light"
                }`}>
                <span>{browser}</span>
              </button>
            ))}
          </div>
          {selectedBrowser === "Chrome" && <ChromeInstructions />}
          {selectedBrowser === "Firefox" && <FirefoxInstructions />}
          {selectedBrowser === "Safari" && <SafariInstructions />}
        </div>
      </main>
    </>
  );
}
