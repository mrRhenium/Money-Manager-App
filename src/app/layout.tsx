import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Money Manager",
  description: "Expense & Budget Tracker PWA",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-font-size="compact"
      className={`${notoSans.variable} ${notoSansMono.variable} ${poppins.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="h-[100dvh] w-full relative flex flex-col">
        <Providers
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
