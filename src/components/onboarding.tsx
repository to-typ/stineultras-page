"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";
import Image from "next/image";
import stine from "/public/icons/betterstine.svg";
import { cn } from "@/lib/utils";

interface OnboardingProps {
  onComplete: () => void;
}

type Rect = { top: number; left: number; width: number; height: number };

type TourStep = {
  selector: string | null;
  title: string;
  text: string;
  arrowSide?: "top" | "bottom" | "left" | "right";
};

const STEPS: TourStep[] = [
  {
    selector: null,
    title: "Hallo! Ich bin STiNE! 👋",
    text: "Ich zeige dir kurz, wie du in ein paar Klicks deinen perfekten Stundenplan zusammenstellst. Keine Sorge — dauert nur eine Minute!",
  },
  {
    selector: '[data-tour="stundenplan-controls"]',
    title: "Deine Stundenpläne",
    text: "Hier legst du Stundenpläne an, benennst sie um und wechselst zwischen Semestern. Alles wird automatisch im Browser gespeichert.",
  },
  {
    selector: '[data-tour="search-button"]',
    title: "Kurse durchsuchen",
    text: "Klick hier, um direkt im STiNE-Vorlesungsverzeichnis zu suchen. Füge Kurse oder ganze Module mit einem Klick hinzu.",
  },
  {
    selector: '[data-tour="add-event-button"]',
    title: "Eigene Events",
    text: "Du kannst auch eigene Termine anlegen — z.B. Lerngruppen, Tutorien oder Mittagspausen.",
  },
  {
    selector: '[data-tour="event-list"]',
    title: "Deine Veranstaltungen",
    text: "Hier erscheinen alle Kurse. Blende einzelne Termine aus, passe Farben an und setze einen Stern ⭐, um Überschneidungen automatisch aufzulösen.",
  },
  {
    selector: '[data-tour="calendar-header"]',
    title: "Dein Wochenplan",
    text: "Das ist dein Stundenplan in Echtzeit. Überschneidungen erkennst du sofort — die Blöcke werden nebeneinander angezeigt.",
  },
  {
    selector: '[data-tour="share-export"]',
    title: "Teilen & Exportieren",
    text: "Hier kannst du deinen Stundenplan als Link teilen oder als ICS-Datei exportieren — kompatibel mit Google Calendar, Outlook und Apple Calendar.",
  },
  {
    selector: null,
    title: "Du bist startklar! 🎉",
    text: "Jetzt kennst du alles Wichtige. Viel Spaß beim Planen deines Semesters — ich drücke die Daumen!",
  },
];

const TOTAL = STEPS.length;
const SPOTLIGHT_PAD = 10;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT_APPROX = 200;
const MASCOT_SIZE = 90;

function useSpotlight(selector: string | null) {
  const [rect, setRect] = useState<Rect | null>(null);

  const measure = useCallback(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - SPOTLIGHT_PAD,
      left: r.left - SPOTLIGHT_PAD,
      width: r.width + SPOTLIGHT_PAD * 2,
      height: r.height + SPOTLIGHT_PAD * 2,
    });
  }, [selector]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  return rect;
}

function computeTooltipPos(rect: Rect, vw: number, vh: number) {
  const margin = 16;
  const totalTooltipH = TOOLTIP_HEIGHT_APPROX + MASCOT_SIZE;
  const centerX = rect.left + rect.width / 2;

  // prefer below, fall back to above
  const spaceBelow = vh - rect.top - rect.height;
  const spaceAbove = rect.top;
  let top: number;
  let tail: "top" | "bottom";

  if (spaceBelow >= totalTooltipH + margin || spaceBelow >= spaceAbove) {
    top = rect.top + rect.height + SPOTLIGHT_PAD + margin;
    tail = "top";
  } else {
    top = rect.top - SPOTLIGHT_PAD - margin - totalTooltipH;
    tail = "bottom";
  }

  // Clamp vertically so tooltip never leaves viewport
  top = Math.max(margin, Math.min(top, vh - totalTooltipH - margin));

  let left = centerX - TOOLTIP_WIDTH / 2;
  left = Math.max(margin, Math.min(left, vw - TOOLTIP_WIDTH - margin));

  return { top, left, tail };
}

// Tail triangle SVG
function Tail({ direction }: { direction: "top" | "bottom" }) {
  if (direction === "top") {
    // pointing upward
    return (
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "10px solid white",
            filter: "drop-shadow(0 -1px 1px rgba(0,0,0,0.08))",
          }}
        />
      </div>
    );
  }
  return (
    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2">
      <div
        className="w-0 h-0"
        style={{
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "10px solid white",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08))",
        }}
      />
    </div>
  );
}

// Progress dots
function Dots({ total, current, onGoto }: { total: number; current: number; onGoto: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onGoto(i)}
          className={cn(
            "rounded-full transition-all duration-300 cursor-pointer",
            i === current ? "w-5 h-2 bg-[#0271bb]" : "w-2 h-2 bg-slate-300 hover:bg-slate-400",
          )}
          aria-label={`Schritt ${i + 1}`}
        />
      ))}
    </div>
  );
}

