import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TosnosAI — Type and Talk",
  description: "Natural, multilingual, emotion-aware AI voice conversation platform.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#f3f5f9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
