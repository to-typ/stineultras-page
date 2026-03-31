"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import stine from "/public/icons/betterstine.svg";
import { Button } from "@/components/ui/button";
import { Monitor, X } from "lucide-react";

const MOBILE_DISMISSED_KEY = "stineultras-mobile-dismissed";

export function MobileWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    const dismissed = localStorage.getItem(MOBILE_DISMISSED_KEY);
    if (isMobile && !dismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(MOBILE_DISMISSED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center p-4"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(2, 41, 82, 0.7)" }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden onboarding-scale-in">
        {/* Blue top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#025392] to-[#0271bb]" />

        {/* Mascot */}
        <div className="flex justify-center pt-6 pb-2">
          <div className="onboarding-icon-float">
            <Image src={stine} alt="STiNE" width={110} height={110} priority />
          </div>
        </div>

        <div className="px-6 pb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Monitor className="w-5 h-5 text-[#0271bb]" />
            <h2 className="text-lg font-bold text-slate-900">Für PC optimiert</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Der Stundenplan Editor ist aktuell noch nicht für Mobilgeräte optimiert. Für das beste Erlebnis empfehle ich dir, einen PC oder Laptop zu nutzen.
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2 mt-1">
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className="w-full gap-2 text-slate-500"
          >
            <X className="w-4 h-4" />
            Trotzdem hier weitermachen
          </Button>
        </div>
      </div>
    </div>
  );
}