// Welcome / Done step — centered modal
function CenteredCard({
  step,
  stepIndex,
  total,
  onNext,
  onSkip,
  onGoto,
  isLast,
}: {
  step: TourStep;
  stepIndex: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  onGoto: (i: number) => void;
  isLast: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />
      <div className="relative z-10 flex flex-col items-center gap-0 onboarding-scale-in">
        {/* Mascot */}
        <div className="onboarding-icon-float drop-shadow-xl">
          <Image src={stine} alt="BetterSTiNE Maskottchen" width={160} height={160} priority />
        </div>
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden -mt-4">
          {/* Blue header bar */}
          <div className="h-2 bg-gradient-to-r from-[#025392] to-[#0271bb]" />
          <div className="px-6 pt-5 pb-4">
            <h2 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>
          </div>
          <div className="px-6 pb-5 flex items-center justify-between">
            <Dots total={total} current={stepIndex} onGoto={onGoto} />
            <div className="flex items-center gap-2">
              {!isLast && (
                <button
                  onClick={onSkip}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Überspringen
                </button>
              )}
              <Button
                onClick={onNext}
                size="sm"
                className="bg-gradient-to-r from-[#025392] to-[#0271bb] hover:opacity-90 text-white gap-1.5"
              >
                {isLast ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Los geht&apos;s!
                  </>
                ) : (
                  <>
                    Weiter <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Spotlight step — tooltip near target
function SpotlightCard({
  step,
  stepIndex,
  total,
  spotRect,
  onNext,
  onPrev,
  onSkip,
  onGoto,
  isFirst,
  isLast,
}: {
  step: TourStep;
  stepIndex: number;
  total: number;
  spotRect: Rect;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onGoto: (i: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    const handler = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!vw) return null;

  const { top, left, tail } = computeTooltipPos(spotRect, vw, vh);
  const mascotOnTop = tail === "bottom"; // mascot is above when tooltip is above target

  return (
    <>
      {/* Dark overlay — blocks interaction outside spotlight */}
      <div className="fixed inset-0 z-[58] pointer-events-all" style={{ background: "transparent" }} />

      {/* Spotlight box */}
      <div
        className="fixed z-[59] rounded-xl pointer-events-none transition-all duration-400"
        style={{
          top: spotRect.top,
          left: spotRect.left,
          width: spotRect.width,
          height: spotRect.height,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
          outline: "2px solid rgba(2,113,187,0.6)",
          outlineOffset: "1px",
        }}
      />

      {/* Skip button (top-right) */}
      <button
        onClick={onSkip}
        className="fixed z-[61] top-4 right-4 p-1.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
        title="Tour beenden"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Tooltip + Mascot unit */}
      <div
        className="fixed z-[61] onboarding-slide-right"
        style={{ top, left, width: TOOLTIP_WIDTH }}
      >
        {/* Mascot above tooltip */}
        {mascotOnTop && (
          <div className="flex justify-end pr-4 onboarding-icon-float">
            <Image src={stine} alt="BetterSTiNE" width={MASCOT_SIZE} height={MASCOT_SIZE} />
          </div>
        )}

        {/* Speech bubble */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-visible">
          <Tail direction={tail} />
          {/* Blue top accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#025392] to-[#0271bb] rounded-t-2xl" />
          <div className="px-5 pt-4 pb-3">
            <p className="text-xs font-semibold text-[#0271bb] mb-0.5">
              {stepIndex + 1} / {total}
            </p>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">{step.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>
          </div>
          <div className="px-5 pb-4 flex items-center justify-between">
            <Dots total={total} current={stepIndex} onGoto={onGoto} />
            <div className="flex items-center gap-1.5">
              {!isFirst && (
                <Button variant="ghost" size="sm" onClick={onPrev} className="gap-1 text-slate-500 h-7 px-2">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Zurück
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
                className="h-7 px-3 bg-gradient-to-r from-[#025392] to-[#0271bb] hover:opacity-90 text-white gap-1"
              >
                {isLast ? "Fertig!" : <>Weiter <ChevronRight className="w-3.5 h-3.5" /></>}
              </Button>
            </div>
          </div>
        </div>

        {/* Mascot below tooltip */}
        {!mascotOnTop && (
          <div className="flex justify-end pr-4 onboarding-icon-float">
            <Image src={stine} alt="BetterSTiNE" width={MASCOT_SIZE} height={MASCOT_SIZE} />
          </div>
        )}
      </div>
    </>
  );
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const step = STEPS[stepIndex];
  const spotRect = useSpotlight(step.selector);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOTAL - 1;
  const isCentered = step.selector === null;

  const handleComplete = useCallback(() => {
    setIsExiting(true);
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const goTo = useCallback(
    (i: number) => {
      setAnimKey((k) => k + 1);
      setStepIndex(i);
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (isLast) handleComplete();
    else goTo(stepIndex + 1);
  }, [isLast, stepIndex, goTo, handleComplete]);

  const handlePrev = useCallback(() => {
    if (!isFirst) goTo(stepIndex - 1);
  }, [isFirst, stepIndex, goTo]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleComplete();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev, handleComplete]);

  if (isExiting) return null;

  // If selector given but element not found yet, fallback to centered
  const showCentered = isCentered || (step.selector !== null && !spotRect);

  if (showCentered) {
    return (
      <CenteredCard
        key={animKey}
        step={step}
        stepIndex={stepIndex}
        total={TOTAL}
        onNext={handleNext}
        onSkip={handleComplete}
        onGoto={goTo}
        isLast={isLast}
      />
    );
  }

  return (
    <SpotlightCard
      key={animKey}
      step={step}
      stepIndex={stepIndex}
      total={TOTAL}
      spotRect={spotRect!}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={handleComplete}
      onGoto={goTo}
      isFirst={isFirst}
      isLast={isLast}
    />
  );
}
