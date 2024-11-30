import { useEffect } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
  useReactCompareSliderRef,
} from "react-compare-slider";

export default function Comparison() {
  const reactCompareSliderRef = useReactCompareSliderRef();

  useEffect(() => {
    const normalTransition = async () => {
      await new Promise((resolve) =>
        setTimeout(() => {
          reactCompareSliderRef.current?.setPosition(0);
          resolve(true);
        }, 750)
      );
      await new Promise((resolve) =>
        setTimeout(() => {
          reactCompareSliderRef.current?.setPosition(100);
          resolve(true);
        }, 750)
      );
      await new Promise((resolve) =>
        setTimeout(() => {
          reactCompareSliderRef.current?.setPosition(50);
          resolve(true);
        }, 750)
      );
    };
    normalTransition();
  }, []);

  return (
    <ReactCompareSlider
      ref={reactCompareSliderRef}
      transition="1s cubic-bezier(0,0,1,1)"
      position={0}
      handle={
        <ReactCompareSliderHandle
          style={{
            height: "160%",
          }}
        />
      }
      itemOne={<ReactCompareSliderImage src="/newStine.png" alt="Stine New" />}
      itemTwo={<ReactCompareSliderImage src="/oldStine.png" alt="Stine Old" />}
    />
  );
}
