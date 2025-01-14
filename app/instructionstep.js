import { useState, useRef } from "react";

export function InstructionStep({ label, stepNr, children }) {
  const [open, setOPen] = useState(false);
  const toggle = () => {
    setOPen(!open);
  };
  const contentRef = useRef();

  return (
    <div className="relative m-1 bg-[#025392] border-solid border-2 p-2 rounded-md">
      <div
        className="z-40 bg-[#025392] absolute left-[-1rem] top-[0rem] text-center border-solid border-2 p-1 rounded-full w-9 transition-[top] ease-in-out duration-900"
        style={open ? { top: "0.5rem" } : { top: "0rem" }}
      >
        {stepNr}
      </div>
      <button className="w-full" onClick={toggle}>
        {label}
      </button>

      <div
        className="absolute border-solid border-b-2 border-l-2 h-4 w-4 right-4 top-[0.7rem] rotate-45 pointer-events-none transition-[transform] duration-900"
        style={
          open
            ? { transform: "rotate(-45deg)" }
            : { transform: "rotate(45deg)" }
        }
      ></div>
      <div
        className="overflow-hidden h-0 transition-[height] ease-in-out duration-900"
        ref={contentRef}
        style={
          open
            ? { height: contentRef.current.scrollHeight + "px" }
            : { height: "0px" }
        }
      >
        <div className="p-1">{children}</div>
      </div>
    </div>
  );
}

export function InstructionStepNoExtend({ label, stepNr }) {
  return (
    <div className="relative m-1 bg-[#025392] border-solid border-2 p-2 rounded-md">
      <div className="z-40 bg-[#025392] absolute left-[-1rem] top-[0rem] text-center border-solid border-2 p-1 rounded-full w-9 transition-[top] ease-in-out duration-900">
        {stepNr}
      </div>
      <div>{label}</div>
    </div>
  );
}

export function NoInstruction(props) {
  return (
    <div className="relative m-1 grid grid-cols-[3rem_1fr_3rem] border-solid border-2 p-2 h-auto items-center rounded-md bg-[#025392]">
      <svg className="fill-white h-10 w-10 self-center" viewBox="0 0 270 270">
        <path
          d="M262.846,237.792L137.021,19.858c-1.072-1.856-3.053-3-5.196-3s-4.125,1.144-5.196,3L0.804,237.792
		c-1.072,1.856-1.072,4.144,0,6s3.053,3,5.196,3H257.65c2.144,0,4.125-1.144,5.196-3S263.918,239.649,262.846,237.792z
		 M16.392,234.792L131.825,34.858l115.433,199.935H16.392z"
        />
        <path
          d="M121.491,106.734l4.333,76.404c0.167,3.013,2.576,5.485,5.66,5.66c3.314,0.188,6.152-2.346,6.34-5.66l4.333-76.404
		c0.021-0.383,0.022-0.78,0-1.172c-0.324-5.707-5.213-10.071-10.919-9.747S121.168,101.027,121.491,106.734z"
        />
        <path
          d="M131.825,201.915c-1.58,0-3.13,0.64-4.24,1.76c-1.12,1.11-1.76,2.66-1.76,4.24s0.64,3.13,1.76,4.24
		c1.11,1.12,2.66,1.76,4.24,1.76s3.13-0.64,4.24-1.76c1.12-1.11,1.76-2.66,1.76-4.24s-0.64-3.13-1.76-4.24
		C134.955,202.555,133.405,201.915,131.825,201.915z"
        />
      </svg>
      <div className="p-1">{props.children}</div>
    </div>
  );
}

