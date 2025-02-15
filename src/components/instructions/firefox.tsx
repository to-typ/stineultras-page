import InstructionStep from "../instructionstep";
import Image from "next/image";

import stylus from "/public/icons/stylus.png";
import betterstine from "/public/icons/betterstine.svg";

import installStylus from "/public/instructions/firefox/install-stylus.png";
import installTheme from "/public/instructions/chrome/install-theme.png";
import installTheme2 from "/public/instructions/chrome/install-theme-2.png";

export default function FirefoxInstructions() {
  return (
    <div className="w-full flex flex-col justify-center items-center gap-4">
      <InstructionStep
        step={1}
        short={
          <p>
            Installiere das Firefox-Addon{" "}
            <a
              href="https://addons.mozilla.org/de/firefox/addon/styl-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline">
              <Image
                src={stylus}
                alt="Stylus"
                width={20}
                height={20}
                className="inline-block"
              />{" "}
              Stylus
            </a>
          </p>
        }>
        <Image src={installStylus} alt="Install Stylus" className="rounded" />
        <p>
          Stylus ist ein Addon, mit dem sich das Aussehen bestimmter Webseiten
          verändern lässt.
        </p>
      </InstructionStep>
      <InstructionStep
        step={2}
        short={
          <p>
            Hole dir das{" "}
            <a
              href="https://userstyles.world/style/19373/stine-ultras-stine-theme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline">
              <Image
                src={betterstine}
                alt="Stylus"
                width={20}
                height={20}
                className="inline-block"
              />{" "}
              STiNE Ultras Theme
            </a>
          </p>
        }>
        <Image src={installTheme} alt="Install Theme" className="rounded" />
        <Image src={installTheme2} alt="Install Theme" className="rounded" />
      </InstructionStep>
      <InstructionStep
        step={3}
        short={
          <p>
            Gehe auf{" "}
            <a
              href="https://stine.uni-hamburg.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline">
              {" "}
              STiNE
            </a>{" "}
            – Fertig!
          </p>
        }
      />
    </div>
  );
}
