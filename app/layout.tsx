import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "VibeMatch" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link
          href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-neutral-200 font-sans">{children}</body>
    </html>
  );
}
