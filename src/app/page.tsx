"use client";

import Slider from "@/components/slider";
import Image from "next/image";

import logo from "/public/stineultras.svg";
import logoWhite from "/public/stineultras-white.svg";
import betterStine from "/public/icons/betterstine.svg";
import { useRef, useState } from "react";
import ChromeInstructions from "@/components/instructions/chrome";
import FirefoxInstructions from "@/components/instructions/firefox";
import SafariInstructions from "@/components/instructions/safari";
import { useEffect } from "react";

const browser = ["Chrome", "Firefox", "Safari"];

export default function Home() {
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>(null);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const instructionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Firefox")) {
      setSelectedBrowser("Firefox");
    } else if (userAgent.includes("Safari")) {
      setSelectedBrowser("Safari");
    } else {
      setSelectedBrowser("Chrome");
    }

    setTimeout(() => {
      setShouldFadeOut(true);
    }, 3000);

    // Einmaliges Scrollen nach 5 Sekunden
    const scrollTimeout = setTimeout(() => {
      if (instructionsRef.current) {
        const scrollPosition =
          instructionsRef.current.offsetTop - window.innerHeight * 0.9;
        window.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
      }
    }, 5000);

    // Cleanup
    return () => {
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      <main className="flex flex-col w-full">
        <div className="sticky top-0">
          <header
            className={`bg-ocean text-white flex gap-6 items-center justify-between `}
            style={{
              height: shouldFadeOut ? "96px" : "0px",
              paddingTop: shouldFadeOut ? "1rem" : "0",
              paddingBottom: shouldFadeOut ? "1rem" : "0",
              paddingLeft: "1rem",
              paddingRight: "1rem",
              transitionProperty: "height, padding",
              transitionDuration: "1000ms",
            }}>
            <div className="flex items-center gap-6">
              <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
              <Image src={logoWhite} alt="STiNE Ultras" height={64} />
            </div>
          </header>
          <div className="flex flex-col items-center gap-4 sm:hidden drop-shadow-primary pb-4 bg-white pt-4">
            <Image src={logo} alt="STiNE Ultras" className="w-4/5" />
            <div className="text-ocean text-center text-xl font-semibold">
              <p>STiNE ist scheiße!</p>
              <p>Mach es dir zumindest etwas hübscher.</p>
            </div>
          </div>
          <div className="relative">
            <Slider />
            <div
              className={`hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-8 sm:flex drop-shadow-primary pointer-events-none ${
                shouldFadeOut
                  ? "opacity-0 duration-[3000ms] transition-opacity"
                  : ""
              }`}>
              <Image src={logo} alt="STiNE Ultras" className="w-[40vw]" />
              <div className="text-ocean text-center text-4xl font-semibold">
                <p>STiNE ist scheiße!</p>
                <p>Mach es dir zumindest etwas hübscher.</p>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center gap-6 p-4 sm:p-8 bg-ocean rounded-t-lg z-20 will-change-transform"
          ref={instructionsRef}>
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
