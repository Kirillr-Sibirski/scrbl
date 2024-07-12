/* ------------------ Imports ----------------- */
// Next.js
import type { Metadata } from "next";
// Components
import Header from "@/components/header";
// Web3
import { WagmiProvider } from "wagmi";
import { config } from "./config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Other
import { Inter } from "next/font/google";
import "../style/globals.css";


/* ----------------- Variables ---------------- */
const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient(); 


export const metadata: Metadata = {
  title: "SCRBL",
};


/* ----------------- Component ---------------- */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-d-200 text-l-200 ${inter.className}`}>
        <main className="min-h-screen min-w-[100vw] antialiased">
          <Header />
          {children}
        </main>
      </body>
    </html>
  );
}
