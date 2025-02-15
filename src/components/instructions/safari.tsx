import InstructionStep from "../instructionstep";
import Image from "next/image";

import betterstine from "/public/icons/betterstine.svg";
import appStore from "/public/appstore.svg";

export default function SafariInstructions() {
  return (
    <div className="w-full flex flex-col justify-center items-center gap-4">
      <InstructionStep
        step={1}
        short={
          <p>
            Installiere die{" "}
            <a
              href="https://apps.apple.com/de/app/stine-ultras/id6738353951"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline">
              <Image
                src={betterstine}
                alt="Stine Ultras Logo"
                width={20}
                height={20}
                className="inline-block"
              />{" "}
              STiNE Ultras App
            </a>
          </p>
        }>
        <a
          href="https://apps.apple.com/de/app/stine-ultras/id6738353951"
          target="_blank"
          rel="noopener noreferrer">
          <Image
            src={appStore}
            alt="Stine Ultras Logo"
            className="inline-block"
            width={200}
          />
        </a>
        <p>Installiere die STiNE Ultras App für MacOS, IPadOS und iOS.</p>
      </InstructionStep>
      <InstructionStep step={2} short={"Folge den Anweisungen in der App."} />
    </div>
  );
}
