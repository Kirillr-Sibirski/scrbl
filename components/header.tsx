"use client";

/* ------------------ Imports ----------------- */
// Next.js
import { usePathname } from "next/navigation";
import Link from "next/link";
// Other
import { twMerge } from "tailwind-merge";

export default function Header() {
    const pathname = usePathname();
    const links = [
        { href: "/", label: "Main" },
        { href: "/dashboard", label: "Dashboard", styleOverwrite: "" },
    ]

    return(
        <header className="min-w-[100vw] h-14 top-0 mb-6 bg-d-200/30 border-b-[1px] border-l-100/[0.2]">
            <div className="container h-full flex flex-row items-center gap-6">
                <h1 className="text-2xl font-bold [text-shadow:_1px_2px_0_rgb(0_0_0_/_40%)]">SCRBL</h1>

                <div className="min-w-[2px] h-[70%] bg-l-100/[0.2] mx-6"></div>

                {links &&
                    links.map(({href, label, styleOverwrite: style}, i) => 
                    <Link key="i" href={href} className={twMerge(
                        "px-4 py-2 text-center text-l-200 font-semibold rounded-lg border-[1px] transition duration-200 active:scale-95 active:duration-75",
                        pathname == href ? "bg-ac border-ac" : "text-l-100 hover:text-l-200 bg-d-100/30 border-d-100 hover:brightness-125"
                    )}>
                        {label}
                    </Link>
                )}
            </div>
        </header>
    );
}