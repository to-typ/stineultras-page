import Image from "next/image";

import betterStine from "/public/icons/betterstine.svg";
import logoWhite from "/public/stineultras-white.svg";
import Link from "next/link";

export default function Privacy() {
  return (
    <>
      <header
        className={`bg-ocean text-white flex gap-6 items-center justify-between px-4 h-24 py-4`}>
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-6">
            <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
            <Image src={logoWhite} alt="STiNE Ultras" height={64} />
          </Link>
        </div>
      </header>
      <div className="text-white flex flex-col m-8 gap-6">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>

        <section>
          <h2 className="text-xl font-semibold">Verantwortliche Person</h2>
          <p>Verantwortlich für die App &quot;STiNE Ultras&quot; ist</p>
          <br />
          <address>
            Moritz Liedtke <br />
            Borgfelder Straße 16 <br />
            20537 Hamburg <br />
            Deutschland <br />
            <a href="mailto:info@moritzliedtke.com">info@moritzliedtke.com</a>
          </address>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            Kontaktaufnahme per E-Mail
          </h2>
          <p>
            Wenn du mir eine E-Mail sendest, verarbeite ich deine E-Mail-Adresse und den Inhalt der Nachricht, um deine Anfrage zu beantworten.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
            Die Daten werden gelöscht, sobald sie für die Bearbeitung deiner Anfrage nicht mehr benötigt werden.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Rechte der Nutzer</h2>
          <p>
            Du hast das Recht auf:

            Auskunft über die gespeicherten Daten,

            Berichtigung oder Löschung,

            Einschränkung der Verarbeitung und

            Beschwerde bei einer Aufsichtsbehörde
          </p>
        </section>

     
      </div>
    </>
  );
}
