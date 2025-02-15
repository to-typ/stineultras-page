export default function Privacy() {
  return (
    <div className="text-white flex flex-col m-8 gap-6">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>

      <section>
        <h2 className="text-xl font-semibold">Person Responsible</h2>
        <p>Responsible for the app &quot;STiNE Ultras&quot; is</p>
        <br />
        <address>
          Moritz Liedtke <br />
          Borgfelder Straße 16 <br />
          20537 Hamburg <br />
          Germany <br />
          <a href="mailto:info@moritzliedtke.com">info@moritzliedtke.com</a>
        </address>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Collection and Processing of Data
        </h2>
        <p>This app does not collect, store or process any personal data.</p>
        <p>
          The Safari extension merely changes the appearance of certain websites
          by adapting the CSS code. No data is collected, stored or passed on
          from or about the user.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">External Services</h2>
        <p>
          This app does not use any external services, analysis tools or APIs
          that could collect data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Changes to the Privacy Policy</h2>
        <p>
          If changes are made to the functionality of the app that require the
          collection or processing of data, this privacy policy will be updated
          accordingly.
        </p>
      </section>

      <section>
        <p>
          If you have any questions or concerns about the privacy policy, please
          contact us at{" "}
          <a href="mailto:info@moritzliedtke.com">info@moritzliedtke.com</a>.
        </p>
      </section>
    </div>
  );
}
