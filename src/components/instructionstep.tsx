"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { JSX, useRef, useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";

interface InstructionStepProps {
  step: number | StaticImageData;
  short: string | JSX.Element;
  children?: string | JSX.Element | JSX.Element[];
}

export default function InstructionStep({
  step,
  short,
  children,
}: InstructionStepProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      // Force a layout recalculation
      contentRef.current.style.display = "block";
      contentRef.current.style.height = "auto";
      const height = contentRef.current.scrollHeight;
      contentRef.current.style.display = "flex";
      contentRef.current.style.height = "0px";
      setContentHeight(height + 8);
    }
  }, [children]);

  return (
    <div
      className="w-[95%] md:w-4/5 xl:w-3/5 relative rounded border-2 border-white py-2 pl-5 pr-3 text-white"
      onClick={() => setIsOpen(!isOpen)}>
      <div
        className={`absolute top-1 -left-4 bg-ocean ${
          typeof step === "number" ? "border-white border-2" : ""
        }  text-white font-semibold rounded-full size-8 flex items-center justify-center text-center`}>
        {typeof step === "number" ? (
          step
        ) : (
          <Image src={step} alt="Step" className="size-8 -translate-x-[1px]" />
        )}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center justify-center w-full">{short}</div>
        {children && (
          <button className="text-white flex justify-center items-center rounded px-2 py-1">
            <FontAwesomeIcon
              icon={faChevronLeft}
              className={`${isOpen ? "-rotate-90" : ""} duration-300`}
            />
          </button>
        )}
      </div>
      {children && (
        <div
          className="overflow-hidden transition-[height,margin] ease-in-out duration-300 flex flex-col gap-2 justify-center items-center text-center"
          ref={contentRef}
          style={{
            height: `${isOpen ? contentHeight : 0}px`,
            marginTop: isOpen ? "8px" : "0px",
          }}>
          {children}
        </div>
      )}
    </div>
  );
}
