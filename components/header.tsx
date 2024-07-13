"use client"

/* ------------------ Imports ----------------- */
// Next.js
import { usePathname } from "next/navigation"
import Link from "next/link"
// Web3
import { ConnectButton } from "@rainbow-me/rainbowkit"
// Other
import { twMerge } from "tailwind-merge"

export default function Header() {
	const pathname = usePathname()

	const primary = { active: "bg-ac border-ac", main: "bg-ac/30 border-ac text-l-100 hover:text-l-200" }
	const secondary = { active: "bg-d-100 border-d-100", main: "bg-d-100/30 border-d-100 text-l-100 hover:text-l-200" }

	const links = [
		{ href: "/", label: "Main", style: secondary },
		{ href: "/dashboard", label: "Dashboard", style: primary },
	]

	return (
		<header className="min-w-[100vw] h-14 relative z-50 top-0 flex-shrink-0 mb-6 bg-d-200/30 border-b-[1px] border-l-100/[0.2]">
			<div className="container h-full flex flex-row items-center gap-6">
				<h1 className="text-2xl font-bold [text-shadow:_1px_2px_0_rgb(0_0_0_/_40%)]">SCRBL</h1>

				<div className="min-w-[2px] h-[70%] bg-l-100/[0.2] mx-6"/>

				{links &&
					links.map(({ href, label, style }, i) => (
						<Link key="i" href={href} className={twMerge(
								"px-4 py-2 text-center text-l-200 font-semibold rounded-lg border-[1px] hover:brightness-125 active:scale-95 transition duration-200",
								pathname == href ? style.active : style.main
							)}
						>
							{label}
						</Link>
					))}

				<div className="min-w-[2px] h-[70%] bg-l-100/[0.2] ml-auto mr-2"/>

				<ConnectButton/>
			</div>
		</header>
	)
}