export function ChromePCSteps() {
  return (
    <div className="relative">
      <InstructionStep
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>
              Dowloade das{" "}
              <a
                href="https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:underline"
              >
                <img
                  className="inline-block h-[20px] mb-[2px]"
                  src="https://lh3.googleusercontent.com/2K8pc_5-2DkPam9b3oAWoITZ7IuIz68A5a8Ssg2_MNNHTPWPOPSBVTFdTmeVu9hi8GJxpKbvTekgwpeyGV6vXyBKH80=s60"
                ></img>{" "}
                Stylus Plugin
              </a>
            </div>
          </div>
        }
        stepNr={1}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      >
        <img
          className="inline-block h-[80px] mr-4"
          src="/install-stylus.png"
        ></img>{" "}
        <p className="inline-block">
          Mit dieser Browser Extension lässt sich das Aussehen von Websiten
          verändern.{" "}
        </p>
      </InstructionStep>

      <InstructionStep
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>
              Hole dir das{" "}
              <a
                href="https://userstyles.world/style/19373/stine-ultras-stine-theme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:underline"
              >
                <img
                  className="inline-block h-[20px] mb-[2px]"
                  src="/betterstine.svg"
                ></img>{" "}
                STiNE Ultras STiNE Theme
              </a>
            </div>
          </div>
        }
        stepNr={2}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      >
        <img
          className="inline-block h-[80px] mr-4"
          src="/install-theme.png"
        ></img>{" "}
        <p className="inline-block">
          Dieses Theme ändern das Aussehen von STiNE.{" "}
        </p>
      </InstructionStep>
    </div>
  );
}

export function SafariSteps() {
  return (
    <div className="relative">
      <InstructionStepNoExtend
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>
              Dowloade die{" "}
              <a
                href="https://apps.apple.com/de/app/stine-ultras/id6738353951"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:underline"
              >
                <img
                  className="inline-block h-[20px] mb-[2px]"
                  src="/betterstine.svg"
                ></img>{" "}
                STiNE Ultras App
              </a>
              <br></br>
              {" (Alle weiteren Schritte werden auch in der App erklärt) "}
            </div>
          </div>
        }
        stepNr={1}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      ></InstructionStepNoExtend>
      <InstructionStep
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>Öffne die Safari Settings</div>
          </div>
        }
        stepNr={2}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      >
        <img className="inline-block h-[80px] mr-4" src="/step2s.png"></img>{" "}
      </InstructionStep>
      <InstructionStep
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>Gehe auf "Erweiterungen"</div>
          </div>
        }
        stepNr={3}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      >
        <img className="inline-block h-[80px] mr-4" src="/step3s.png"></img>{" "}
      </InstructionStep>
      <InstructionStep
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>Finde und aktiviere die "STiNE Ultras"-Erweiterung</div>
          </div>
        }
        stepNr={4}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      >
        <img className="inline-block h-[80px] mr-4" src="/step4s1.png"></img>{" "}
        <img className="inline-block h-[80px] mr-4" src="/step4s2.png"></img>{" "}
      </InstructionStep>
      <InstructionStepNoExtend
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>
              Gehe auf{" "}
              <a
                href="https://stine.uni-hambrg.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:underline"
              >
                stine.uni-hamburg.de
              </a>
              .
            </div>
          </div>
        }
        stepNr={5}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      ></InstructionStepNoExtend>
      <InstructionStep
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>Geh auf "Erweiterungen" -{">"} "Erweiterungen verwalten"</div>
          </div>
        }
        stepNr={6}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      >
        <img className="inline-block h-[80px] mr-4" src="/step6s1.png"></img>{" "}
        <img className="inline-block h-[80px] mr-4" src="/step6s2.png"></img>{" "}
      </InstructionStep>
      <InstructionStep
        label={
          <div className="grid grid-cols-[1fr_40px]">
            <div>Aktiviere "STiNE Ultras"</div>
          </div>
        }
        stepNr={7}
        className="m-1 border-solid border-2 p-1 rounded-md h-20"
      >
        <img className="inline-block h-[80px] mr-4" src="/step7s.png"></img>{" "}
      </InstructionStep>
      <NoInstruction>
        <p>
          Eine angepasste Version für Mobile Geräte ist in Planung, aber aktuell
          noch nicht in Arbeit
        </p>
      </NoInstruction>
    </div>
  );
}
