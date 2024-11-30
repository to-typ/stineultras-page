"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import Comparison from "./slider.js";
import {
  InstructionStep,
  NoInstruction,
  ChromePCSteps,
  SafariSteps,
} from "./instructionstep.js";
import Link from "next/link";

export default function Home() {
  const [content, setContent] = useState(<ChromePCSteps />);

  const handleButton = (browser) => {
    if (browser == "chromePC") {
      setContent(<ChromePCSteps />);
    } else if (browser == "chromeMobile") {
      setContent(
        <>
          <NoInstruction>
            <p>
              Nicht für Chrome auf Mobilen Geräten verfügbar, da es keine
              Browser Extensions in Chrome auf Mobilgeräten gibt.
            </p>
          </NoInstruction>
        </>
      );
    } else if (browser == "safari") {
      setContent(<SafariSteps />);
    }
  };

  return (
    <div>
      <div className="grid sm:grid-rows-[5rem_1fr_100px] grid-rows-[10rem_1.4rem_10rem] grid-cols-[1fr_2fr_1fr] items-center justify-items-center min-h-screen pb-9 gap-0 bg-white text-[#025392] font-[family-name:oswald]">
        <div className="fixed sm:w-full w-[110%] sm:border-y-0 border-y-8 border-[#025392] sm:top-0 top-[16rem] bg-white row-start-1 row-end-3 row-start-2 col-start-1 col-end-3 ">
          <Comparison />
        </div>
        <div className="flex flex-col sm:row-start-2 row-start-1 col-start-2 w-full items-center text-center sticky sm:top-10 top-2 mb-16 drop-shadow-[0_0_10px_rgba(99,99,99,0.8)] z-10">
          <Image
            className="sm:w-full w-[150%] max-w-xl h-auto"
            src="/stineultras1.svg"
            alt="stineultras"
            width={100}
            height={38}
            priority
          />
          <br></br>
        </div>
        <main className="flex flex-col w-full items-center justify-center gap-0 row-start-1 col-start-2">
          <div className="sm:top-[90%] top-[29rem] bg-gradient-to-b from-[#025392] to-[#0271bb] rounded-md border-2 border-[#025392] left-0 w-full h-auto text-center items-center justify-center z-30 absolute p-1.5 text-blue-50 text-black">
            <h1 className="m-4 text-3xl font-extrabold">Anleitung:</h1>
            <div>
              <button
                onClick={() => handleButton("chromePC")}
                className="m-1 border-solid border-2 p-2 text-xl"
              >
                Chrome/PC
              </button>
              <button
                onClick={() => handleButton("chromeMobile")}
                className="m-1 border-solid border-2 p-2 text-xl"
              >
                Chrome/Mobile
              </button>
              <button
                onClick={() => handleButton("safari")}
                className="m-1 border-solid border-2 p-2 text-xl"
              >
                Safari
              </button>
            </div>
            <div className="flex w-full relative grid sm:grid-cols-[1fr_2fr_1fr] grid-cols-[1fr] sm:grid-rows-[1fr] grid-rows-[1fr_1fr] items-center justify-center">
              <div className="m-1 col-start-2">{content}</div>
              <div className="m-1 sm:col-start-3 col-start-2 sm:absolute text-center sm:text-right sm:bottom-0 sm:right-0">
                <Link href="/credits" className="m-1">
                  Credits
                </Link>
                <br></br>
                <Link href="/privacy" className="m-1">
                  Privacy
                </Link>
                <br></br>
                <a
                  href="https://apps.apple.com/us/app/stine-ultras/id6738353951?itscg=30200&itsct=apps_box_badge&mttnsubad=6738353951"
                  className="sm:float-right mt-1 flex justify-center"
                >
                  <img
                    src="/appstore.svg"
                    alt="Download on the App Store"
                    className="w-[184.5px] h-[61.5px] align-middle object-contain"
                  />
                </a>
              </div>
            </div>
          </div>
        </main>
        <div className="row-start-3 col-start-1 col-end-4 w-full h-full sm:h-auto flex sticky sm:static top-[11.5rem] justify-center">
          <a className="flex relative sm:text-4xl text-xl font-[600]  text-center z-10 drop-shadow-[0_0_10px_rgba(99,99,99,0.8)]">
            Stine ist scheiße.<br className="sm:hidden"></br> Mach es dir
            zumindest ein bisschen hübscher.
          </a>
        </div>
      </div>
    </div>
  );
}
