"use client";

import { useEffect, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderHandle,
  ReactCompareSliderImage,
  useReactCompareSliderRef,
} from "react-compare-slider";

export default function Slider() {
  const reactCompareSliderRef = useReactCompareSliderRef();
  const [transition, setTransition] = useState("1s cubic-bezier(0, 0, 1, 1)");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (reactCompareSliderRef.current) {
      const slider = reactCompareSliderRef.current;
      setTimeout(() => {
        slider.setPosition(100);
      }, 0);
      setTimeout(() => {
        slider.setPosition(50);
        setTransition("none");
      }, 1500);
    }

    setIsMobile(window.innerWidth < 768);
  }, [reactCompareSliderRef]);

  return (
    <ReactCompareSlider
      ref={reactCompareSliderRef}
      position={0}
      transition={transition}
      handle={
        <ReactCompareSliderHandle
          buttonStyle={{
            width: isMobile ? "40px" : "56px",
            height: isMobile ? "40px" : "56px",
          }}
        />
      }
      itemOne={<ReactCompareSliderImage src="/newStine.png" alt="Stine New" />}
      itemTwo={<ReactCompareSliderImage src="/oldStine.png" alt="Stine Old" />}
    />
  );
}
