import DesktopNav from "@/components/DesktopNav";
import MobileNav from "@/components/MobileNav";
import MessagesPill from "@/components/MessagesPill";
import {Theme} from "@radix-ui/themes";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import "@radix-ui/themes/styles.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Instagram",
  description: "Share the moments you love with the people who matter most.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode,
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white selection:bg-neutral-800`}>
        <Theme appearance="dark">
          {modal}
          <div className="flex min-h-screen bg-black text-white">
            <DesktopNav />
            <div className="flex-1 md:pl-[72px] pb-20 md:pb-4 min-h-screen bg-black w-full">
              {children}
            </div>
          </div>
          <MobileNav />
          <MessagesPill />
        </Theme>
      </body>
    </html>
  );
}
