/* ------------------ Imports ----------------- */
// Next.js
import type { Metadata } from "next"
// Components
import Header from "@/components/header"
// Other
import { Inter } from "next/font/google"
import "../style/globals.css"
import Web3Provider from "@/components/web3provider"

/* ----------------- Variables ---------------- */
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "SCRBL",
}

/* ----------------- Component ---------------- */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <Web3Provider>
                <body className={`bg-d-200 text-l-200 ${inter.className}`}>
                    <main className="min-h-screen min-w-[100vw] antialiased">
                        <Header />
                        {children}
                    </main>
                </body>
            </Web3Provider>
        </html>
    )
}
