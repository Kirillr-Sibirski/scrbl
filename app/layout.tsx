/* ------------------ Imports ----------------- */
// Next.js
import type { Metadata } from "next"
// Components
import Provider from "@/components/provider"
import Header from "@/components/header"
// Other
import { Inter } from "next/font/google"
import "@rainbow-me/rainbowkit/styles.css"
import "../style/globals.css"

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
            <body className={`h-screen w-[100vw] antialiased bg-d-200 text-l-200 ${inter.className}`}>
                <Provider>
                    <Header />
                    {children}
                </Provider>
            </body>
        </html>
    )
}
