"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import Comparison from "./slider.js";
import {
  InstructionStep,
  NoInstruction,
  ChromePCSteps,
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
              Nicht für Chrome auf Mobilen Geräten verfügbar,<br></br> da es
              keine Browser Extensions in Chrome auf Mobilgeräten gibt.
            </p>
          </NoInstruction>
        </>
      );
    } else if (browser == "safariMac") {
      setContent(
        <>
          <NoInstruction>
            <p>
              Aktuell noch nicht für Safari auf Mac verfügbar, wir arbeiten dran
            </p>
          </NoInstruction>
        </>
      );
    } else if (browser == "safariiOS") {
      setContent(
        <>
          <NoInstruction>
            <p>
              Aktuell noch nicht für Safari auf iOS verfügbar, wir arbeiten dran
            </p>
          </NoInstruction>
        </>
      );
    }
  };

  return (
    <div>
      <div className="grid grid-rows-[5rem_1fr_100px] grid-cols-[1fr_2fr_1fr] items-center justify-items-center min-h-screen pb-9 gap-0 bg-gray-200 text-[#025392] font-[family-name:oswald]">
        <div className="fixed w-full bg-white row-start-1 row-end-3 col-start-1 col-end-3 ">
          <Comparison />
        </div>
        <div className="flex flex-col row-start-2 col-start-2 w-full items-center text-center sticky top-10 mb-16 drop-shadow-[0_0_10px_rgba(99,99,99,0.8)] z-10">
          <Image
            className="w-full max-w-xl h-auto"
            src="/stineultras1.svg"
            alt="stineultras"
            width={100}
            height={38}
            priority
          />
          <br></br>
        </div>
        <main className="flex flex-col w-full items-center justify-center gap-0 row-start-1 col-start-2">
          <div className="top-[90%] bg-gradient-to-b from-[#025392] to-[#0271bb] rounded-md border-2 border-[#025392] left-0 w-full h-auto text-center items-center justify-center z-30 absolute p-1.5 text-blue-50 text-black">
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
                onClick={() => handleButton("safariMac")}
                className="m-1 border-solid border-2 p-2 text-xl"
              >
                Safari/Mac
              </button>
              <button
                onClick={() => handleButton("safariiOS")}
                className="m-1 border-solid border-2 p-2 text-xl"
              >
                Safari/iOS
              </button>
            </div>
            <div className="flex w-full relative grid grid-cols-[1fr_2fr_1fr] items-center justify-center">
              <div className="m-1 col-start-2">{content}</div>
              <div className="m-1 col-start-3 absolute text-right bottom-0 right-0">
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
                  className="float-right mt-1"
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
        <div className="row-start-3 col-start-1 col-end-4 w-[100%] grid grid-cols-3 grid-cols-[50px_1fr_50px] gap-0 flex-wrap items-center justify-center">
          <a className="relative sm:col-start-2 sm:col-end-2 col-start-1 col-end-3 items-center gap-0 text-4xl font-[600] text-center z-10 drop-shadow-[0_0_10px_rgba(99,99,99,0.8)] ">
            Stine ist scheiße. Mach es dir zumindest ein bisschen hübscher.
          </a>
        </div>
      </div>
    </div>
  );
}
