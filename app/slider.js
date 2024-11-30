import { useEffect , useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
  useReactCompareSliderRef,
} from "react-compare-slider";

export default function Comparison() {
  const reactCompareSliderRef = useReactCompareSliderRef();
  
  const [start, setStart] = useState(true);
  const transitionStyle = start ? "1s cubic-bezier(0,0,1,1)" : "none";

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
    setStart(false);
    normalTransition();
  }, []);

  return (
    <ReactCompareSlider
      ref={reactCompareSliderRef}
      transition="{transitionStyle}
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
