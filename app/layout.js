import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
}); /*
const oswaldRegular = localFont({
  src: "./fonts/Oswald-Regular.woff",
  variable: "--font-oswald-regular",
  weight: "100 900",
});*/

export const metadata = {
  title: "STiNE Ultras",
  description: "Modern & Updated Theme for STiNE - STiNE Ultras",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin
        ></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable}antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
