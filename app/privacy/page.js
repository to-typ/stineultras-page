"use client";

export default function Privacy() {
  return (
    <div className="h-screen bg-gradient-to-b from-[#025392] to-[#0271bb] font-[family-name:oswald] ">
      <p className="text-3xl">Privacy policy</p>
      <br></br>
      <p className="text-2xl"> Person responsible </p>
      <p>Responsible for the app "STiNE Ultras" is</p>
      <p> Moritz Liedtke </p>
      <p>Borgfelder Straße 16 </p>
      <p>20537 Hamburg </p>
      <p>Germany </p>
      <p>info@moritzliedtke.com </p>
      <br></br>
      <p className="text-2xl">Collection and processing of data</p>
      <p> This app does not collect, store or process any personal data.</p>
      <br></br>
      <p>
        {" "}
        The Safari extension merely changes the appearance of certain websites
        by adapting the CSS code. No data is collected, stored or passed on from
        or about the user.
      </p>
      <br></br>
      <p className="text-2xl"> External services</p>
      <p>
        {" "}
        This app does not use any external services, analysis tools or APIs that
        could collect data.
      </p>
      <br></br>
      <p className="text-2xl">Changes to the privacy policy</p>
      <p>
        {" "}
        If changes are made to the functionality of the app that require the
        collection or processing of data, this privacy policy will be updated
        accordingly.{" "}
      </p>
      <br></br>
      <p>
        If you have any questions or concerns about the privacy policy, please
        contact us at{" "}
      </p>
      <p>info@moritzliedtke.com</p>
    </div>
  );
}
